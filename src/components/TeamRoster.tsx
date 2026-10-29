"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Crown,
  Star,
  Plus,
  X,
  Trash2,
  Pencil,
  Check,
  Search,
} from "lucide-react";
import { Button, Input } from "./ui";
import { formatINR, formatINRCompact, SKILL_COLORS } from "@/lib/utils";
import type { PlayerDTO, TeamDTO } from "@/lib/types";

export function TeamRoster({
  team,
  roster: initialRoster,
  available: initialAvailable,
}: {
  team: TeamDTO;
  roster: PlayerDTO[];
  available: PlayerDTO[];
}) {
  const router = useRouter();
  const [roster, setRoster] = useState(initialRoster);
  const [available, setAvailable] = useState(initialAvailable);
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function refreshRoute() {
    router.refresh();
  }

  async function setCaptain(player: PlayerDTO) {
    setBusy(true);
    setError(null);
    const makeCaptain = !player.isCaptain;
    const res = await fetch(`/api/players/${player.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCaptain: makeCaptain }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Could not update captain");
      return;
    }
    setRoster((r) =>
      r.map((p) => ({
        ...p,
        isCaptain: p.id === player.id ? makeCaptain : makeCaptain ? false : p.isCaptain,
      }))
    );
    refreshRoute();
  }

  async function removePlayer(player: PlayerDTO) {
    if (!confirm(`Remove ${player.name} from ${team.name}?`)) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/teams/${team.id}/roster`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: player.id }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Could not remove player");
      return;
    }
    setRoster((r) => r.filter((p) => p.id !== player.id));
    setAvailable((a) => [{ ...player, isCaptain: false }, ...a]);
    refreshRoute();
  }

  async function saveAmount(player: PlayerDTO) {
    const amount = Number(editAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      setError("Enter a valid amount");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/players/${player.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      // soldAmount is set via the team roster endpoint to keep status SOLD
      body: JSON.stringify({ soldAmount: amount }),
    });
    // The player PATCH doesn't set soldAmount, so use roster assign to update price
    const res2 = await fetch(`/api/teams/${team.id}/roster`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: player.id, amount }),
    });
    setBusy(false);
    if (!res.ok && !res2.ok) {
      setError("Could not update amount");
      return;
    }
    setRoster((r) =>
      r.map((p) => (p.id === player.id ? { ...p, soldAmount: amount } : p))
    );
    setEditId(null);
    refreshRoute();
  }

  async function addPlayer(player: PlayerDTO, amount: number) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/teams/${team.id}/roster`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: player.id, amount }),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Could not add player");
      return;
    }
    setRoster((r) => [
      ...r,
      { ...player, status: "SOLD", soldAmount: amount, teamId: team.id },
    ]);
    setAvailable((a) => a.filter((p) => p.id !== player.id));
    refreshRoute();
  }

  return (
    <div>
      {error && (
        <div className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">
          Squad ({roster.length})
        </h2>
        <Button onClick={() => setAddOpen(true)} disabled={busy}>
          <Plus size={16} /> Add Player
        </Button>
      </div>

      {roster.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center text-slate-400">
          No players yet. Click &ldquo;Add Player&rdquo; to assign one manually,
          or use the live auction.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {roster.map((p) => {
            const skillColor = SKILL_COLORS[p.skill] ?? "#22c55e";
            const editing = editId === p.id;
            return (
              <div
                key={p.id}
                className="glass group relative rounded-xl p-4"
                style={
                  p.isCaptain
                    ? { borderColor: "#f59e0b", boxShadow: "0 0 0 1px #f59e0b55" }
                    : undefined
                }
              >
                {p.isCaptain && (
                  <span className="absolute -top-2 left-3 flex items-center gap-1 rounded-full bg-gold-500 px-2 py-0.5 text-[10px] font-black text-white shadow">
                    <Crown size={11} /> CAPTAIN
                  </span>
                )}

                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg"
                    style={{ backgroundColor: `${skillColor}22` }}
                  >
                    {p.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.photoUrl}
                        alt={p.name}
                        className="h-11 w-11 object-cover"
                      />
                    ) : (
                      <User size={20} style={{ color: skillColor }} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-bold text-slate-900">
                      {p.name}
                    </h3>
                    <p className="text-xs text-slate-400">{p.skill}</p>
                  </div>
                  {!editing && (
                    <p className="text-sm font-bold text-gold-600 tabular">
                      {formatINRCompact(p.soldAmount)}
                    </p>
                  )}
                </div>

                {editing && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                        ₹
                      </span>
                      <Input
                        type="number"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="pl-6"
                        autoFocus
                      />
                    </div>
                    <Button size="sm" onClick={() => saveAmount(p)} disabled={busy}>
                      <Check size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setEditId(null)}
                    >
                      <X size={14} />
                    </Button>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-3 flex items-center gap-1.5 border-t border-slate-200 pt-2">
                  <button
                    onClick={() => setCaptain(p)}
                    disabled={busy}
                    className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
                      p.isCaptain
                        ? "bg-gold-500/20 text-gold-600"
                        : "text-slate-500 hover:bg-slate-100 hover:text-gold-600"
                    }`}
                  >
                    <Star size={13} />
                    {p.isCaptain ? "Captain" : "Make captain"}
                  </button>
                  <div className="ml-auto flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditId(p.id);
                        setEditAmount(String(p.soldAmount ?? 0));
                      }}
                      disabled={busy}
                      className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      title="Edit price"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => removePlayer(p)}
                      disabled={busy}
                      className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                      title="Remove from team"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddPlayerModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        available={available}
        onAdd={addPlayer}
        busy={busy}
      />
    </div>
  );
}

