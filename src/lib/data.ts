import { prisma } from "./prisma";
import { proxiedImageUrl } from "./utils";
import type { TeamDTO, PlayerDTO, PlayerStatus } from "./types";

/** Compute derived team stats (spent, remaining, utilization, etc.) */
export async function getTeams(): Promise<TeamDTO[]> {
  const teams = await prisma.team.findMany({
    orderBy: { name: "asc" },
    include: {
      players: {
        where: { status: "SOLD" },
        select: { soldAmount: true },
      },
    },
  });

  return teams.map((t) => {
    const soldPlayers = t.players;
    const spent = soldPlayers.reduce((sum, p) => sum + (p.soldAmount ?? 0), 0);
    const playersBought = soldPlayers.length;
    const remaining = t.startingPurse - spent;
    const playersRemaining = t.squadSize - playersBought;
    // Max avg bid: how much per remaining slot you can afford while keeping
    // at least base for the others (simplified: remaining / slots left)
    const maxAvgBid =
      playersRemaining > 0 ? Math.floor(remaining / playersRemaining) : 0;
    const utilization =
      t.startingPurse > 0 ? Math.round((spent / t.startingPurse) * 1000) / 10 : 0;

    return {
      id: t.id,
      name: t.name,
      shortName: t.shortName,
      color: t.color,
      logoUrl: t.logoUrl,
      startingPurse: t.startingPurse,
      squadSize: t.squadSize,
      spent,
      remaining,
      playersBought,
      playersRemaining,
      maxAvgBid,
      utilization,
    };
  });
}

export async function getTeam(id: string): Promise<TeamDTO | null> {
  const teams = await getTeams();
  return teams.find((t) => t.id === id) ?? null;
}

function toPlayerDTO(p: {
  id: string;
  srNo: number | null;
  name: string;
  blockNo: string | null;
  flatNo: string | null;
  dob: Date | null;
  age: number | null;
  skill: string;
  keyStrength: string | null;
  lastOecl: boolean;
  isCaptain: boolean;
  mobile: string | null;
  photoUrl: string | null;
  status: string;
  soldAmount: number | null;
  teamId: string | null;
  team?: { name: string; color: string } | null;
}): PlayerDTO {
  return {
    id: p.id,
    srNo: p.srNo,
    name: p.name,
    blockNo: p.blockNo,
    flatNo: p.flatNo,
    dob: p.dob ? p.dob.toISOString() : null,
    age: p.age,
    skill: p.skill,
    keyStrength: p.keyStrength,
    lastOecl: p.lastOecl,
    isCaptain: p.isCaptain,
    mobile: p.mobile,
    photoUrl: proxiedImageUrl(p.photoUrl),
    status: p.status as PlayerStatus,
    soldAmount: p.soldAmount,
    teamId: p.teamId,
    teamName: p.team?.name ?? null,
    teamColor: p.team?.color ?? null,
  };
}

export async function getPlayers(filter?: {
  status?: PlayerStatus;
  teamId?: string;
  search?: string;
}): Promise<PlayerDTO[]> {
  const players = await prisma.player.findMany({
    where: {
      status: filter?.status,
      teamId: filter?.teamId,
      name: filter?.search
        ? { contains: filter.search }
        : undefined,
    },
    orderBy: [{ srNo: "asc" }, { createdAt: "asc" }],
    include: { team: { select: { name: true, color: true } } },
  });
  return players.map(toPlayerDTO);
}

export async function getPlayer(id: string): Promise<PlayerDTO | null> {
  const p = await prisma.player.findUnique({
    where: { id },
    include: { team: { select: { name: true, color: true } } },
  });
  return p ? toPlayerDTO(p) : null;
}

/** Dashboard summary numbers */
export async function getDashboardStats() {
  const [teams, totalPlayers, soldCount, availableCount] = await Promise.all([
    getTeams(),
    prisma.player.count(),
    prisma.player.count({ where: { status: "SOLD" } }),
    prisma.player.count({ where: { status: "AVAILABLE" } }),
  ]);

  const totalSpent = teams.reduce((s, t) => s + t.spent, 0);
  const totalPurse = teams.reduce((s, t) => s + t.startingPurse, 0);
  const totalRemaining = totalPurse - totalSpent;

  const mostExpensive = await prisma.player.findFirst({
    where: { status: "SOLD" },
    orderBy: { soldAmount: "desc" },
    include: { team: { select: { name: true, color: true } } },
  });

  return {
    teams,
    totalPlayers,
    soldCount,
    availableCount,
    unsoldCount: totalPlayers - soldCount - availableCount,
    totalSpent,
    totalPurse,
    totalRemaining,
    mostExpensive: mostExpensive ? toPlayerDTO(mostExpensive) : null,
  };
}
