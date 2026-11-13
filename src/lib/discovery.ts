import type { ActivityType, Game, LibraryStatus } from "@/types";

/**
 * Ranking rules for the Home discovery rows. Pure functions (no database, no
 * React) so every formula is explicit and unit-tested.
 */

const DAY_MS = 86_400_000;

/** Where a row's games came from (shown to the user so fallbacks are never passed off as community data). */
export type RowSource = "community" | "mixed" | "catalog";

/** A game in a discovery row, with the facts that earned its place. */
export interface DiscoveryItem {
  game: Game;
  /** Trending: different people active on it this week. */
  people?: number;
  /** Hidden gems: community average and number of ratings. */
  average?: number;
  ratings?: number;
  /** You Might Like: the liked genre that matched. */
  because?: string;
  /** Friends: who (most recent first). */
  friendIds?: string[];
}

export interface DiscoveryRowData {
  items: DiscoveryItem[];
  source: RowSource;
}

// ───────────────────────── Activity scoring (Trending, Friends) ─────────────────────────

export interface ActivitySignal {
  userId: string;
  gameId: string;
  type: ActivityType;
  createdAt: string;
}

/**
 * How much one person's action says "this game is hot right now".
 * Writing about a game or actually playing it counts more than saving it.
 */
export const ACTIVITY_WEIGHTS: Record<ActivityType, number> = {
  published_review: 3, // rated and/or reviewed
  started_playing: 2,
  completed: 2,
  added_to_library: 1, // saved to Want to Play
};

export interface ActivityScore {
  gameId: string;
  score: number;
  /** Distinct people behind the score. */
  people: number;
  /** Their ids, most recent first (used to show "friends who played this"). */
  userIds: string[];
  lastAt: string;
}

/**
 * Score games by recent activity.
 *
 * score(game) = Σ over people of  max weight of their actions on the game
 *                                 × recency (1.0 for today → 0.5 at the window's edge)
 *
 * Each person counts once per game (their strongest action), so repeating or
 * toggling actions can't inflate a game. Activity outside the window is ignored.
 */
export function scoreActivity(signals: ActivitySignal[], now: Date, windowDays: number): ActivityScore[] {
  const cutoff = now.getTime() - windowDays * DAY_MS;
  const best = new Map<string, { gameId: string; userId: string; value: number; at: string }>();
  for (const s of signals) {
    const at = Date.parse(s.createdAt);
    if (!Number.isFinite(at) || at < cutoff || at > now.getTime() + DAY_MS) continue;
    const age = Math.max(0, (now.getTime() - at) / DAY_MS);
    const value = ACTIVITY_WEIGHTS[s.type] * (1 - 0.5 * Math.min(1, age / windowDays));
    const key = `${s.userId}:${s.gameId}`;
    const prev = best.get(key);
    if (!prev || value > prev.value) best.set(key, { gameId: s.gameId, userId: s.userId, value, at: prev && prev.at > s.createdAt ? prev.at : s.createdAt });
    else if (s.createdAt > prev.at) prev.at = s.createdAt;
  }
  const games = new Map<string, ActivityScore & { recent: Array<{ userId: string; at: string }> }>();
  for (const b of best.values()) {
    const g = games.get(b.gameId) ?? { gameId: b.gameId, score: 0, people: 0, userIds: [], lastAt: b.at, recent: [] };
    g.score += b.value;
    g.people += 1;
    g.recent.push({ userId: b.userId, at: b.at });
    if (b.at > g.lastAt) g.lastAt = b.at;
    games.set(b.gameId, g);
  }
  return [...games.values()]
    .map(({ recent, ...g }) => ({ ...g, score: Math.round(g.score * 100) / 100, userIds: recent.sort((a, b) => b.at.localeCompare(a.at)).map((r) => r.userId) }))
    .sort((a, b) => b.score - a.score || b.people - a.people || b.lastAt.localeCompare(a.lastAt));
}

/** Trending looks at the last week. */
export const TRENDING_WINDOW_DAYS = 7;
/** A game needs this many different people to be "trending" (one fan isn't a trend). */
export const TRENDING_MIN_PEOPLE = 2;
/** Friends' activity looks back a month. */
export const FRIENDS_WINDOW_DAYS = 30;

export function trendingFromActivity(signals: ActivitySignal[], now: Date): ActivityScore[] {
  return scoreActivity(signals, now, TRENDING_WINDOW_DAYS).filter((s) => s.people >= TRENDING_MIN_PEOPLE);
}

// ───────────────────────── Hidden gems ─────────────────────────

/** Bayesian average: pulls small samples toward a neutral prior so one 5★ doesn't win. */
export const GEM_PRIOR = 3.5;
export const GEM_PRIOR_WEIGHT = 5;
export const GEM_MIN_RATINGS = 3;
export const GEM_MIN_SCORE = 3.8;
/** "Lesser-known": below this IGDB popularity (roughly outside the ~1,500 best-known games). */
export const GEM_MAX_POPULARITY = 150;

