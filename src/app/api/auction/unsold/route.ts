import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Mark the active player as UNSOLD and clear the block. */
export async function POST(req: NextRequest) {
  const { playerId } = await req.json();
  if (!playerId) {
    return NextResponse.json({ error: "playerId is required" }, { status: 400 });
  }

  await prisma.player.update({
    where: { id: playerId },
    data: { status: "UNSOLD", teamId: null, soldAmount: null },
  });
  await prisma.bid.deleteMany({ where: { playerId } });
  await prisma.auctionState.update({
    where: { id: "singleton" },
    data: { currentPlayerId: null },
  });

  return NextResponse.json({ ok: true });
}
