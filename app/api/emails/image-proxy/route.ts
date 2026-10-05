import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";

// Blocks obvious internal/private targets (SSRF guard) — this proxy is only
// reachable by authenticated CRM users, but shouldn't be usable to probe the
// VPS's own network (Postgres, MinIO, cloud metadata, etc).
const BLOCKED_HOSTNAME_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^169\.254\./,
  /^0\.0\.0\.0$/,
  /^\[?::1\]?$/,
];

function isBlockedHost(hostname: string): boolean {
  return BLOCKED_HOSTNAME_PATTERNS.some((p) => p.test(hostname));
}

/**
 * Proxies remote images referenced in email HTML through our own server.
 * Many providers (Cloudflare-fronted CDNs in particular) block or challenge
 * cross-site <img> requests loaded from inside another site's iframe, which
 * silently breaks images even though the URL works fine when fetched
 * directly. Fetching server-side and re-serving from our own origin avoids
 * that entirely, and is the same approach Gmail/Outlook use.
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new NextResponse("Missing url parameter", { status: 400 });

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return new NextResponse("Invalid url", { status: 400 });
  }

  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return new NextResponse("Invalid protocol", { status: 400 });
  }
  if (isBlockedHost(target.hostname)) {
    return new NextResponse("Forbidden host", { status: 403 });
  }

  try {
    const upstream = await fetch(target.toString(), {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; UKRBA-CRM-ImageProxy/1.0)" },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });

    if (!upstream.ok || !upstream.body) {
      return new NextResponse("Failed to fetch image", { status: 502 });
    }

    const contentType = upstream.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return new NextResponse("Not an image", { status: 415 });
    }

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch {
    return new NextResponse("Error fetching image", { status: 502 });
  }
}
