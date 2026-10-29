import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Reset a sold/unsold player back into the available pool, refunding the
 * team's purse automatically (since purse is derived from sold players).
 */
export async function POST(req: NextRequest) {
  const { playerId } = await req.json();
  if (!playerId) {
    return NextResponse.json({ error: "playerId is required" }, { status: 400 });
  }
  await prisma.player.update({
    where: { id: playerId },
    data: { status: "AVAILABLE", teamId: null, soldAmount: null },
  });
  await prisma.bid.deleteMany({ where: { playerId } });
  return NextResponse.json({ ok: true });
}
