import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Put a player on the auction block. Clears any prior bids for a fresh round. */
export async function POST(req: NextRequest) {
  const { playerId } = await req.json();
  if (!playerId) {
    return NextResponse.json({ error: "playerId is required" }, { status: 400 });
  }

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }
  if (player.status === "SOLD") {
    return NextResponse.json(
      { error: "Player is already sold" },
      { status: 409 }
    );
  }

  // Reset any previous auction: set prior IN_AUCTION player back to AVAILABLE
  await prisma.player.updateMany({
    where: { status: "IN_AUCTION" },
    data: { status: "AVAILABLE" },
  });

  // Fresh round: clear existing bids for this player and mark IN_AUCTION
  await prisma.bid.deleteMany({ where: { playerId } });
  await prisma.player.update({
    where: { id: playerId },
    data: { status: "IN_AUCTION", teamId: null, soldAmount: null },
  });

  await prisma.auctionState.upsert({
    where: { id: "singleton" },
    update: { currentPlayerId: playerId },
    create: { id: "singleton", currentPlayerId: playerId },
  });

  return NextResponse.json({ ok: true });
}
