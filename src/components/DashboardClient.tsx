"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Gavel,
  Users,
  Wallet,
  TrendingUp,
  Crown,
  ArrowRight,
} from "lucide-react";
import { Card } from "./ui";
import { TeamPurseCard } from "./TeamPurseCard";
import { formatINR, formatINRCompact } from "@/lib/utils";
import type { TeamDTO, PlayerDTO } from "@/lib/types";

interface Stats {
  teams: TeamDTO[];
  totalPlayers: number;
  soldCount: number;
  availableCount: number;
  unsoldCount: number;
  totalSpent: number;
  totalPurse: number;
  totalRemaining: number;
  mostExpensive: PlayerDTO | null;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function DashboardClient({ stats }: { stats: Stats }) {
  const utilization =
    stats.totalPurse > 0
      ? Math.round((stats.totalSpent / stats.totalPurse) * 1000) / 10
      : 0;

  const summary = [
    {
      label: "Players Sold",
      value: stats.soldCount,
      sub: `${stats.availableCount} available`,
      icon: Users,
      color: "#22c55e",
    },
    {
      label: "Total Spent",
      value: formatINRCompact(stats.totalSpent),
      sub: `of ${formatINRCompact(stats.totalPurse)}`,
      icon: Wallet,
      color: "#f59e0b",
    },
    {
      label: "Purse Remaining",
      value: formatINRCompact(stats.totalRemaining),
      sub: "across all teams",
      icon: TrendingUp,
      color: "#3b82f6",
    },
    {
      label: "Utilization",
      value: `${utilization}%`,
      sub: "of total purse",
      icon: Gavel,
      color: "#a855f7",
    },
  ];

  return (
    <div className="px-4 py-8 pt-16 sm:px-8 lg:pt-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-8"
      >
        <div className="shimmer-bg absolute inset-0 opacity-30" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-600">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                LIVE DASHBOARD
              </span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 sm:text-5xl">
              <span className="gradient-text">OECL Mega Auction 7.0</span>
            </h1>
            <p className="mt-2 max-w-lg text-sm text-slate-500">
              Real-time cricket auction command center. Track purses, run live
              bidding and manage your squads.
            </p>
          </div>
          <Link
            href="/auction"
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-400 to-gold-600 px-6 py-3 font-bold text-slate-900 shadow-lg shadow-gold-500/30 transition-transform hover:scale-105"
          >
            <Gavel size={20} />
            Go Live
            <ArrowRight
              size={18}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>
      </motion.div>

      {/* Summary cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        {summary.map((s) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} variants={item}>
              <Card className="glass-hover">
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${s.color}22` }}
                  >
                    <Icon size={22} style={{ color: s.color }} />
                  </div>
                </div>
                <p className="mt-4 text-2xl font-black text-slate-900 tabular sm:text-3xl">
                  {s.value}
                </p>
                <p className="text-sm font-medium text-slate-600">{s.label}</p>
                <p className="text-xs text-slate-400">{s.sub}</p>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Most expensive highlight */}
      {stats.mostExpensive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8"
        >
          <Card className="relative overflow-hidden border-gold-500/30 bg-gradient-to-r from-gold-500/10 to-transparent">
            <div className="flex items-center gap-4">
              <Crown className="h-10 w-10 text-gold-600 animate-float" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gold-600">
                  Marquee Signing
                </p>
                <p className="text-xl font-bold text-slate-900">
                  {stats.mostExpensive.name}
                </p>
                <p className="text-sm text-slate-500">
                  {formatINR(stats.mostExpensive.soldAmount)} ·{" "}
                  <span style={{ color: stats.mostExpensive.teamColor ?? "#0f172a" }}>
                    {stats.mostExpensive.teamName}
                  </span>
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Teams grid */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Teams</h2>
        <Link
          href="/teams"
          className="text-sm text-pitch-700 hover:underline"
        >
          Manage teams →
        </Link>
      </div>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {stats.teams.map((team) => (
          <motion.div key={team.id} variants={item}>
            <TeamPurseCard team={team} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
