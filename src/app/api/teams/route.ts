import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTeams } from "@/lib/data";

export async function GET() {
  const teams = await getTeams();
  return NextResponse.json(teams);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  try {
    const team = await prisma.team.create({
      data: {
        name: body.name.trim(),
        shortName: body.shortName?.trim() || null,
        color: body.color || "#22c55e",
        logoUrl: body.logoUrl || null,
        startingPurse: Number(body.startingPurse) || 2000000,
        squadSize: Number(body.squadSize) || 10,
      },
    });
    return NextResponse.json(team, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create team";
    const conflict = msg.includes("Unique constraint");
    return NextResponse.json(
      { error: conflict ? "A team with this name already exists" : msg },
      { status: conflict ? 409 : 500 }
    );
  }
}
