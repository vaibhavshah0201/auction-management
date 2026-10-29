import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Record a custom bid amount from a team on the active player. */
export async function POST(req: NextRequest) {
  const { playerId, teamId, amount } = await req.json();
  const bidAmount = Number(amount);

  if (!playerId || !teamId || !Number.isFinite(bidAmount)) {
    return NextResponse.json(
      { error: "playerId, teamId and a numeric amount are required" },
      { status: 400 }
    );
  }

  const [player, team, highest] = await Promise.all([
    prisma.player.findUnique({ where: { id: playerId } }),
    prisma.team.findUnique({ where: { id: teamId } }),
    prisma.bid.findFirst({
      where: { playerId },
      orderBy: { amount: "desc" },
    }),
  ]);

  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }
  if (player.status !== "IN_AUCTION") {
    return NextResponse.json(
      { error: "Player is not currently in auction" },
      { status: 409 }
    );
  }
  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  // No minimum/base price — any positive custom amount is allowed.
  if (bidAmount <= 0) {
    return NextResponse.json(
      { error: "Bid amount must be greater than zero" },
      { status: 422 }
    );
  }
  // A new bid still has to beat the current highest bid.
  if (highest && bidAmount <= highest.amount) {
    return NextResponse.json(
      { error: `Bid must be higher than the current bid (${highest.amount})` },
      { status: 422 }
    );
  }

  // The team still can't bid more than its remaining purse.
  const soldForTeam = await prisma.player.findMany({
    where: { teamId, status: "SOLD" },
    select: { soldAmount: true },
  });
  const spent = soldForTeam.reduce((s, p) => s + (p.soldAmount ?? 0), 0);
  const remaining = team.startingPurse - spent;
  if (bidAmount > remaining) {
    return NextResponse.json(
      {
        error: `${team.name} cannot afford this bid. Purse remaining: ${remaining}`,
      },
      { status: 422 }
    );
  }

  const bid = await prisma.bid.create({
    data: { playerId, teamId, amount: bidAmount },
    include: { team: { select: { name: true, color: true } } },
  });

  return NextResponse.json({
    id: bid.id,
    amount: bid.amount,
    teamId: bid.teamId,
    teamName: bid.team.name,
    teamColor: bid.team.color,
    createdAt: bid.createdAt.toISOString(),
  });
}
