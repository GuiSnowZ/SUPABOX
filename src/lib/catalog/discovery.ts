import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import {
  type ActivitySignal,
  type DiscoveryItem,
  type DiscoveryRowData,
  hiddenGems,
  type RowSource,
  trendingFromActivity,
  TRENDING_WINDOW_DAYS,
} from "@/lib/discovery";
import { CLASSICS_LIST_SLUG, getOfficialList } from "@/lib/official-lists/server";
import { createPublicSupabase } from "@/lib/supabase/public";
import type { Game } from "@/types";
import { GAME_COLUMNS, type GameDbRow, SITE_TIME_ZONE, sortByReleaseBuzz, todayIn, todayIso, toGame } from "./rows";
import { MAX_PAGES, PAGE_SIZE, type GamePage } from "./server";

/**
 * Data for the Home discovery rows that are the same for everyone (Trending,
 * Recently Released, Hidden Gems), cached on the server. Personal rows (You
 * Might Like, Popular With Friends) are computed in the browser.
 *
 * Where Supabox's own community data is still thin, rows are topped up with a
 * clearly labelled fallback instead of inventing activity.
 */

function db() {
  const client = createPublicSupabase();
  if (!client) throw new Error("Supabase is not configured.");
  return client;
}


/** Fetch games by id, keeping the given order and skipping missing ones. */
async function gamesByIds(ids: string[]): Promise<Map<string, Game>> {
  if (!ids.length) return new Map();
  const { data, error } = await db().from("games").select(GAME_COLUMNS).in("id", ids);
  if (error) throw new Error(error.message);
  return new Map((data as GameDbRow[]).map((r) => [r.id, toGame(r)]));
}

const sourceOf = (community: number, total: number): RowSource =>
  community === 0 ? "catalog" : community >= total ? "community" : "mixed";

// ───────────────────────── Top Trending ─────────────────────────

/** Most activity rows read for the trending window (far more than a week holds today). */
const MAX_TRENDING_SIGNALS = 20_000;
export const TRENDING_LIMIT = 100;

/**
 * Hot "right now" from the catalog (IGDB popularity, decayed by age) for the
 * last six months of releases: the fallback while community activity is thin.
 */
async function catalogBuzz(limit: number): Promise<Game[]> {
  const today = todayIso();
  const since = todayIso(new Date(Date.now() - 180 * 86_400_000));
  const { data, error } = await db()
    .from("games")
    .select(GAME_COLUMNS)
    .lte("release_date", today)
    .gte("release_date", since)
    .not("cover_url", "is", null)
    .order("popularity", { ascending: false })
    .limit(Math.max(limit * 3, 60));
  if (error) throw new Error(error.message);
  return sortByReleaseBuzz((data as GameDbRow[]).map(toGame), today).slice(0, limit);
}

/**
 * Top Trending: games with the most Supabox activity in the last 7 days
 * (see scoreActivity in lib/discovery for the formula; 2+ different people
 * required). Topped up with catalog buzz when there aren't enough.
 */
