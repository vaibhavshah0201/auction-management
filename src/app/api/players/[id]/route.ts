import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveImageUrl, ageFromDob } from "@/lib/utils";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  // If a DOB is supplied, store it and recompute age from it.
  let dob: Date | null | undefined = undefined;
  let ageFromBody: number | null | undefined = undefined;
  if (body.dob !== undefined) {
    const d = body.dob ? new Date(body.dob) : null;
    dob = d && !isNaN(d.getTime()) ? d : null;
    ageFromBody = ageFromDob(dob);
  } else if (body.age != null) {
    ageFromBody = Number(body.age);
  }

  try {
    // Captaincy is one-per-team: when marking this player captain, clear the
    // flag from the rest of their team first.
    if (body.isCaptain === true) {
      const existing = await prisma.player.findUnique({
        where: { id },
        select: { teamId: true },
      });
      if (existing?.teamId) {
        await prisma.player.updateMany({
          where: { teamId: existing.teamId, isCaptain: true },
          data: { isCaptain: false },
        });
      }
    }

    const player = await prisma.player.update({
      where: { id },
      data: {
        srNo: body.srNo != null ? Number(body.srNo) : undefined,
        name: body.name?.trim(),
        blockNo: body.blockNo?.trim() ?? undefined,
        flatNo: body.flatNo?.trim() ?? undefined,
        dob,
        age: ageFromBody,
        skill: body.skill,
        keyStrength: body.keyStrength?.trim() ?? undefined,
        lastOecl: body.lastOecl != null ? Boolean(body.lastOecl) : undefined,
        isCaptain:
          body.isCaptain != null ? Boolean(body.isCaptain) : undefined,
        mobile: body.mobile?.trim() ?? undefined,
        photoUrl:
          body.photoUrl !== undefined
            ? resolveImageUrl(body.photoUrl)
            : undefined,
        status: body.status,
      },
    });
    return NextResponse.json(player);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to update player";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.player.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to delete player";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
