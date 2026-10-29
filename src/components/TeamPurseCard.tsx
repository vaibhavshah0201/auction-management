"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Shield } from "lucide-react";
import { formatINR, formatINRCompact } from "@/lib/utils";
import type { TeamDTO } from "@/lib/types";

export function TeamPurseCard({ team }: { team: TeamDTO }) {
  const pct = team.utilization;

  return (
    <Link href={`/teams/${team.id}`}>
      <div
        className="glass glass-hover group relative overflow-hidden rounded-2xl p-5"
        style={{ borderColor: `${team.color}33` }}
      >
        {/* accent bar */}
        <div
          className="absolute left-0 top-0 h-full w-1"
          style={{ backgroundColor: team.color }}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg font-black text-slate-900"
              style={{ backgroundColor: team.color }}
            >
              {team.shortName?.slice(0, 2) ?? <Shield size={18} />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900">{team.name}</h3>
              <p className="text-xs text-slate-400">
                {team.playersBought}/{team.squadSize} players ·{" "}
                {team.playersRemaining} slots left
              </p>
            </div>
          </div>
        </div>

        {/* Purse bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Spent</span>
            <span className="font-semibold text-slate-900 tabular">
              {formatINRCompact(team.spent)}
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(pct, 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ backgroundColor: team.color }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-xs">
            <span className="text-slate-400">{pct}% used</span>
            <span className="font-semibold text-pitch-700 tabular">
              {formatINR(team.remaining)} left
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-200 pt-3 text-center">
          <div>
            <p className="text-[10px] uppercase text-slate-400">Max Avg Bid</p>
            <p className="text-sm font-bold text-slate-900 tabular">
              {formatINRCompact(team.maxAvgBid)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-slate-400">Starting</p>
            <p className="text-sm font-bold text-slate-500 tabular">
              {formatINRCompact(team.startingPurse)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
