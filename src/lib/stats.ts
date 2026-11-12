/**
 * Gaming stats and the Year in Review, computed from a user's library, diary
 * and reviews (all already loaded on the client). Pure functions, unit-tested.
 */
import type { Game, ID, PlaySession, Review, UserGame } from "@/types";

export interface StatsInput {
  games: Record<ID, Game>;
  userGames: UserGame[];
  reviews: Review[];
  sessions: PlaySession[];
}

export interface Ranked {
  name: string;
  count: number;
}

export interface Stats {
  /** null = all time */
  year: number | null;
  gamesPlayed: number;
  completed: Array<{ game: Game; date: string }>;
  completedByMonth: number[];
  hours: number;
  reviewsWritten: number;
  ratingsGiven: number;
  averageRating: number | null;
  /** Count of ratings per half-star step, index 0 = 0.5★ … 9 = 5★. */
  ratingDistribution: number[];
  topRated: Array<{ game: Game; rating: number }>;
  topGenres: Ranked[];
  topPlatforms: Ranked[];
}

const yearOf = (iso: string) => Number(iso.slice(0, 4));
const inYear = (iso: string | null | undefined, year: number | null) => Boolean(iso) && (year === null || yearOf(iso!) === year);

function rank(values: string[], limit: number): Ranked[] {
  const m = new Map<string, number>();
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
  return [...m.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
}

/** When a game was completed: the latest finished diary entry, else when it was marked Completed. */
export function completionDates(input: StatsInput): Map<ID, string> {
  const out = new Map<ID, string>();
  for (const u of input.userGames) {
    if (u.status !== "completed") continue;
    const finished = input.sessions
      .filter((s) => s.gameId === u.gameId && s.finishedOn)
      .map((s) => s.finishedOn!)
      .sort()
      .at(-1);
    out.set(u.gameId, finished ?? u.updatedAt.slice(0, 10));
  }
  return out;
}

export function computeStats(input: StatsInput, year: number | null): Stats {
  const completedDates = completionDates(input);
  const completed = [...completedDates.entries()]
    .filter(([, date]) => inYear(date, year))
    .flatMap(([id, date]) => (input.games[id] ? [{ game: input.games[id], date }] : []))
    .sort((a, b) => b.date.localeCompare(a.date));

  const completedByMonth = Array.from({ length: 12 }, () => 0);
  for (const c of completed) completedByMonth[Number(c.date.slice(5, 7)) - 1]++;

  const sessions = input.sessions.filter((s) => inYear(s.finishedOn ?? s.startedOn, year));
  const hours = Math.round(sessions.reduce((n, s) => n + (s.hours ?? 0), 0) * 10) / 10;

  const ratings = input.reviews.filter((r) => r.rating !== null && inYear(r.createdAt, year));
  const ratingDistribution = Array.from({ length: 10 }, () => 0);
  for (const r of ratings) ratingDistribution[Math.round(r.rating! * 2) - 1]++;
  const averageRating = ratings.length
    ? Math.round((ratings.reduce((n, r) => n + r.rating!, 0) / ratings.length) * 10) / 10
    : null;

  const topRated = ratings
    .flatMap((r) => (input.games[r.gameId] ? [{ game: input.games[r.gameId], rating: r.rating!, at: r.createdAt }] : []))
    .sort((a, b) => b.rating - a.rating || b.at.localeCompare(a.at))
    .slice(0, 5)
    .map(({ game, rating }) => ({ game, rating }));

  const playedIds = new Set<ID>([...completed.map((c) => c.game.id), ...sessions.map((s) => s.gameId)]);
  if (year === null) for (const u of input.userGames) if (u.status !== "want_to_play") playedIds.add(u.gameId);
  const played = [...playedIds].flatMap((id) => (input.games[id] ? [input.games[id]] : []));

  return {
    year,
    gamesPlayed: played.length,
    completed,
    completedByMonth,
    hours,
    reviewsWritten: input.reviews.filter((r) => r.body && inYear(r.createdAt, year)).length,
    ratingsGiven: ratings.length,
    averageRating,
    ratingDistribution,
    topRated,
    topGenres: rank(played.flatMap((g) => g.genres), 5),
    topPlatforms: rank(
      sessions.flatMap((s) => (s.platform ? [s.platform] : [])),
      5,
    ),
  };
}

/** Years with any activity, newest first. */
export function activeYears(input: StatsInput): number[] {
  const years = new Set<number>();
  for (const d of completionDates(input).values()) years.add(yearOf(d));
  for (const s of input.sessions) years.add(yearOf(s.finishedOn ?? s.startedOn));
  for (const r of input.reviews) years.add(yearOf(r.createdAt));
  return [...years].filter((y) => Number.isFinite(y)).sort((a, b) => b - a);
}
