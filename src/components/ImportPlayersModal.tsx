"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
} from "lucide-react";
import { Button } from "./ui";

interface RowResult {
  row: number;
  name: string;
  status: "ok" | "skipped" | "error";
  message?: string;
}

interface PreviewData {
  totalRows: number;
  willImport?: number;
  imported?: number;
  results: RowResult[];
}

export function ImportPlayersModal({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [done, setDone] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setFile(null);
    setPreview(null);
    setDone(null);
    setError(null);
    setLoading(false);
  }

  function close() {
    reset();
    onClose();
  }

  function pick(f: File | null) {
    setError(null);
    setPreview(null);
    setDone(null);
    setFile(f);
  }

  async function upload(dryRun: boolean) {
    if (!file) return;
    setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("dryRun", String(dryRun));
    const res = await fetch("/api/players/import", {
      method: "POST",
      body: fd,
    });
    setLoading(false);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Import failed");
      return;
    }
    if (dryRun) setPreview(data);
    else {
      setDone(data);
      onImported();
    }
  }

  function downloadTemplate() {
    const headers = [
      "NAME",
      "MOBILE NUMBER",
      "BLOCK",
      "FLAT NUMBER",
      "HAVE YOU PARTICIPATED EARLIER OECL ?",
      "UPLOAD YOUR PHOTO",
      "DATE OF BIRTH (AGE 15 AND ABOVE)",
      "SKILL-SET",
      "KEY STRENGTH",
    ];
    const sample = [
      "Rahul Sharma",
      "9998887776",
      "C",
      "1201",
      "YES",
      "https://drive.google.com/open?id=FILE_ID",
      "12/06/1990",
      "ALL-ROUNDER",
      "Aggressive batting",
    ];
    const csv = headers.join(",") + "\n" + sample.join(",") + "\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "players-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const results = done?.results ?? preview?.results ?? [];
  const errors = results.filter((r) => r.status === "error");
  const skipped = results.filter((r) => r.status === "skipped");
  const ok = results.filter((r) => r.status === "ok");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="glass max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-pitch-700" />
                <h2 className="text-xl font-bold text-slate-900">
                  Import Players from Excel
                </h2>
              </div>
              <button
                onClick={close}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}

            {/* STEP: success */}
            {done ? (
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-pitch-100"
                >
                  <CheckCircle2 className="h-9 w-9 text-pitch-700" />
                </motion.div>
                <h3 className="text-2xl font-black text-slate-900">
                  {done.imported} players imported
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  out of {done.totalRows} rows
                  {errors.length > 0 && ` · ${errors.length} errors`}
                  {skipped.length > 0 && ` · ${skipped.length} skipped`}
                </p>
                {results.filter((r) => r.status !== "ok").length > 0 && (
                  <ResultList
                    results={results.filter((r) => r.status !== "ok")}
                  />
                )}
                <div className="mt-6 flex justify-center gap-2">
                  <Button variant="secondary" onClick={reset}>
                    Import Another
                  </Button>
                  <Button onClick={close}>Done</Button>
                </div>
              </div>
            ) : (
              <>
                {/* STEP: dropzone */}
                {!preview && (
                  <>
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                      }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        pick(e.dataTransfer.files?.[0] ?? null);
                      }}
                      onClick={() => inputRef.current?.click()}
                      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
                        dragOver
                          ? "border-pitch-500 bg-pitch-50"
                          : "border-slate-300 bg-slate-50 hover:border-pitch-400"
                      }`}
                    >
                      <UploadCloud className="mb-3 h-10 w-10 text-slate-400" />
                      {file ? (
                        <p className="font-semibold text-slate-900">
                          {file.name}
                        </p>
                      ) : (
                        <>
                          <p className="font-semibold text-slate-700">
                            Drop your Excel file here, or click to browse
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Supports .xlsx, .xls and .csv
                          </p>
                        </>
                      )}
                      <input
                        ref={inputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                        onChange={(e) => pick(e.target.files?.[0] ?? null)}
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <button
                        onClick={downloadTemplate}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-pitch-700 hover:underline"
                      >
                        <Download size={14} />
                        Download CSV template
                      </button>
                      <p className="text-xs text-slate-400">
                        Columns: Name, Mobile, Block, Flat, DOB, Skill-Set, Key
                        Strength…
                      </p>
                    </div>

                    <div className="mt-6 flex justify-end gap-2">
                      <Button variant="secondary" onClick={close}>
                        Cancel
                      </Button>
                      <Button
                        disabled={!file || loading}
                        onClick={() => upload(true)}
                      >
                        {loading ? "Reading..." : "Preview"}
                      </Button>
                    </div>
                  </>
                )}

                {/* STEP: preview */}
                {preview && (
                  <div>
                    <div className="mb-3 grid grid-cols-3 gap-2 text-center">
                      <Stat label="Ready" value={ok.length} tone="ok" />
                      <Stat label="Skipped" value={skipped.length} tone="skip" />
                      <Stat label="Errors" value={errors.length} tone="err" />
                    </div>

                    <ResultList results={results} />

                    <div className="mt-6 flex justify-end gap-2">
                      <Button variant="secondary" onClick={reset}>
                        Back
                      </Button>
                      <Button
                        disabled={ok.length === 0 || loading}
                        onClick={() => upload(false)}
                      >
                        {loading
                          ? "Importing..."
                          : `Import ${ok.length} players`}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ok" | "skip" | "err";
}) {
  const tones = {
    ok: "bg-pitch-50 text-pitch-700",
    skip: "bg-amber-50 text-amber-700",
    err: "bg-red-50 text-red-700",
  };
  return (
    <div className={`rounded-lg py-3 ${tones[tone]}`}>
      <p className="text-2xl font-black tabular">{value}</p>
      <p className="text-xs font-medium">{label}</p>
    </div>
  );
}

function ResultList({ results }: { results: RowResult[] }) {
  return (
    <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-slate-200">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 bg-slate-100 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2">Row</th>
            <th className="px-3 py-2">Player</th>
            <th className="px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr key={i} className="border-t border-slate-100">
              <td className="px-3 py-1.5 text-slate-400 tabular">{r.row}</td>
              <td className="px-3 py-1.5 font-medium text-slate-900">
                {r.name}
              </td>
              <td className="px-3 py-1.5">
                {r.status === "ok" && (
                  <span className="text-pitch-700">Ready</span>
                )}
                {r.status === "skipped" && (
                  <span className="text-amber-600">{r.message}</span>
                )}
                {r.status === "error" && (
                  <span className="text-red-600">{r.message}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
