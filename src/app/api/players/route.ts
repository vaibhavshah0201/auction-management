import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlayers } from "@/lib/data";
import { resolveImageUrl, ageFromDob } from "@/lib/utils";
import type { PlayerStatus } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as PlayerStatus | null;
  const teamId = searchParams.get("teamId");
  const search = searchParams.get("search");
  const players = await getPlayers({
    status: status ?? undefined,
    teamId: teamId ?? undefined,
    search: search ?? undefined,
  });
  return NextResponse.json(players);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  // Auto-assign next srNo if not provided
  let srNo = body.srNo != null ? Number(body.srNo) : null;
  if (srNo == null) {
    const max = await prisma.player.aggregate({ _max: { srNo: true } });
    srNo = (max._max.srNo ?? 0) + 1;
  }

  const dob = body.dob ? new Date(body.dob) : null;
  const age =
    body.age != null
      ? Number(body.age)
      : dob && !isNaN(dob.getTime())
        ? ageFromDob(dob)
        : null;

  const player = await prisma.player.create({
    data: {
      srNo,
      name: body.name.trim(),
      blockNo: body.blockNo?.trim() || null,
      flatNo: body.flatNo?.trim() || null,
      dob: dob && !isNaN(dob.getTime()) ? dob : null,
      age,
      skill: body.skill || "ALL-ROUNDER",
      keyStrength: body.keyStrength?.trim() || null,
      lastOecl: Boolean(body.lastOecl),
      mobile: body.mobile?.trim() || null,
      photoUrl: resolveImageUrl(body.photoUrl),
      status: "AVAILABLE",
    },
  });
  return NextResponse.json(player, { status: 201 });
}
