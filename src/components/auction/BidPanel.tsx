"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { formatINR, formatINRCompact } from "@/lib/utils";
import type { BidDTO, PlayerDTO, TeamDTO } from "@/lib/types";

const QUICK_STEPS = [2000, 5000, 7000, 10000, 15000, 20000, 25000, 50000, 100000];

export function BidPanel({
  teams,
  player,
  highestBid,
  busy,
  onBid,
}: {
  teams: TeamDTO[];
  player: PlayerDTO;
  highestBid: BidDTO | null;
  busy: boolean;
  onBid: (teamId: string, amount: number) => void;
}) {
  // No base price. The floor a new bid must beat is the current highest bid,
  // or nothing at all for the first bid (any positive custom amount works).
  const current = highestBid?.amount ?? 0;
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [amount, setAmount] = useState<string>("");

  function submit() {
    const amt = Number(amount);
    if (!selectedTeam || !Number.isFinite(amt) || amt <= 0) return;
    onBid(selectedTeam, amt);
    setAmount("");
  }

  // Quick-step: bump the typed amount (or the current highest) by the step.
  function applyStep(step: number) {
    const base = amount ? Number(amount) : current;
    setAmount(String(base + step));
  }

  return (
    <div className="glass mt-4 rounded-2xl p-5">
      <h3 className="mb-3 text-sm font-bold text-slate-900">Place a Bid</h3>

      {/* Team selector */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {teams.map((t) => {
          const selected = selectedTeam === t.id;
          // A team can only be picked if it can still afford to outbid.
          const affordable = t.remaining > current;
          return (
            <button
              key={t.id}
              disabled={!affordable}
              onClick={() => setSelectedTeam(t.id)}
              className={`flex flex-col items-start rounded-lg border px-3 py-2 text-left transition-all ${
                selected
                  ? "bg-slate-100"
                  : "border-slate-200 bg-white hover:border-slate-300"
              } disabled:cursor-not-allowed disabled:opacity-40`}
              style={selected ? { borderColor: t.color } : undefined}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: t.color }}
                />
                <span className="text-xs font-bold text-slate-900">
                  {t.name ?? t.name}
                </span>
              </div>
              <span className="text-base font-black tabular text-slate-900">
                {formatINRCompact(t.remaining)}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                purse left
              </span>
            </button>
          );
        })}
      </div>

      {/* Quick step buttons */}
      <div className="mb-3 flex flex-wrap gap-2">
        {QUICK_STEPS.map((step) => (
          <button
            key={step}
            onClick={() => applyStep(step)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-pitch-500 hover:text-slate-900"
          >
            +{formatINRCompact(step)}
          </button>
        ))}
      </div>

      {/* Custom amount + submit */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            ₹
          </span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter any amount"
            min={1}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-7 pr-3 text-lg font-bold text-slate-900 tabular outline-none focus:border-pitch-500"
          />
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          disabled={busy || !selectedTeam || !amount}
          onClick={submit}
          className="rounded-lg bg-pitch-600 px-6 py-2.5 font-bold text-white transition-colors hover:bg-pitch-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Bid {amount && formatINR(Number(amount))}
        </motion.button>
      </div>
      <p className="mt-2 text-xs text-slate-400">
        {highestBid ? (
          <>
            Must beat the current bid of{" "}
            <span className="font-semibold">{formatINR(current)}</span>. Enter
            any custom amount.
          </>
        ) : (
          <>No base price — start the bidding at any amount you like.</>
        )}
      </p>
    </div>
  );
}
