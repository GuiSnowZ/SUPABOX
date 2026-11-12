import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getIgdbClient } from "@/lib/igdb/client";
import { fetchGameRows, type GameRow, igdbSearchTerm, PLAYABLE_GAME_TYPES } from "@/lib/igdb/map";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getPublicSupabase } from "@/lib/supabase/public";
import type { Game } from "@/types";
import { GAME_COLUMNS, type GameDbRow, SITE_TIME_ZONE, sortByReleaseBuzz, todayIn, todayIso, toGame } from "./rows";

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

/** Window for "new releases": released in the last N days. */
const NEW_RELEASES_WINDOW_DAYS = 90;
/** Safety cap on candidates ranked in memory (a 90-day window holds a few hundred). */
const MAX_RELEASE_CANDIDATES = 1000;

/**
 * Released games of the last `days`, hottest first: popularity decays with
 * age (see releaseBuzz), so this week's big launch sits above a bigger game
 * from two months ago. Ranking happens here because it depends on today's date.
 */
async function rankedReleases(days: number): Promise<Game[]> {
  const today = todayIso();
  const { data, error } = await db()
    .from("games")
    .select(GAME_COLUMNS)
    .lte("release_date", today)
    .gte("release_date", daysFromNow(-days))
    .gte("popularity", MIN_RECENT_POPULARITY)
    .not("cover_url", "is", null)
    .order("popularity", { ascending: false })
    .limit(MAX_RELEASE_CANDIDATES);
  if (error) throw new Error(error.message);
  return sortByReleaseBuzz((data as GameDbRow[]).map(toGame), today);
}

/**
 * The hottest releases right now (popularity = IGDB player ratings +
 * pre-release hype, refreshed by the daily sync, decayed by age).
 * Falls back to a wider window when a quiet period has too few games.
 */
export async function getRecentlyReleased(limit = 18): Promise<Game[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("games");
  let games: Game[] = [];
  for (const window of [RECENT_WINDOW_DAYS, NEW_RELEASES_WINDOW_DAYS, 365]) {
    games = await rankedReleases(window);
    if (games.length >= limit) break;
  }
  return games.slice(0, limit);
}

/** Games released today (São Paulo time), biggest first. */
export async function getTodaysReleases(limit = 12): Promise<Game[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("games");
  const { data, error } = await db()
    .from("games")
    .select(GAME_COLUMNS)
    .eq("release_date", todayIn(SITE_TIME_ZONE))
    .not("cover_url", "is", null)
    .order("popularity", { ascending: false })
    .order("title", { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data as GameDbRow[]).map(toGame);
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

export const PAGE_SIZE = 24;
export const MAX_PAGES = 20;

export interface GamePage {
  games: Game[];
  page: number;
  /** Total pages available (capped at MAX_PAGES). */
  pages: number;
  total: number;
}

function clampPage(page: number) {
  return Number.isFinite(page) ? Math.min(MAX_PAGES, Math.max(1, Math.floor(page))) : 1;
}

type GameQuery = ReturnType<ReturnType<typeof db>["from"]>;

/**
 * Run a filtered games query one page at a time. PostgREST answers
 * "range not satisfiable" (PGRST103) for pages past the end, so in that case
 * we only count the rows and return an empty page (the route then redirects).
 */
async function pagedGames(
  pageNumber: number,
  filter: (q: ReturnType<GameQuery["select"]>) => ReturnType<GameQuery["select"]>,
): Promise<GamePage> {
  const page = clampPage(pageNumber);
  const from = (page - 1) * PAGE_SIZE;
  const pagesFor = (total: number) => Math.min(MAX_PAGES, Math.max(1, Math.ceil(total / PAGE_SIZE)));
  const { data, error, count } = await filter(db().from("games").select(GAME_COLUMNS, { count: "exact" })).range(
    from,
    from + PAGE_SIZE - 1,
  );
  if (error?.code === "PGRST103") {
    const head = await filter(db().from("games").select("id", { count: "exact", head: true }));
    if (head.error) throw new Error(head.error.message);
    const total = head.count ?? 0;
    return { games: [], page, total, pages: pagesFor(total) };
  }
  if (error) throw new Error(error.message);
  const total = count ?? 0;
  return { games: (data as unknown as GameDbRow[]).map(toGame), page, total, pages: pagesFor(total) };
}

/** All new releases of the last 90 days, hottest first, one page at a time. */
export async function getNewReleasesPage(pageNumber: number): Promise<GamePage> {
  "use cache";
  cacheLife("hours");
  cacheTag("games");
  const all = await rankedReleases(NEW_RELEASES_WINDOW_DAYS);
  const page = clampPage(pageNumber);
  const pages = Math.min(MAX_PAGES, Math.max(1, Math.ceil(all.length / PAGE_SIZE)));
  const from = (page - 1) * PAGE_SIZE;
  return { games: all.slice(from, from + PAGE_SIZE), page, pages, total: all.length };
}

/** Games releasing in the next 12 months, most anticipated first, one page at a time. */
export async function getComingSoonPage(pageNumber: number): Promise<GamePage> {
  "use cache";
  cacheLife("hours");
  cacheTag("games");
  return pagedGames(pageNumber, (q) =>
    q
      .gt("release_date", todayIso())
      .lte("release_date", daysFromNow(365))
      .gte("popularity", MIN_RECENT_POPULARITY)
      .not("cover_url", "is", null)
      .order("popularity", { ascending: false })
      .order("release_date", { ascending: true })
      .order("id", { ascending: true }),
  );
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
