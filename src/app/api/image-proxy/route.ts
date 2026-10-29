import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Same-origin image proxy.
 *
 * Fetches an external image (e.g. Google Drive's lh3 host) on the server and
 * streams it back from our own origin. This solves two problems at once:
 *  1. Display: avoids browser CORS/cache quirks so Drive photos render reliably.
 *  2. Export: html-to-image can rasterize these images without tainting the
 *     canvas, because they are now same-origin.
 *
 * Only http(s) image URLs are proxied. Local /uploads paths don't need this.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }
  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return NextResponse.json({ error: "unsupported protocol" }, { status: 400 });
  }

  try {
    const upstream = await fetch(target.toString(), {
      // Follow Drive redirects; present a normal UA so Google serves the image.
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AuctionManager/1.0; +https://localhost)",
      },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `upstream responded ${upstream.status}` },
        { status: 502 }
      );
    }

    const contentType =
      upstream.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json(
        { error: "not an image" },
        { status: 415 }
      );
    }

    const buf = Buffer.from(await upstream.arrayBuffer());
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "failed to fetch image" },
      { status: 502 }
    );
  }
}