export async function getTrending(limit = TRENDING_LIMIT): Promise<DiscoveryRowData> {
  "use cache";
  cacheLife("minutes");
  cacheTag("trending");
  const since = new Date(Date.now() - TRENDING_WINDOW_DAYS * 86_400_000).toISOString();
  const { data, error } = await db()
    .from("activities")
    .select("user_id, game_id, type, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(MAX_TRENDING_SIGNALS);
  if (error) throw new Error(error.message);
  const signals: ActivitySignal[] = (data ?? []).map((r) => ({ userId: r.user_id, gameId: r.game_id, type: r.type, createdAt: r.created_at }));
  const ranked = trendingFromActivity(signals, new Date()).slice(0, limit);
  const games = await gamesByIds(ranked.map((r) => r.gameId));
  const items: DiscoveryItem[] = ranked.flatMap((r) => {
    const game = games.get(r.gameId);
    return game ? [{ game, people: r.people }] : [];
  });
  const community = items.length;
  if (items.length < limit) {
    const have = new Set(items.map((i) => i.game.id));
    for (const game of await catalogBuzz(limit)) {
      if (items.length >= limit) break;
      if (!have.has(game.id)) items.push({ game });
    }
  }
  return { items, source: sourceOf(community, items.length) };
}

// ───────────────────────── Recently Released ─────────────────────────

/**
 * Games worth showing: a cover and some attention on IGDB (about the top 40 of
 * the last two months), so the row isn't filled with obscure same-day releases.
 */
const MIN_RECENT_POPULARITY = 20;

/**
 * Released games, newest release date first ("released" = on or before today in
 * São Paulo time; a game's date is its first release on any platform, so a later
 * port doesn't count as a new release). Upcoming and undated games are excluded.
 */
export async function getRecentReleasesPage(pageNumber: number): Promise<GamePage> {
  "use cache";
  cacheLife("hours");
  cacheTag("games");
  const page = Number.isFinite(pageNumber) ? Math.min(MAX_PAGES, Math.max(1, Math.floor(pageNumber))) : 1;
  const from = (page - 1) * PAGE_SIZE;
  const { data, error, count } = await db()
    .from("games")
    .select(GAME_COLUMNS, { count: "exact" })
    .lte("release_date", todayIn(SITE_TIME_ZONE))
    .gte("release_date", todayIso(new Date(Date.now() - 365 * 86_400_000)))
    .gte("popularity", MIN_RECENT_POPULARITY)
    .not("cover_url", "is", null)
    .order("release_date", { ascending: false })
    .order("popularity", { ascending: false })
    .order("id", { ascending: true })
    .range(from, from + PAGE_SIZE - 1);
  const total = count ?? 0;
  const pages = Math.min(MAX_PAGES, Math.max(1, Math.ceil(total / PAGE_SIZE)));
  if (error?.code === "PGRST103") return { games: [], page, pages, total };
  if (error) throw new Error(error.message);
  return { games: (data as unknown as GameDbRow[]).map(toGame), page, pages, total };
}

// ───────────────────────── Hidden Gems ─────────────────────────

const MAX_RATINGS_READ = 50_000;
const OFFICIAL_GEMS_SLUG = "hidden-gems";

/**
 * Hidden Gems: lesser-known games Supabox players rate highly (3+ ratings,
 * Bayesian average ≥ 3.8/5, outside the ~1,500 best-known games). Topped up
 * with Supabox's official Hidden Gems list (built from IGDB critic + player
 * ratings) while there aren't enough community ratings.
 */
export async function getHiddenGems(limit = 50): Promise<DiscoveryRowData> {
  "use cache";
  cacheLife("hours");
  cacheTag("games", "official-lists");
  const { data, error } = await db().from("reviews").select("game_id, rating").not("rating", "is", null).limit(MAX_RATINGS_READ);
  if (error) throw new Error(error.message);
  const ratings = (data ?? []).map((r) => ({ gameId: r.game_id as string, rating: Number(r.rating) }));
  // Only games with enough ratings need their popularity checked.
  const counts = new Map<string, number>();
  for (const r of ratings) counts.set(r.gameId, (counts.get(r.gameId) ?? 0) + 1);
  const rated = [...counts.entries()].filter(([, n]) => n >= 3).map(([id]) => id);
  const games = await gamesByIds(rated);
  const gems = hiddenGems(ratings, new Map([...games.values()].map((g) => [g.id, g.popularity]))).slice(0, limit);
  const items: DiscoveryItem[] = gems.flatMap((g) => {
    const game = games.get(g.gameId);
    return game ? [{ game, average: g.average, ratings: g.count }] : [];
  });
  const community = items.length;
  if (items.length < limit) {
    const have = new Set(items.map((i) => i.game.id));
    const official = await getOfficialList(OFFICIAL_GEMS_SLUG);
    for (const e of official?.entries ?? []) {
      if (items.length >= limit) break;
      if (!have.has(e.game.id)) items.push({ game: e.game });
    }
  }
  return { items, source: sourceOf(community, items.length) };
}

// ───────────────────────── You Might Like: fallback ─────────────────────────

/**
 * Shown when we don't know someone's taste yet (signed out or too little
 * history): the top of Supabox's "100 Greatest Games" list. The browser
 * removes games the user already has.
 */
export async function getPopularPicks(limit = 60): Promise<Game[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("official-lists");
  const list = await getOfficialList(CLASSICS_LIST_SLUG);
  return (list?.entries ?? []).map((e) => e.game).slice(0, limit);
}
