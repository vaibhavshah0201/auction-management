import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import {
  SKILLS,
  resolveImageUrl,
  parseExcelDate,
  ageFromDob,
} from "@/lib/utils";

export const runtime = "nodejs";

/**
 * Bulk-import players from an uploaded Excel/CSV file.
 *
 * Accepts multipart/form-data with:
 *  - file: the .xlsx / .xls / .csv file
 *  - dryRun: "true" to validate & preview without writing
 *
 * Built for the OECL Google-Form response sheet, whose columns are:
 *   NAME, MOBILE NUMBER, BLOCK, FLAT NUMBER,
 *   HAVE YOU PARTICIPATED EARLIER OECL ?, UPLOAD YOUR PHOTO,
 *   DATE OF BIRTH (AGE 15 AND ABOVE), SKILL-SET, KEY STRENGTH
 * Headers are matched case-insensitively and flexibly, so minor wording or
 * trailing-space differences still map correctly. Age is computed from DOB.
 */

type RawRow = Record<string, unknown>;

interface ParsedPlayer {
  srNo: number | null;
  name: string;
  blockNo: string | null;
  flatNo: string | null;
  dob: Date | null;
  skill: string;
  keyStrength: string | null;
  lastOecl: boolean;
  mobile: string | null;
  photoUrl: string | null;
  soldTo: string | null;
  amount: number | null;
}

interface RowResult {
  row: number;
  name: string;
  status: "ok" | "skipped" | "error";
  message?: string;
}

