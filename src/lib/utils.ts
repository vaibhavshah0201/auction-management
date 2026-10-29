import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Format a number as Indian Rupees, e.g. 1700000 -> ₹17,00,000 */
export function formatINR(amount: number | null | undefined): string {
  if (amount == null) return "₹0";
  return "₹" + amount.toLocaleString("en-IN");
}

/** Compact currency, e.g. 1700000 -> ₹17.0L, 20000000 -> ₹2.0Cr */
export function formatINRCompact(amount: number | null | undefined): string {
  if (amount == null) return "₹0";
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return "₹" + amount.toString();
}

export const SKILLS = [
  "BATTER",
  "BOWLER",
  "ALL-ROUNDER",
  "WICKET-KEEPER",
] as const;

export type Skill = (typeof SKILLS)[number];

export const SKILL_COLORS: Record<string, string> = {
  BATTER: "#3b82f6",
  BATSMAN: "#3b82f6",
  BOWLER: "#ef4444",
  "ALL-ROUNDER": "#22c55e",
  "WICKET-KEEPER": "#a855f7",
};

/** Compute age in whole years from a date of birth. */
export function ageFromDob(dob: Date | null | undefined): number | null {
  if (!dob) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age >= 0 && age < 120 ? age : null;
}

/**
 * Parse a date of birth from an Excel cell, which may be:
 *  - an Excel serial number (days since 1899-12-30), e.g. 31575
 *  - a date string like "12/06/1986" or "1986-06-12"
 * Returns a Date or null.
 */
export function parseExcelDate(value: unknown): Date | null {
  if (value == null || value === "") return null;

  // Excel serial number
  if (typeof value === "number" && Number.isFinite(value)) {
    const ms = Math.round((value - 25569) * 86400 * 1000);
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }

  const s = String(value).trim();
  // dd/mm/yyyy or mm/dd/yyyy — assume dd/mm/yyyy (common in India)
  const dmy = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (dmy) {
    let [, a, b, y] = dmy;
    let year = Number(y);
    if (year < 100) year += year < 30 ? 2000 : 1900;
    const day = Number(a);
    const month = Number(b);
    // If first part > 12 it must be the day; otherwise treat as dd/mm.
    const d = new Date(year, month - 1, day);
    return isNaN(d.getTime()) ? null : d;
  }

  const parsed = new Date(s);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Normalize a photo URL so an <img> tag can actually render it.
 *
 * Share links from Google Drive (and a few other services) point to an HTML
 * viewer page, not the raw image. An <img> can't display those, so we rewrite
 * them to a direct-image endpoint. For Drive, the file must be shared as
 * "Anyone with the link can view" for this to load in the browser.
 *
 * Handles:
 *   https://drive.google.com/open?id=FILE_ID
 *   https://drive.google.com/file/d/FILE_ID/view?...
 *   https://drive.google.com/uc?id=FILE_ID&...
 *   https://docs.google.com/.../d/FILE_ID/...
 *   https://dropbox.com/...?dl=0        -> raw content
 * Any other URL (including our own /uploads/...) is returned unchanged.
 */
export function resolveImageUrl(
  url: string | null | undefined
): string | null {
  if (!url) return null;
  const u = url.trim();
  if (!u) return null;

  // Google Drive / Docs.
  // Use the googleusercontent image host, which renders in <img> tags far
  // more reliably than drive.google.com/uc (that endpoint is often blocked
  // by a consent/scan redirect even for public files).
  if (/(?:drive|docs|lh3)\.google(?:usercontent)?\.com/.test(u)) {
    // Already a direct lh3 content URL — leave it alone.
    if (/lh3\.googleusercontent\.com\/d\//.test(u)) return u;
    const id = extractDriveId(u);
    // =s0 asks lh3 for the original, full-resolution image.
    if (id) return `https://lh3.googleusercontent.com/d/${id}=s0`;
  }

  // Dropbox share links -> direct content
  if (/dropbox\.com/.test(u)) {
    return u
      .replace("www.dropbox.com", "dl.dropboxusercontent.com")
      .replace(/([?&])dl=0\b/, "$1dl=1");
  }

  return u;
}

/**
 * Wrap an external image URL so it is served through our same-origin proxy.
 * Local uploads (/uploads/...) and already-proxied URLs are returned as-is.
 * This keeps every <img> same-origin, which fixes Drive display quirks and
 * lets html-to-image export without tainting the canvas.
 */
export function proxiedImageUrl(
  url: string | null | undefined
): string | null {
  const resolved = resolveImageUrl(url);
  if (!resolved) return null;
  // Already local or already proxied — leave it.
  if (resolved.startsWith("/")) return resolved;
  if (/^https?:\/\//.test(resolved)) {
    return `/api/image-proxy?url=${encodeURIComponent(resolved)}`;
  }
  return resolved;
}

function extractDriveId(url: string): string | null {
  // ?id=FILE_ID  or  &id=FILE_ID
  const idParam = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParam) return idParam[1];
  // /d/FILE_ID/
  const pathId = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (pathId) return pathId[1];
  return null;
}
