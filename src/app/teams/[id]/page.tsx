import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Crown } from "lucide-react";
import { getTeam, getPlayers } from "@/lib/data";
import { formatINR, formatINRCompact } from "@/lib/utils";
import { TeamExport } from "@/components/TeamExport";
import { TeamRoster } from "@/components/TeamRoster";

export const dynamic = "force-dynamic";

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const team = await getTeam(id);
  if (!team) notFound();

  const roster = await getPlayers({ status: "SOLD", teamId: id });
  const [available, unsold] = await Promise.all([
    getPlayers({ status: "AVAILABLE" }),
    getPlayers({ status: "UNSOLD" }),
  ]);
  const addable = [...available, ...unsold];
  const mostExpensive = roster.reduce(
    (max, p) => ((p.soldAmount ?? 0) > (max?.soldAmount ?? 0) ? p : max),
    roster[0] ?? null
  );

  return (
    <div className="px-4 py-8 pt-16 sm:px-8 lg:pt-8">
      <Link
        href="/teams"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft size={16} /> Back to teams
      </Link>

      {/* Header */}
      <div
        className="relative mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6"
        style={{
          background: `linear-gradient(135deg, ${team.color}18, #ffffff)`,
          borderLeft: `4px solid ${team.color}`,
        }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-black text-white"
              style={{ backgroundColor: team.color }}
            >
              {team.shortName?.slice(0, 2) ?? team.name.slice(0, 2)}
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900">{team.name}</h1>
              <p className="text-sm text-slate-500">
                {team.playersBought}/{team.squadSize} players ·{" "}
                {team.playersRemaining} slots remaining
              </p>
            </div>
          </div>
          <TeamExport team={team} roster={roster} />
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Starting Purse", value: formatINR(team.startingPurse) },
          { label: "Spent", value: formatINR(team.spent) },
          { label: "Remaining", value: formatINR(team.remaining) },
          { label: "Max Avg Bid", value: formatINRCompact(team.maxAvgBid) },
        ].map((s) => (
          <div key={s.label} className="glass rounded-xl p-4">
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className="mt-1 text-xl font-black text-slate-900 tabular">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {mostExpensive && (
        <div className="glass mb-6 flex items-center gap-3 rounded-xl border-gold-500/30 p-4">
          <Crown className="h-6 w-6 text-gold-600" />
          <p className="text-sm text-slate-600">
            Costliest buy:{" "}
            <span className="font-bold text-slate-900">{mostExpensive.name}</span> at{" "}
            <span className="font-bold text-gold-600">
              {formatINR(mostExpensive.soldAmount)}
            </span>
          </p>
        </div>
      )}

      {/* Roster (interactive: captain, add, remove, edit price) */}
      <TeamRoster team={team} roster={roster} available={addable} />
    </div>
  );
}
