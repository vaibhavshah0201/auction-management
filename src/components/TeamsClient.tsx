"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Pencil, Trash2 } from "lucide-react";
import { Button, PageHeader, Input } from "./ui";
import { TeamPurseCard } from "./TeamPurseCard";
import type { TeamDTO } from "@/lib/types";

interface FormState {
  name: string;
  shortName: string;
  color: string;
  startingPurse: string;
  squadSize: string;
}

const EMPTY: FormState = {
  name: "",
  shortName: "",
  color: "#22c55e",
  startingPurse: "2000000",
  squadSize: "10",
};

export function TeamsClient({ initialTeams }: { initialTeams: TeamDTO[] }) {
  const [teams, setTeams] = useState(initialTeams);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TeamDTO | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    const res = await fetch("/api/teams", { cache: "no-store" });
    setTeams(await res.json());
  }

  function openAdd() {
    setEditing(null);
    setForm(EMPTY);
    setError(null);
    setModalOpen(true);
  }
  function openEdit(t: TeamDTO) {
    setEditing(t);
    setForm({
      name: t.name,
      shortName: t.shortName ?? "",
      color: t.color,
      startingPurse: t.startingPurse.toString(),
      squadSize: t.squadSize.toString(),
    });
    setError(null);
    setModalOpen(true);
  }

  async function save() {
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name,
      shortName: form.shortName,
      color: form.color,
      startingPurse: Number(form.startingPurse) || 2000000,
      squadSize: Number(form.squadSize) || 10,
    };
    const res = editing
      ? await fetch(`/api/teams/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to save");
      return;
    }
    setModalOpen(false);
    refresh();
  }

  async function del(t: TeamDTO) {
    if (
      !confirm(
        `Delete ${t.name}? Its ${t.playersBought} players will be released back to the pool.`
      )
    )
      return;
    await fetch(`/api/teams/${t.id}`, { method: "DELETE" });
    setTeams((p) => p.filter((x) => x.id !== t.id));
  }

  return (
    <div className="px-4 py-8 pt-16 sm:px-8 lg:pt-8">
      <PageHeader title="Teams" subtitle={`${teams.length} franchises`}>
        <Button onClick={openAdd}>
          <Plus size={18} />
          Add Team
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((t) => (
          <div key={t.id} className="group relative">
            <div className="absolute right-3 top-3 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  openEdit(t);
                }}
                className="rounded-lg bg-white/90 border border-slate-200 p-1.5 text-slate-600 hover:text-slate-900"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  del(t);
                }}
                className="rounded-lg bg-white/90 border border-slate-200 p-1.5 text-slate-600 hover:text-red-600"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <TeamPurseCard team={t} />
          </div>
        ))}
      </div>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass w-full max-w-md rounded-2xl p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                  {editing ? "Edit Team" : "Add Team"}
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                >
                  <X size={20} />
                </button>
              </div>

              {error && (
                <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">
                    Team Name *
                  </label>
                  <Input
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="OE Blasters"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">
                      Short Name
                    </label>
                    <Input
                      value={form.shortName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, shortName: e.target.value }))
                      }
                      placeholder="OEB"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">
                      Color
                    </label>
                    <input
                      type="color"
                      value={form.color}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, color: e.target.value }))
                      }
                      className="h-10 w-full cursor-pointer rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">
                      Starting Purse (₹)
                    </label>
                    <Input
                      type="number"
                      value={form.startingPurse}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          startingPurse: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">
                      Squad Size
                    </label>
                    <Input
                      type="number"
                      value={form.squadSize}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, squadSize: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={save} disabled={saving}>
                  {saving ? "Saving..." : editing ? "Save" : "Add Team"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