export function bayesianRating(sum: number, count: number, prior = GEM_PRIOR, weight = GEM_PRIOR_WEIGHT): number {
  return (prior * weight + sum) / (weight + count);
}

export interface GemScore {
  gameId: string;
  score: number;
  average: number;
  count: number;
}

/** Community hidden gems: well rated by enough people, but not mainstream. */
export function hiddenGems(ratings: Array<{ gameId: string; rating: number }>, popularity: Map<string, number>): GemScore[] {
  const agg = new Map<string, { sum: number; count: number }>();
  for (const r of ratings) {
    const a = agg.get(r.gameId) ?? { sum: 0, count: 0 };
    a.sum += r.rating;
    a.count += 1;
    agg.set(r.gameId, a);
  }
  return [...agg.entries()]
    .filter(([id, a]) => a.count >= GEM_MIN_RATINGS && (popularity.get(id) ?? Infinity) < GEM_MAX_POPULARITY)
    .map(([gameId, a]) => ({ gameId, score: bayesianRating(a.sum, a.count), average: a.sum / a.count, count: a.count }))
    .filter((g) => g.score >= GEM_MIN_SCORE)
    .sort((a, b) => b.score - a.score || b.count - a.count);
}

// ───────────────────────── You Might Like ─────────────────────────

export interface TasteInput {
  favorites: Game[];
  ratings: Array<{ game: Game; rating: number }>;
  library: Array<{ game: Game; status: LibraryStatus }>;
}

/** How much each kind of signal says "I like this genre". */
export const TASTE_WEIGHTS = {
  favorite: 3,
  rating: (r: number) => (r >= 4.5 ? 2.5 : r >= 4 ? 2 : r >= 3.5 ? 1 : r <= 2 ? -1.5 : 0),
  status: { completed: 1, playing: 1, want_to_play: 0.5, dropped: -0.5 } satisfies Record<LibraryStatus, number>,
};

/** Below this much positive signal we don't pretend to know the user's taste. */
export const MIN_TASTE_SIGNAL = 4;

export interface Taste {
  /** Genre → weight (can be negative). */
  genres: Map<string, number>;
  /** Total positive weight: how much we actually know. */
  signal: number;
  /** Games the user already has (excluded from recommendations). */
  known: Set<string>;
}

export function buildTaste({ favorites, ratings, library }: TasteInput): Taste {
  const genres = new Map<string, number>();
  const known = new Set<string>();
  let signal = 0;
  const add = (game: Game, w: number) => {
    if (!w) return;
    if (w > 0) signal += w;
    for (const g of game.genres) genres.set(g, (genres.get(g) ?? 0) + w);
  };
  for (const g of favorites) {
    add(g, TASTE_WEIGHTS.favorite);
    known.add(g.id);
  }
  for (const r of ratings) {
    add(r.game, TASTE_WEIGHTS.rating(r.rating));
    known.add(r.game.id);
  }
  for (const e of library) {
    add(e.game, TASTE_WEIGHTS.status[e.status]);
    known.add(e.game.id);
  }
  return { genres, signal, known };
}

export function hasEnoughTaste(taste: Taste): boolean {
  return taste.signal >= MIN_TASTE_SIGNAL && [...taste.genres.values()].some((w) => w > 0);
}

/** The user's strongest liked genres, best first. */
export function topGenres(taste: Taste, n = 4): string[] {
  return [...taste.genres.entries()]
    .filter(([, w]) => w > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n)
    .map(([g]) => g);
}

export interface Recommendation {
  game: Game;
  score: number;
  /** The liked genre that matched best (shown as "Because you like …"). */
  because: string;
}

/**
 * Rank candidate games for a user:
 *   score = genre match (sum of the user's genre weights, normalised 0–1) × 2
 *         + critic score / 100 × 0.6   (quality; 70 assumed when unknown)
 *         + min(1, log10(popularity + 1) / 3) × 0.4   (a little popularity)
 * Games already in the user's library, rated or favorited are skipped, and a
 * candidate must share at least one genre the user likes.
 */
export function recommend(taste: Taste, candidates: Game[], limit = 48): Recommendation[] {
  const max = Math.max(1, ...[...taste.genres.values()].filter((w) => w > 0));
  const seen = new Set<string>();
  const out: Recommendation[] = [];
  for (const game of candidates) {
    if (taste.known.has(game.id) || seen.has(game.id)) continue;
    seen.add(game.id);
    let match = 0;
    let because = "";
    let bestW = 0;
    for (const g of game.genres) {
      const w = taste.genres.get(g) ?? 0;
      match += w;
      if (w > bestW) {
        bestW = w;
        because = g;
      }
    }
    if (bestW <= 0 || match <= 0) continue;
    const score =
      Math.min(1, match / (max * 2)) * 2 +
      ((game.criticScore ?? 70) / 100) * 0.6 +
      Math.min(1, Math.log10(game.popularity + 1) / 3) * 0.4;
    out.push({ game, score: Math.round(score * 1000) / 1000, because });
  }
  return out.sort((a, b) => b.score - a.score || b.game.popularity - a.game.popularity).slice(0, limit);
}
