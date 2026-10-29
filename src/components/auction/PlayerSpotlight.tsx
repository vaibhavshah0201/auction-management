"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Phone,
  MapPin,
  Calendar,
  Award,
  ZoomIn,
  Star,
  Crown,
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import { SKILL_COLORS } from "@/lib/utils";
import type { BidDTO, PlayerDTO } from "@/lib/types";
import { PhotoZoom } from "./PhotoZoom";

export function PlayerSpotlight({
  player,
  highestBid,
}: {
  player: PlayerDTO;
  highestBid: BidDTO | null;
}) {
  const skillColor = SKILL_COLORS[player.skill] ?? "#22c55e";
  const [zoomOpen, setZoomOpen] = useState(false);

  return (
    <div className="glass relative overflow-hidden rounded-2xl p-6">
      {/* animated spotlight glows */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-gold-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-pitch-500/10 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-6 md:flex-row">
        {/* Big photo — the star of the show */}
        <div className="relative mx-auto w-full max-w-sm shrink-0 md:mx-0 md:w-72">
          <motion.span
            className="absolute -inset-1.5 rounded-3xl border-2 border-gold-400"
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
          {player.photoUrl ? (
            <button
              type="button"
              onClick={() => setZoomOpen(true)}
              className="group relative block w-full cursor-zoom-in overflow-hidden rounded-3xl"
              aria-label="Zoom player photo"
            >
              <motion.img
                key={player.photoUrl}
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 160, damping: 18 }}
                src={player.photoUrl}
                alt={player.name}
                className="aspect-square w-full rounded-3xl object-cover shadow-xl ring-1 ring-slate-200"
              />
              {/* Zoom hint on hover */}
              <span className="absolute right-3 top-3 flex items-center gap-1 rounded-lg bg-black/55 px-2 py-1 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                <ZoomIn size={20} /> Click to zoom
              </span>
            </button>
          ) : (
            <div
              className="flex aspect-square w-full items-center justify-center rounded-3xl shadow-inner ring-1 ring-slate-200"
              style={{ backgroundColor: `${skillColor}1a` }}
            >
              <User className="h-1/2 w-1/2" style={{ color: skillColor }} />
            </div>
          )}
          {/* Skill tag overlaid on the photo */}
          <span
            className="absolute bottom-3 left-3 rounded-full px-3 py-1 text-xs font-bold shadow-md"
            style={{ backgroundColor: skillColor, color: "#ffffff" }}
          >
            {player.skill}
          </span>
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col justify-center text-center md:text-left">
          <div className="mb-2 flex flex-wrap justify-center gap-2 md:justify-start">
            {player.isCaptain && (
              <span className="flex items-center gap-1 rounded-full bg-gold-500 px-2.5 py-0.5 text-xs font-black text-white">
                <Crown size={12} />
                CAPTAIN
              </span>
            )}
            {player.lastOecl && (
              <span className="flex items-center gap-1 rounded-full bg-gold-500/20 px-2.5 py-0.5 text-xs font-bold text-gold-600">
                <Award size={12} />
                Played last OECL
              </span>
            )}
          </div>
          <h2 className="text-4xl font-black leading-tight text-slate-900">
            {player.name}
          </h2>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-slate-500 md:justify-start">
            {player.age && (
              <span className="flex items-center gap-1">
                <Calendar size={14} /> {player.age} yrs
              </span>
            )}
            {(player.blockNo || player.flatNo) && (
              <span className="flex items-center gap-1">
                <MapPin size={14} />{" "}
                {[player.blockNo, player.flatNo].filter(Boolean).join("-")}
              </span>
            )}
            {player.mobile && (
              <span className="flex items-center gap-1">
                <Phone size={14} /> {player.mobile}
              </span>
            )}
          </div>

          {/* Key strength highlight */}
          {player.keyStrength && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-gold-500/10 px-3 py-2 text-left">
              <Star size={16} className="mt-0.5 shrink-0 text-gold-600" />
              <p className="text-sm font-semibold text-slate-700">
                {player.keyStrength}
              </p>
            </div>
          )}

          {/* Current bid big readout */}
          <div className="mt-5 rounded-xl border-2 border-slate-900 bg-white p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  {highestBid ? "Current Bid" : "Bidding open"}
                </p>
                <motion.p
                  key={highestBid?.amount ?? 0}
                  initial={{ scale: 1.2, color: "#d97706" }}
                  animate={{ scale: 1, color: "#0f172a" }}
                  className="text-5xl font-black tabular leading-none sm:text-6xl"
                >
                  {highestBid ? formatINR(highestBid.amount) : "No bids yet"}
                </motion.p>
              </div>
              {highestBid && (
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Leading
                  </p>
                  <p
                    className="rounded-lg px-3 py-1 text-lg font-black text-white"
                    style={{ backgroundColor: highestBid.teamColor }}
                  >
                    {highestBid.teamName}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {player.photoUrl && (
        <PhotoZoom
          src={player.photoUrl}
          alt={player.name}
          open={zoomOpen}
          onClose={() => setZoomOpen(false)}
        />
      )}
    </div>
  );
}
