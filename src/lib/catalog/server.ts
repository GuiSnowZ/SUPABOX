import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getIgdbClient } from "@/lib/igdb/client";
import { fetchGameRows, type GameRow, igdbSearchTerm, PLAYABLE_GAME_TYPES } from "@/lib/igdb/map";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getPublicSupabase } from "@/lib/supabase/public";
import type { Game } from "@/types";
import { GAME_COLUMNS, type GameDbRow, todayIso, toGame } from "./rows";

/**
 * Server-side game catalog. Reads come from our `games` table (public data);
 * games missing locally are fetched from IGDB and stored ("import on demand").
 */

const MIN_RECENT_POPULARITY = 3;
const MIN_UPCOMING_POPULARITY = 10;
/** "Recent" means released in the last N days; the biggest of those are shown first. */
const RECENT_WINDOW_DAYS = 60;
/** Upcoming games considered: releasing within the next N days. */
const UPCOMING_WINDOW_DAYS = 180;

function db() {
  const client = getPublicSupabase();
  if (!client) throw new Error("Supabase is not configured.");
  return client;
}

const daysFromNow = (days: number) => todayIso(new Date(Date.now() + days * 86_400_000));

/**
 * The biggest releases of the last two months, most popular first
 * (popularity = IGDB player ratings + pre-release hype, refreshed by the sync).
 * Falls back to a wider window when a quiet period has too few games.
 */
export async function getRecentlyReleased(limit = 18): Promise<Game[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("games");
  const today = todayIso();
  let games: Game[] = [];
  for (const window of [RECENT_WINDOW_DAYS, 120, 365]) {
    const { data, error } = await db()
      .from("games")
      .select(GAME_COLUMNS)
      .lte("release_date", today)
      .gte("release_date", daysFromNow(-window))
      .gte("popularity", MIN_RECENT_POPULARITY)
      .not("cover_url", "is", null)
      .order("popularity", { ascending: false })
      .order("release_date", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    games = (data as GameDbRow[]).map(toGame);
    if (games.length >= limit) break;
  }
  return games;
}

/** The most anticipated games of the next six months, shown soonest first. */
export async function getUpcoming(limit = 12): Promise<Game[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("games");
  const { data, error } = await db()
    .from("games")
    .select(GAME_COLUMNS)
    .gt("release_date", todayIso())
    .lte("release_date", daysFromNow(UPCOMING_WINDOW_DAYS))
    .gte("popularity", MIN_UPCOMING_POPULARITY)
    .not("cover_url", "is", null)
    .order("popularity", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data as GameDbRow[])
    .map(toGame)
    .sort((a, b) => (a.releaseDate ?? "").localeCompare(b.releaseDate ?? ""));
}

async function findBySlug(slug: string): Promise<Game | null> {
  const { data, error } = await db().from("games").select(GAME_COLUMNS).eq("slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toGame(data as GameDbRow) : null;
}

/**
 * Store IGDB rows. Slug clashes with a different IGDB game (rare after slug
 * normalisation) get the IGDB id appended so both can exist.
 */
export async function upsertGameRows(rows: GameRow[]): Promise<Game[]> {
  const admin = getAdminSupabase();
  if (!admin || !rows.length) return [];
  const unique = [...new Map(rows.map((r) => [r.provider_id, r])).values()];
  const { data, error } = await admin
    .from("games")
    .upsert(unique, { onConflict: "provider,provider_id" })
    .select(GAME_COLUMNS);
  if (!error) return (data as GameDbRow[]).map(toGame);
  if (error.code !== "23505") throw new Error(error.message);
  const saved: Game[] = [];
  for (const row of unique) {
    let res = await admin.from("games").upsert(row, { onConflict: "provider,provider_id" }).select(GAME_COLUMNS);
    if (res.error?.code === "23505") {
      res = await admin
        .from("games")
        .upsert({ ...row, slug: `${row.slug}--igdb-${row.provider_id}` }, { onConflict: "provider,provider_id" })
        .select(GAME_COLUMNS);
    }
    if (res.error) throw new Error(res.error.message);
    saved.push(...(res.data as GameDbRow[]).map(toGame));
  }
  return saved;
}

/** Game by URL slug; imports it from IGDB when we don't have it yet. */
export async function resolveGameBySlug(slug: string): Promise<Game | null> {
  if (!/^[a-z0-9]+(-+[a-z0-9]+)*$/.test(slug)) return null;
  const local = await findBySlug(slug);
  if (local) return local;
  const igdb = getIgdbClient();
  if (!igdb || !getAdminSupabase()) return null;
  const rows = await fetchGameRows(igdb, `slug = "${slug}"`, { limit: 1 });
  const [saved] = await upsertGameRows(rows);
  return saved ?? null;
}

/** IGDB search results for a query, cached for a day per query. */
async function searchIgdbRows(term: string): Promise<GameRow[]> {
  "use cache";
  cacheLife("days");
  const igdb = getIgdbClient();
  if (!igdb) return [];
  // IGDB's `search` ranks by relevance; fetch matching ids, then full rows.
  const hits = await igdb.query<{ id: number }>(
    "games",
    `search "${term}"; fields id; where game_type = ${PLAYABLE_GAME_TYPES} & cover != null; limit 20;`,
  );
  if (!hits.length) return [];
  return fetchGameRows(igdb, `id = (${hits.map((h) => h.id).join(",")})`, { limit: 20 });
}

/**
 * Search our catalog by title; when it has few matches, ask IGDB too and store
 * what it finds, so every game anyone searches for becomes part of Supabox.
 */
export async function searchCatalog(query: string, limit = 24): Promise<Game[]> {
  const term = igdbSearchTerm(query);
  if (term.length < 2) return [];
  const pattern = `%${term.toLowerCase().replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
  const { data, error } = await db()
    .from("games")
    .select(GAME_COLUMNS)
    .ilike("title", pattern)
    .order("popularity", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  const local = (data as GameDbRow[]).map(toGame);
  if (local.length >= 8 || !getAdminSupabase()) return local;

  const imported = await upsertGameRows(await searchIgdbRows(term));
  const seen = new Set(local.map((g) => g.id));
  return [...local, ...imported.filter((g) => !seen.has(g.id))].slice(0, limit);
}
