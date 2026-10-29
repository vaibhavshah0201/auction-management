import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

const ALLOWED = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Uploads a player photo and returns a stable, persistent URL.
 * Files are written to public/uploads/ so they survive server restarts
 * and are served statically at /uploads/<file>.
 */
export async function POST(req: NextRequest) {
  const form = (await req.formData()) as unknown as {
    get(name: string): File | string | null;
  };
  const file = form.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json(
      { error: "Unsupported image type. Use PNG, JPG, WEBP or GIF." },
      { status: 422 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image is too large (max 5 MB)." },
      { status: 422 }
    );
  }

  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const safeExt = /^[a-z0-9]+$/.test(ext) ? ext : "png";
  const filename = `${randomUUID()}.${safeExt}`;

  const uploadDir = join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(join(uploadDir, filename), buffer);

  const url = `/uploads/${filename}`;
  return NextResponse.json({ url });
}
