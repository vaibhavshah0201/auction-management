import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Manually assign an existing player to this team (mark SOLD), bypassing the
 * live auction. Body: { playerId, amount?, isCaptain? }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: teamId } = await params;
  const body = await req.json();
  const playerId: string | undefined = body.playerId;
  const amount = body.amount != null ? Number(body.amount) : 0;

  if (!playerId) {
    return NextResponse.json({ error: "playerId is required" }, { status: 400 });
  }

  const [team, player] = await Promise.all([
    prisma.team.findUnique({ where: { id: teamId } }),
    prisma.player.findUnique({ where: { id: playerId } }),
  ]);
  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }
  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  // If marking as captain, clear any existing captain on this team.
  if (body.isCaptain === true) {
    await prisma.player.updateMany({
      where: { teamId, isCaptain: true },
      data: { isCaptain: false },
    });
  }

  const updated = await prisma.player.update({
    where: { id: playerId },
    data: {
      teamId,
      status: "SOLD",
      soldAmount: Number.isFinite(amount) ? amount : 0,
      isCaptain: body.isCaptain != null ? Boolean(body.isCaptain) : undefined,
    },
  });

  return NextResponse.json({ ok: true, player: updated });
}

/**
 * Remove a player from this team, returning them to the available pool.
 * Body: { playerId }
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: teamId } = await params;
  const body = await req.json().catch(() => ({}));
  const playerId: string | undefined = body.playerId;

  if (!playerId) {
    return NextResponse.json({ error: "playerId is required" }, { status: 400 });
  }

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player || player.teamId !== teamId) {
    return NextResponse.json(
      { error: "Player is not on this team" },
      { status: 404 }
    );
  }

  const updated = await prisma.player.update({
    where: { id: playerId },
    data: {
      teamId: null,
      status: "AVAILABLE",
      soldAmount: null,
      isCaptain: false,
    },
  });

  return NextResponse.json({ ok: true, player: updated });
}