// Normalize a header to a lookup key: lowercase, strip non-alphanumerics
function norm(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Exact normalized-header -> field matches (checked first).
const EXACT_ALIASES: Record<string, keyof ParsedPlayer> = {
  name: "name",
  playername: "name",
  player: "name",
  srno: "srNo",
  sr: "srNo",
  srnumber: "srNo",
  slno: "srNo",
  block: "blockNo",
  blockno: "blockNo",
  blocknumber: "blockNo",
  flatno: "flatNo",
  flat: "flatNo",
  flatnumber: "flatNo",
  skill: "skill",
  skillset: "skill",
  role: "skill",
  keystrength: "keyStrength",
  strength: "keyStrength",
  mobile: "mobile",
  mobilenumber: "mobile",
  phone: "mobile",
  contact: "mobile",
  soldto: "soldTo",
  team: "soldTo",
  amount: "amount",
  soldamount: "amount",
  price: "amount",
};

/**
 * Resolve a (normalized) header to a player field. Uses exact matches first,
 * then substring heuristics for the wordy Google-Form column names.
 */
function fieldFor(normKey: string): keyof ParsedPlayer | null {
  if (EXACT_ALIASES[normKey]) return EXACT_ALIASES[normKey];
  if (normKey.includes("dateofbirth") || normKey === "dob") return "dob";
  if (normKey.includes("keystrength")) return "keyStrength";
  if (normKey.includes("skill")) return "skill";
  if (normKey.includes("participatedearlier") || normKey.includes("oecl"))
    return "lastOecl";
  if (normKey.includes("uploadyourphoto") || normKey.includes("photo"))
    return "photoUrl";
  if (normKey.includes("mobile") || normKey.includes("phone")) return "mobile";
  if (normKey.includes("block")) return "blockNo";
  if (normKey.includes("flat")) return "flatNo";
  return null;
}

function truthy(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  const s = String(v ?? "").trim().toLowerCase();
  return ["yes", "y", "true", "1", "oecl", "veteran"].includes(s);
}

function toNumber(v: unknown): number | null {
  if (v == null || v === "") return null;
  // Strip currency symbols, commas, spaces
  const s = String(v).replace(/[^0-9.-]/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function normalizeSkill(v: unknown): string {
  const raw = String(v ?? "").trim().toUpperCase();
  if (!raw) return "ALL-ROUNDER";
  // Combo like "BATTER, BOWLER, ALL-ROUNDER" -> treat as all-rounder.
  if (raw.includes(",") || raw.includes("ALL")) return "ALL-ROUNDER";
  const s = raw.replace(/\s+/g, "-");
  const match = SKILLS.find((sk) => sk === s);
  if (match) return match;
  if (s.includes("KEEP") || s.includes("WK")) return "WICKET-KEEPER";
  if (s.includes("BAT")) return "BATTER";
  if (s.includes("BOWL")) return "BOWLER";
  return "ALL-ROUNDER";
}

function parseRow(raw: RawRow): ParsedPlayer {
  const mapped: Partial<Record<keyof ParsedPlayer, unknown>> = {};
  for (const [key, value] of Object.entries(raw)) {
    const field = fieldFor(norm(key));
    if (field && mapped[field] == null) mapped[field] = value;
  }

  return {
    srNo: toNumber(mapped.srNo),
    name: String(mapped.name ?? "").trim(),
    blockNo: mapped.blockNo != null ? String(mapped.blockNo).trim() : null,
    flatNo: mapped.flatNo != null ? String(mapped.flatNo).trim() : null,
    dob: parseExcelDate(mapped.dob),
    skill: normalizeSkill(mapped.skill),
    keyStrength:
      mapped.keyStrength != null ? String(mapped.keyStrength).trim() : null,
    lastOecl: truthy(mapped.lastOecl),
    mobile: mapped.mobile != null ? String(mapped.mobile).trim() : null,
    photoUrl: mapped.photoUrl != null ? String(mapped.photoUrl).trim() : null,
    soldTo: mapped.soldTo != null ? String(mapped.soldTo).trim() : null,
    amount: toNumber(mapped.amount),
  };
}

export async function POST(req: NextRequest) {
  const form = (await req.formData()) as unknown as {
    get(name: string): File | string | null;
  };
  const file = form.get("file");
  const dryRun = String(form.get("dryRun") ?? "") === "true";

  if (!file || typeof file === "string") {
    return NextResponse.json(
      { error: "No file uploaded. Attach an .xlsx, .xls or .csv file." },
      { status: 400 }
    );
  }

  let rows: RawRow[];
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buf, { type: "buffer" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    if (!sheet) {
      return NextResponse.json(
        { error: "The file has no sheets." },
        { status: 422 }
      );
    }
    rows = XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: null });
  } catch {
    return NextResponse.json(
      { error: "Could not read the file. Make sure it is a valid Excel/CSV." },
      { status: 422 }
    );
  }

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No rows found in the file." },
      { status: 422 }
    );
  }

  // Preload teams for sold-to matching
  const teams = await prisma.team.findMany({
    select: { id: true, name: true, shortName: true },
  });
  const teamByName = new Map<string, string>();
  for (const t of teams) {
    teamByName.set(norm(t.name), t.id);
    if (t.shortName) teamByName.set(norm(t.shortName), t.id);
  }

  // Next srNo to auto-assign
  const maxAgg = await prisma.player.aggregate({ _max: { srNo: true } });
  let nextSrNo = (maxAgg._max.srNo ?? 0) + 1;

  const results: RowResult[] = [];
  const toCreate: {
    data: {
      srNo: number | null;
      name: string;
      blockNo: string | null;
      flatNo: string | null;
      dob: Date | null;
      age: number | null;
      skill: string;
      keyStrength: string | null;
      lastOecl: boolean;
      mobile: string | null;
      photoUrl: string | null;
      status: string;
      soldAmount: number | null;
      teamId: string | null;
    };
  }[] = [];

  rows.forEach((raw, i) => {
    const rowNum = i + 2; // header is row 1
    const p = parseRow(raw);

    if (!p.name) {
      results.push({
        row: rowNum,
        name: "(blank)",
        status: "skipped",
        message: "No player name",
      });
      return;
    }

    let teamId: string | null = null;
    let status = "AVAILABLE";
    let soldAmount: number | null = null;

    if (p.soldTo) {
      const match = teamByName.get(norm(p.soldTo));
      if (!match) {
        results.push({
          row: rowNum,
          name: p.name,
          status: "error",
          message: `Team "${p.soldTo}" not found. Create it first or leave Sold To blank.`,
        });
        return;
      }
      teamId = match;
      status = "SOLD";
      soldAmount = p.amount ?? 0;
    }

    toCreate.push({
      data: {
        srNo: p.srNo ?? nextSrNo++,
        name: p.name,
        blockNo: p.blockNo,
        flatNo: p.flatNo,
        dob: p.dob,
        age: ageFromDob(p.dob),
        skill: p.skill,
        keyStrength: p.keyStrength,
        lastOecl: p.lastOecl,
        mobile: p.mobile,
        photoUrl: resolveImageUrl(p.photoUrl),
        status,
        soldAmount,
        teamId,
      },
    });
    results.push({ row: rowNum, name: p.name, status: "ok" });
  });

  const okCount = toCreate.length;

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      totalRows: rows.length,
      willImport: okCount,
      results,
    });
  }

  // Create players
  let created = 0;
  for (const c of toCreate) {
    try {
      await prisma.player.create(c);
      created++;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "create failed";
      const r = results.find((r) => r.name === c.data.name && r.status === "ok");
      if (r) {
        r.status = "error";
        r.message = msg;
      }
    }
  }

  return NextResponse.json({
    dryRun: false,
    totalRows: rows.length,
    imported: created,
    results,
  });
}
