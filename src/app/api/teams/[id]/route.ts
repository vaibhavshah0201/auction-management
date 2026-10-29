import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  try {
    const team = await prisma.team.update({
      where: { id },
      data: {
        name: body.name?.trim(),
        shortName: body.shortName?.trim() ?? undefined,
        color: body.color,
        logoUrl: body.logoUrl,
        startingPurse:
          body.startingPurse != null ? Number(body.startingPurse) : undefined,
        squadSize: body.squadSize != null ? Number(body.squadSize) : undefined,
      },
    });
    return NextResponse.json(team);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to update team";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Release any players on this team back to the pool
    await prisma.player.updateMany({
      where: { teamId: id },
      data: { teamId: null, status: "AVAILABLE", soldAmount: null },
    });
    await prisma.team.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to delete team";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
