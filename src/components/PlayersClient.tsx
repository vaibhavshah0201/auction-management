"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  User,
  FileSpreadsheet,
  Crown,
} from "lucide-react";
import { Button, PageHeader, Input, Select, Badge } from "./ui";
import { PlayerFormModal } from "./PlayerFormModal";
import { ImportPlayersModal } from "./ImportPlayersModal";
import { formatINR, SKILL_COLORS } from "@/lib/utils";
import type { PlayerDTO, TeamDTO } from "@/lib/types";

const STATUS_STYLES: Record<string, string> = {
  AVAILABLE: "bg-blue-500/20 text-blue-600",
  IN_AUCTION: "bg-gold-500/20 text-gold-600",
  SOLD: "bg-pitch-500/20 text-pitch-700",
  UNSOLD: "bg-red-500/20 text-red-600",
};

export function PlayersClient({
  initialPlayers,
  teams,
}: {
  initialPlayers: PlayerDTO[];
  teams: TeamDTO[];
}) {
  const [players, setPlayers] = useState(initialPlayers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<PlayerDTO | null>(null);

  const filtered = useMemo(() => {
    return players.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (statusFilter && p.status !== statusFilter) return false;
      if (skillFilter && p.skill !== skillFilter) return false;
      return true;
    });
  }, [players, search, statusFilter, skillFilter]);

  async function refresh() {
    const res = await fetch("/api/players", { cache: "no-store" });
    setPlayers(await res.json());
  }

  async function del(id: string) {
    if (!confirm("Delete this player? This cannot be undone.")) return;
    await fetch(`/api/players/${id}`, { method: "DELETE" });
    setPlayers((p) => p.filter((x) => x.id !== id));
  }

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(p: PlayerDTO) {
    setEditing(p);
    setModalOpen(true);
  }

  return (
    <div className="px-4 py-8 pt-16 sm:px-8 lg:pt-8">
      <PageHeader
        title="Players"
        subtitle={`${players.length} registered · ${filtered.length} shown`}
      >
        <Button variant="secondary" onClick={() => setImportOpen(true)}>
          <FileSpreadsheet size={18} />
          Import from Excel
        </Button>
        <Button onClick={openAdd}>
          <Plus size={18} />
          Add Player
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <Input
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="sm:w-44"
        >
          <option value="">All statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="SOLD">Sold</option>
          <option value="UNSOLD">Unsold</option>
          <option value="IN_AUCTION">In Auction</option>
        </Select>
        <Select
          value={skillFilter}
          onChange={(e) => setSkillFilter(e.target.value)}
          className="sm:w-44"
        >
          <option value="">All skills</option>
          {Object.keys(SKILL_COLORS).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence>
          {filtered.map((p) => {
            const skillColor = SKILL_COLORS[p.skill] ?? "#22c55e";
            return (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass glass-hover group rounded-xl p-4"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${skillColor}22` }}
                  >
                    {p.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.photoUrl}
                        alt={p.name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <User size={22} style={{ color: skillColor }} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate font-bold text-slate-900">
                        {p.name}
                      </h3>
                      <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => openEdit(p)}
                          className="rounded p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => del(p.id)}
                          className="rounded p-1 text-slate-500 hover:bg-red-500/20 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">
                      #{p.srNo} · {p.age ? `${p.age} yrs` : "—"} ·{" "}
                      {[p.blockNo, p.flatNo].filter(Boolean).join("-") || "—"}
                    </p>
                  </div>
                </div>

                {p.keyStrength && (
                  <p className="mt-2 line-clamp-2 text-xs italic text-slate-500">
                    &ldquo;{p.keyStrength}&rdquo;
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <Badge color={skillColor}>{p.skill}</Badge>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      STATUS_STYLES[p.status]
                    }`}
                  >
                    {p.status}
                  </span>
                  {p.isCaptain && (
                    <span className="flex items-center gap-1 rounded-full bg-gold-500 px-2 py-0.5 text-xs font-black text-white">
                      <Crown size={11} /> Captain
                    </span>
                  )}
                  {p.lastOecl && (
                    <span className="rounded-full bg-gold-500/20 px-2 py-0.5 text-xs font-semibold text-gold-600">
                      Played last OECL
                    </span>
                  )}
                </div>

                <div className="mt-3 border-t border-slate-200 pt-2 text-xs">
                  {p.status === "SOLD" ? (
                    <p className="text-slate-500">
                      Sold for{" "}
                      <span className="font-bold text-slate-900">
                        {formatINR(p.soldAmount)}
                      </span>{" "}
                      to{" "}
                      <span style={{ color: p.teamColor ?? "#0f172a" }}>
                        {p.teamName}
                      </span>
                    </p>
                  ) : p.status === "UNSOLD" ? (
                    <p className="font-medium text-red-600">
                      Unsold — available to re-auction
                    </p>
                  ) : (
                    <p className="text-slate-400">Available for auction</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-slate-400">
          No players match your filters.
        </div>
      )}

      <PlayerFormModal
        open={modalOpen}
        player={editing}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          setModalOpen(false);
          refresh();
        }}
      />

      <ImportPlayersModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={refresh}
      />
    </div>
  );
}
