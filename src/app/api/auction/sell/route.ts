import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Hammer / SOLD. Assigns the player to the winning team at the final amount.
 * If teamId+amount are passed explicitly they are used, otherwise the highest
 * recorded bid wins.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { playerId } = body;
  if (!playerId) {
    return NextResponse.json({ error: "playerId is required" }, { status: 400 });
  }

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }
  if (player.status !== "IN_AUCTION") {
    return NextResponse.json(
      { error: "Player is not currently in auction" },
      { status: 409 }
    );
  }

  let teamId: string | undefined = body.teamId;
  let amount: number | undefined =
    body.amount != null ? Number(body.amount) : undefined;

  if (!teamId || amount == null) {
    const highest = await prisma.bid.findFirst({
      where: { playerId },
      orderBy: { amount: "desc" },
    });
    if (!highest) {
      return NextResponse.json(
        { error: "No bids placed. Cannot sell. Mark unsold instead." },
        { status: 422 }
      );
    }
    teamId = highest.teamId;
    amount = highest.amount;
  }

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  const sold = await prisma.player.update({
    where: { id: playerId },
    data: { status: "SOLD", teamId, soldAmount: amount },
    include: { team: { select: { name: true, color: true } } },
  });

  // Clear auction block
  await prisma.auctionState.update({
    where: { id: "singleton" },
    data: { currentPlayerId: null },
  });

  return NextResponse.json({
    ok: true,
    player: {
      id: sold.id,
      name: sold.name,
      soldAmount: sold.soldAmount,
      teamName: sold.team?.name,
      teamColor: sold.team?.color,
    },
  });
}
