import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { proxiedImageUrl } from "@/lib/utils";
import type { AuctionSnapshot, BidDTO, PlayerStatus } from "@/lib/types";

/** Returns the current live auction snapshot: active player, bids, highest bid. */
export async function GET() {
  const state = await prisma.auctionState.findUnique({
    where: { id: "singleton" },
  });

  if (!state?.currentPlayerId) {
    const snapshot: AuctionSnapshot = {
      currentPlayer: null,
      bids: [],
      highestBid: null,
    };
    return NextResponse.json(snapshot);
  }

  const player = await prisma.player.findUnique({
    where: { id: state.currentPlayerId },
    include: { team: { select: { name: true, color: true } } },
  });

  if (!player) {
    const snapshot: AuctionSnapshot = {
      currentPlayer: null,
      bids: [],
      highestBid: null,
    };
    return NextResponse.json(snapshot);
  }

  const bids = await prisma.bid.findMany({
    where: { playerId: player.id },
    orderBy: { createdAt: "desc" },
    include: { team: { select: { name: true, color: true } } },
  });

  const bidDTOs: BidDTO[] = bids.map((b) => ({
    id: b.id,
    amount: b.amount,
    teamId: b.teamId,
    teamName: b.team.name,
    teamColor: b.team.color,
    createdAt: b.createdAt.toISOString(),
  }));

  const snapshot: AuctionSnapshot = {
    currentPlayer: {
      id: player.id,
      srNo: player.srNo,
      name: player.name,
      blockNo: player.blockNo,
      flatNo: player.flatNo,
      dob: player.dob ? player.dob.toISOString() : null,
      age: player.age,
      skill: player.skill,
      keyStrength: player.keyStrength,
      lastOecl: player.lastOecl,
      isCaptain: player.isCaptain,
      mobile: player.mobile,
      photoUrl: proxiedImageUrl(player.photoUrl),
      status: player.status as PlayerStatus,
      soldAmount: player.soldAmount,
      teamId: player.teamId,
      teamName: player.team?.name ?? null,
      teamColor: player.team?.color ?? null,
    },
    bids: bidDTOs,
    highestBid: bidDTOs[0] ?? null,
  };

  return NextResponse.json(snapshot);
}
