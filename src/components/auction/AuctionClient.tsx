"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Gavel, Play, X, User } from "lucide-react";
import { Button } from "@/components/ui";
import { formatINR, formatINRCompact, SKILL_COLORS } from "@/lib/utils";
import type { AuctionSnapshot, BidDTO, PlayerDTO, TeamDTO } from "@/lib/types";
import { PlayerSpotlight } from "./PlayerSpotlight";
import { BidPanel } from "./BidPanel";
import { SoldOverlay } from "./SoldOverlay";

interface Props {
  teams: TeamDTO[];
  pool: PlayerDTO[];
}

interface SoldInfo {
  playerName: string;
  amount: number;
  teamName: string;
  teamColor: string;
}

export function AuctionClient({ teams: initialTeams, pool: initialPool }: Props) {
  const router = useRouter();
  const [teams, setTeams] = useState(initialTeams);
  const [pool, setPool] = useState(initialPool);
  const [snapshot, setSnapshot] = useState<AuctionSnapshot>({
    currentPlayer: null,
    bids: [],
    highestBid: null,
  });
  const [sold, setSold] = useState<SoldInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const [snapRes, teamRes, availRes, unsoldRes] = await Promise.all([
      fetch("/api/auction", { cache: "no-store" }),
      fetch("/api/teams", { cache: "no-store" }),
      fetch("/api/players?status=AVAILABLE", { cache: "no-store" }),
      fetch("/api/players?status=UNSOLD", { cache: "no-store" }),
    ]);
    const snap: AuctionSnapshot = await snapRes.json();
    const t: TeamDTO[] = await teamRes.json();
    const available: PlayerDTO[] = await availRes.json();
    const unsold: PlayerDTO[] = await unsoldRes.json();
    setSnapshot(snap);
    setTeams(t);
    // Pool always reflects the server: available first, then unsold (re-auctionable).
    setPool([...available, ...unsold]);
  }, []);

  // Initial + poll the live snapshot so multiple screens stay in sync
  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 2500);
    return () => clearInterval(id);
  }, [refresh]);

  async function call(url: string, body: object) {
    setError(null);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      throw new Error(data.error);
    }
    return data;
  }

  async function startAuction(playerId: string) {
    setBusy(true);
    try {
      await call("/api/auction/start", { playerId });
      await refresh();
    } catch {
      /* handled */
    } finally {
      setBusy(false);
    }
  }

  async function placeBid(teamId: string, amount: number) {
    if (!snapshot.currentPlayer) return;
    setBusy(true);
    try {
      await call("/api/auction/bid", {
        playerId: snapshot.currentPlayer.id,
        teamId,
        amount,
      });
      await refresh();
    } catch {
      /* handled */
    } finally {
      setBusy(false);
    }
  }

  async function sell() {
    if (!snapshot.currentPlayer || !snapshot.highestBid) return;
    setBusy(true);
    const player = snapshot.currentPlayer;
    const bid = snapshot.highestBid;
    try {
      await call("/api/auction/sell", { playerId: player.id });
      fireConfetti();
      setSold({
        playerName: player.name,
        amount: bid.amount,
        teamName: bid.teamName,
        teamColor: bid.teamColor,
      });
      // Pool is recomputed from the server in refresh().
      await refresh();
      router.refresh();
    } catch {
      /* handled */
    } finally {
      setBusy(false);
    }
  }

  async function markUnsold() {
    if (!snapshot.currentPlayer) return;
    setBusy(true);
    try {
      await call("/api/auction/unsold", { playerId: snapshot.currentPlayer.id });
      await refresh();
    } catch {
      /* handled */
    } finally {
      setBusy(false);
    }
  }

  function fireConfetti() {
    const end = Date.now() + 1200;
    const colors = ["#fbbf24", "#22c55e", "#3b82f6", "#ffffff"];
    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 60,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 60,
        origin: { x: 1 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }

  const current = snapshot.currentPlayer;
  const available = pool.filter((p) => p.status !== "UNSOLD");
  const unsold = pool.filter((p) => p.status === "UNSOLD");

  return (
    <div className="min-h-screen px-4 py-8 pt-16 sm:px-8 lg:pt-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-600">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          LIVE AUCTION
        </div>
        <h1 className="text-2xl font-bold text-slate-900">The Auction Block</h1>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center justify-between rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700"
        >
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Spotlight + Bidding */}
        <div className="space-y-6 lg:col-span-2">
          <AnimatePresence mode="wait">
            {current ? (
              <motion.div
                key={current.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <PlayerSpotlight
                  player={current}
                  highestBid={snapshot.highestBid}
                />
                <BidPanel
                  teams={teams}
                  player={current}
                  highestBid={snapshot.highestBid}
                  busy={busy}
                  onBid={placeBid}
                />
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button
                    variant="gold"
                    size="lg"
                    disabled={busy || !snapshot.highestBid}
                    onClick={sell}
                  >
                    <Gavel size={20} />
                    SOLD! {snapshot.highestBid && `— ${formatINRCompact(snapshot.highestBid.amount)}`}
                  </Button>
                  <Button variant="danger" disabled={busy} onClick={markUnsold}>
                    <X size={18} />
                    Mark Unsold
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass flex min-h-[400px] flex-col items-center justify-center rounded-2xl p-10 text-center"
              >
                <motion.div
                  animate={{ rotate: [0, -15, 15, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2.5 }}
                >
                  <Gavel className="h-16 w-16 text-gold-600" />
                </motion.div>
                <h3 className="mt-4 text-xl font-bold text-slate-900">
                  No player on the block
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Pick a player from the pool to start bidding.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Live bid feed + player pool */}
        <div className="space-y-6">
          {/* Bid feed */}
          <div className="glass rounded-2xl p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
              <span className="h-2 w-2 animate-pulse rounded-full bg-pitch-500" />
              Live Bid Feed
            </h3>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              <AnimatePresence initial={false}>
                {snapshot.bids.length === 0 && (
                  <p className="text-sm text-slate-400">No bids yet.</p>
                )}
                {snapshot.bids.map((bid: BidDTO, i: number) => (
                  <motion.div
                    key={bid.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                      i === 0 ? "bg-pitch-500/15" : "bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: bid.teamColor }}
                      />
                      <span className="text-sm font-medium text-slate-900">
                        {bid.teamName}
                      </span>
                    </div>
                    <span className="text-sm font-bold tabular text-slate-900">
                      {formatINR(bid.amount)}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Pool */}
          <div className="glass rounded-2xl p-5">
            <h3 className="mb-3 text-sm font-bold text-slate-900">
              Player Pool ({pool.length})
            </h3>
            <div className="max-h-[460px] space-y-4 overflow-y-auto">
              {pool.length === 0 && (
                <p className="text-sm text-slate-400">
                  All players have been auctioned.
                </p>
              )}

              {available.length > 0 && (
                <PoolGroup
                  label={`Available (${available.length})`}
                  players={available}
                  current={current}
                  busy={busy}
                  onStart={startAuction}
                />
              )}

              {unsold.length > 0 && (
                <PoolGroup
                  label={`Unsold — re-auction (${unsold.length})`}
                  players={unsold}
                  current={current}
                  busy={busy}
                  onStart={startAuction}
                  unsold
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <SoldOverlay sold={sold} onClose={() => setSold(null)} />
    </div>
  );
}

function PoolGroup({
  label,
  players,
  current,
  busy,
  onStart,
  unsold = false,
}: {
  label: string;
  players: PlayerDTO[];
  current: PlayerDTO | null;
  busy: boolean;
  onStart: (id: string) => void;
  unsold?: boolean;
}) {
  return (
    <div>
      <p
        className={`mb-1.5 flex items-center gap-1.5 px-1 text-[11px] font-bold uppercase tracking-wide ${
          unsold ? "text-red-600" : "text-slate-400"
        }`}
      >
        {unsold && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
        {label}
      </p>
      <div className="space-y-1.5">
        {players.map((p) => {
          const skillColor = SKILL_COLORS[p.skill] ?? "#22c55e";
          const onBlock = current?.id === p.id;
          return (
            <button
              key={p.id}
              disabled={busy || onBlock}
              onClick={() => onStart(p.id)}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors disabled:opacity-40 ${
                unsold
                  ? "bg-red-50 hover:bg-red-100"
                  : "bg-white hover:bg-slate-100"
              }`}
            >
              {/* Thumbnail */}
              {p.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.photoUrl}
                  alt={p.name}
                  className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-slate-200"
                />
              ) : (
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${skillColor}22` }}
                >
                  <User size={16} style={{ color: skillColor }} />
                </span>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">
                  {p.name}
                </p>
                <p className="text-xs text-slate-400">
                  {p.skill}
                  {unsold && (
                    <span className="ml-1 font-semibold text-red-600">
                      · unsold
                    </span>
                  )}
                </p>
              </div>

              {onBlock ? (
                <span className="text-xs font-bold text-pitch-700">
                  ON BLOCK
                </span>
              ) : (
                <Play
                  size={16}
                  className="shrink-0 text-pitch-700 opacity-0 transition-opacity group-hover:opacity-100"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
