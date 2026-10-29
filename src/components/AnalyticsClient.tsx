"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import { PageHeader } from "./ui";
import { formatINR, formatINRCompact, SKILL_COLORS } from "@/lib/utils";
import type { PlayerDTO, TeamDTO } from "@/lib/types";

export function AnalyticsClient({
  teams,
  players,
}: {
  teams: TeamDTO[];
  players: PlayerDTO[];
}) {
  const sold = players.filter((p) => p.status === "SOLD");

  const spendData = teams.map((t) => ({
    name: t.shortName ?? t.name,
    Spent: t.spent,
    Remaining: t.remaining,
    color: t.color,
  }));

  // Skill distribution of sold players
  const skillCounts = sold.reduce<Record<string, number>>((acc, p) => {
    acc[p.skill] = (acc[p.skill] ?? 0) + 1;
    return acc;
  }, {});
  const skillData = Object.entries(skillCounts).map(([skill, count]) => ({
    name: skill,
    value: count,
    color: SKILL_COLORS[skill] ?? "#888",
  }));

  const topBuys = [...sold]
    .sort((a, b) => (b.soldAmount ?? 0) - (a.soldAmount ?? 0))
    .slice(0, 8);

  return (
    <div className="px-4 py-8 pt-16 sm:px-8 lg:pt-8">
      <PageHeader
        title="Analytics"
        subtitle="Spend patterns, squad composition and top buys"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Team spend */}
        <div className="glass rounded-2xl p-5">
          <h3 className="mb-4 font-bold text-slate-900">Team Spend vs Remaining</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={spendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0f172a10" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickFormatter={(v) => formatINRCompact(v)}
              />
              <Tooltip
                contentStyle={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  color: "#0f172a",
                }}
                formatter={(v: number) => formatINR(v)}
              />
              <Bar dataKey="Spent" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
              <Bar
                dataKey="Remaining"
                stackId="a"
                fill="#22c55e"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Skill distribution */}
        <div className="glass rounded-2xl p-5">
          <h3 className="mb-4 font-bold text-slate-900">
            Squad Composition (sold players)
          </h3>
          {skillData.length === 0 ? (
            <p className="py-20 text-center text-slate-400">No sold players yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={skillData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.name} (${entry.value})`}
                >
                  {skillData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    color: "#0f172a",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top buys */}
      <div className="glass mt-6 rounded-2xl p-5">
        <h3 className="mb-4 font-bold text-slate-900">Top Buys</h3>
        {topBuys.length === 0 ? (
          <p className="py-8 text-center text-slate-400">No sold players yet.</p>
        ) : (
          <div className="space-y-2">
            {topBuys.map((p, i) => {
              const max = topBuys[0].soldAmount ?? 1;
              const pct = ((p.soldAmount ?? 0) / max) * 100;
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="w-5 text-sm font-bold text-slate-400">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-900">
                        {p.name}{" "}
                        <span
                          className="text-xs"
                          style={{ color: p.teamColor ?? "#888" }}
                        >
                          · {p.teamName}
                        </span>
                      </span>
                      <span className="text-sm font-bold text-gold-600 tabular">
                        {formatINR(p.soldAmount)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-600"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
