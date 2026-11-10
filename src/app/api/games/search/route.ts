import { type NextRequest, NextResponse } from "next/server";
import { searchCatalog } from "@/lib/catalog/server";

/**
 * GET /api/games/search?q=zelda
 * Searches our catalog and, when it has few matches, IGDB (results are stored).
 * A small per-IP limit protects the IGDB quota from abuse.
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 40;
const hits = new Map<string, number[]>();

function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 10_000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").slice(0, 80);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) {
    return NextResponse.json({ error: "Too many searches. Please wait a moment." }, { status: 429 });
  }
  try {
    const games = await searchCatalog(q);
    return NextResponse.json({ games }, { headers: { "Cache-Control": "private, max-age=60" } });
  } catch (e) {
    console.error("[search]", e);
    return NextResponse.json({ error: "Search is unavailable right now." }, { status: 502 });
  }
}
