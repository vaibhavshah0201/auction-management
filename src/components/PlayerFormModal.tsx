"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Upload, User, Loader2, Link as LinkIcon } from "lucide-react";
import { Button, Input, Select } from "./ui";
import { SKILLS, proxiedImageUrl } from "@/lib/utils";
import type { PlayerDTO } from "@/lib/types";

interface FormState {
  name: string;
  srNo: string;
  blockNo: string;
  flatNo: string;
  dob: string;
  skill: string;
  keyStrength: string;
  lastOecl: boolean;
  mobile: string;
  photoUrl: string;
}

const EMPTY: FormState = {
  name: "",
  srNo: "",
  blockNo: "",
  flatNo: "",
  dob: "",
  skill: "ALL-ROUNDER",
  keyStrength: "",
  lastOecl: false,
  mobile: "",
  photoUrl: "",
};

export function PlayerFormModal({
  open,
  player,
  onClose,
  onSaved,
}: {
  open: boolean;
  player: PlayerDTO | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (player) {
      setForm({
        name: player.name,
        srNo: player.srNo?.toString() ?? "",
        blockNo: player.blockNo ?? "",
        flatNo: player.flatNo ?? "",
        dob: player.dob ? player.dob.slice(0, 10) : "",
        skill: player.skill,
        keyStrength: player.keyStrength ?? "",
        lastOecl: player.lastOecl,
        mobile: player.mobile ?? "",
        photoUrl: player.photoUrl ?? "",
      });
    } else {
      setForm(EMPTY);
    }
    setError(null);
  }, [player, open]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function uploadPhoto(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Photo upload failed");
        return;
      }
      set("photoUrl", data.url);
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name,
      srNo: form.srNo ? Number(form.srNo) : null,
      blockNo: form.blockNo,
      flatNo: form.flatNo,
      dob: form.dob || null,
      skill: form.skill,
      keyStrength: form.keyStrength,
      lastOecl: form.lastOecl,
      mobile: form.mobile,
      photoUrl: form.photoUrl,
    };
    const res = player
      ? await fetch(`/api/players/${player.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/players", {
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
    onSaved();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="glass max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {player ? "Edit Player" : "Add Player"}
              </h2>
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Name *" className="col-span-2">
                <Input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Player name"
                />
              </Field>
              <Field label="Sr No">
                <Input
                  type="number"
                  value={form.srNo}
                  onChange={(e) => set("srNo", e.target.value)}
                  placeholder="Auto"
                />
              </Field>
              <Field label="Mobile">
                <Input
                  value={form.mobile}
                  onChange={(e) => set("mobile", e.target.value)}
                />
              </Field>
              <Field label="Block">
                <Input
                  value={form.blockNo}
                  onChange={(e) => set("blockNo", e.target.value)}
                  placeholder="C"
                />
              </Field>
              <Field label="Flat Number">
                <Input
                  value={form.flatNo}
                  onChange={(e) => set("flatNo", e.target.value)}
                  placeholder="1201"
                />
              </Field>
              <Field label="Date of Birth">
                <Input
                  type="date"
                  value={form.dob}
                  onChange={(e) => set("dob", e.target.value)}
                />
              </Field>
              <Field label="Skill">
                <Select
                  value={form.skill}
                  onChange={(e) => set("skill", e.target.value)}
                >
                  {SKILLS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Key Strength" className="col-span-2">
                <Input
                  value={form.keyStrength}
                  onChange={(e) => set("keyStrength", e.target.value)}
                  placeholder="e.g. Aggressive batting, spin bowling"
                />
              </Field>

              {/* Photo uploader */}
              <Field label="Player Photo" className="col-span-2">
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl ring-1 ring-slate-200">
                    {form.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={proxiedImageUrl(form.photoUrl) ?? ""}
                        alt="preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-100">
                        <User size={28} className="text-slate-400" />
                      </div>
                    )}
                    {uploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                        <Loader2 size={20} className="animate-spin text-pitch-700" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadPhoto(f);
                      }}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={uploading}
                        onClick={() => fileRef.current?.click()}
                      >
                        <Upload size={14} />
                        {form.photoUrl ? "Change photo" : "Upload photo"}
                      </Button>
                      {form.photoUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => set("photoUrl", "")}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Upload a PNG, JPG, WEBP or GIF (up to 5 MB), or paste an
                      image link below. Google Drive links work if the file is
                      shared as &ldquo;Anyone with the link.&rdquo;
                    </p>
                  </div>
                </div>

                {/* OR paste an image URL */}
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    or link
                  </span>
                  <div className="relative flex-1">
                    <LinkIcon
                      size={14}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <Input
                      value={form.photoUrl}
                      onChange={(e) => set("photoUrl", e.target.value)}
                      placeholder="https://example.com/player.jpg"
                      className="pl-8"
                    />
                  </div>
                </div>
              </Field>
              <label className="col-span-2 flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={form.lastOecl}
                  onChange={(e) => set("lastOecl", e.target.checked)}
                  className="h-4 w-4 rounded accent-pitch-500"
                />
                Played last OECL
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={save} disabled={saving || uploading}>
                {saving ? "Saving..." : player ? "Save Changes" : "Add Player"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-medium text-slate-500">
        {label}
      </label>
      {children}
    </div>
  );
}
