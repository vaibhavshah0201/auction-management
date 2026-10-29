"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Gavel } from "lucide-react";
import { formatINR } from "@/lib/utils";

interface SoldInfo {
  playerName: string;
  amount: number;
  teamName: string;
  teamColor: string;
  photoUrl?: string | null;
}

export function SoldOverlay({
  sold,
  onClose,
}: {
  sold: SoldInfo | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {sold && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.5, rotate: -8, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", damping: 12, stiffness: 180 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white text-center shadow-2xl"
            style={{ boxShadow: `0 0 0 6px ${sold.teamColor}` }}
          >
            {/* Colored header band with SOLD + photo */}
            <div
              className="relative px-8 pb-10 pt-8"
              style={{ backgroundColor: sold.teamColor }}
            >
              {/* Giant SOLD stamp */}
              <motion.div
                initial={{ scale: 2.5, opacity: 0, rotate: -20 }}
                animate={{ scale: 1, opacity: 1, rotate: -10 }}
                transition={{ delay: 0.1, type: "spring" }}
                className="pointer-events-none absolute right-5 top-5 rounded-xl border-4 border-white px-4 py-1 text-3xl font-black text-white"
              >
                SOLD
              </motion.div>

              <motion.div
                animate={{ rotate: [0, -20, 20, 0] }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/25"
              >
                <Gavel size={34} className="text-white" />
              </motion.div>

              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
                Going once, going twice...
              </p>
              <h2 className="mt-1 text-5xl font-black leading-tight text-white drop-shadow">
                {sold.playerName}
              </h2>
            </div>

            {/* Body: amount + team on white for max contrast */}
            <div className="px-8 py-7">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Sold for
              </p>
              <motion.p
                initial={{ scale: 0.6 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="text-6xl font-black tabular text-slate-900"
              >
                {formatINR(sold.amount)}
              </motion.p>

              <div className="mt-4 flex items-center justify-center gap-2">
                <span
                  className="inline-block h-4 w-4 rounded-full"
                  style={{ backgroundColor: sold.teamColor }}
                />
                <p className="text-2xl font-black text-slate-900">
                  {sold.teamName}
                </p>
              </div>

              <button
                onClick={onClose}
                className="mt-6 rounded-xl px-8 py-3 text-lg font-bold text-white transition-transform hover:scale-105"
                style={{ backgroundColor: sold.teamColor }}
              >
                Next Player
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