function AddPlayerModal({
  open,
  onClose,
  available,
  onAdd,
  busy,
}: {
  open: boolean;
  onClose: () => void;
  available: PlayerDTO[];
  onAdd: (player: PlayerDTO, amount: number) => void;
  busy: boolean;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<PlayerDTO | null>(null);
  const [amount, setAmount] = useState("");

  const filtered = available.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  function submit() {
    if (!selected) return;
    onAdd(selected, Number(amount) || 0);
    setSelected(null);
    setAmount("");
    setSearch("");
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="glass max-h-[85vh] w-full max-w-md overflow-hidden rounded-2xl p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                Add Player to Team
              </h2>
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <X size={20} />
              </button>
            </div>

            {!selected ? (
              <>
                <div className="relative mb-3">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <Input
                    placeholder="Search available players..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="max-h-80 space-y-1.5 overflow-y-auto">
                  {filtered.length === 0 && (
                    <p className="py-6 text-center text-sm text-slate-400">
                      No available players.
                    </p>
                  )}
                  {filtered.map((p) => {
                    const skillColor = SKILL_COLORS[p.skill] ?? "#22c55e";
                    return (
                      <button
                        key={p.id}
                        onClick={() => setSelected(p)}
                        className="flex w-full items-center gap-3 rounded-lg bg-white px-3 py-2 text-left transition-colors hover:bg-slate-100"
                      >
                        <span
                          className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg"
                          style={{ backgroundColor: `${skillColor}22` }}
                        >
                          {p.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.photoUrl}
                              alt=""
                              className="h-9 w-9 object-cover"
                            />
                          ) : (
                            <User size={16} style={{ color: skillColor }} />
                          )}
                        </span>
                        <span className="flex-1">
                          <span className="block text-sm font-medium text-slate-900">
                            {p.name}
                          </span>
                          <span className="block text-xs text-slate-400">
                            {p.skill}
                            {p.status === "UNSOLD" && " · unsold"}
                          </span>
                        </span>
                        <Plus size={16} className="text-pitch-700" />
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div>
                <div className="mb-4 flex items-center gap-3 rounded-lg bg-slate-100 p-3">
                  <span className="font-bold text-slate-900">
                    {selected.name}
                  </span>
                  <span className="text-xs text-slate-500">{selected.skill}</span>
                  <button
                    onClick={() => setSelected(null)}
                    className="ml-auto text-xs text-pitch-700 hover:underline"
                  >
                    change
                  </button>
                </div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Sold amount (₹)
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    ₹
                  </span>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="pl-7"
                    autoFocus
                  />
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setSelected(null)}>
                    Back
                  </Button>
                  <Button onClick={submit} disabled={busy}>
                    Add to Team
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
