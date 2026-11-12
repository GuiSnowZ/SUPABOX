/**
 * Ranking helpers for the official Supabox lists (used by
 * scripts/build-official-lists.mts). Kept free of I/O so they can be tested.
 */

export type ListCategory = "rankings" | "platforms" | "companies" | "genres" | "special";

/** The subset of IGDB game fields the list builder ranks on. */
export interface Candidate {
  id: number;
  name: string;
  slug?: string;
  first_release_date?: number;
  /** IGDB's combined critic + player rating, 0–100. */
  total_rating?: number;
  total_rating_count?: number;
  hypes?: number;
  franchises?: Array<{ id: number; name: string }>;
}

export interface ListItem {
  igdbId: number;
  section?: string;
  note?: string;
}

/**
 * Bayesian average: each game's rating is pulled towards `mean` as if it had
 * `weight` extra ratings of that value. A 95 from 30 people ranks below a 92
 * from 3,000, so lists reward both quality and reach.
 */
export const RATING_PRIOR = { mean: 70, weight: 100 };

export function weightedScore(c: Pick<Candidate, "total_rating" | "total_rating_count">, prior = RATING_PRIOR): number {
  const r = c.total_rating ?? 0;
  const v = c.total_rating_count ?? 0;
  return (v * r + prior.weight * prior.mean) / (v + prior.weight);
}

/** Highest weighted score first; ties go to the more-rated game, then by name. */
export function rankByScore<T extends Candidate>(games: T[], prior = RATING_PRIOR): T[] {
  return [...games].sort(
    (a, b) =>
      weightedScore(b, prior) - weightedScore(a, prior) ||
      (b.total_rating_count ?? 0) - (a.total_rating_count ?? 0) ||
      a.name.localeCompare(b.name),
  );
}

/**
 * Group games (e.g. by franchise), rank groups by their total number of
 * ratings, and return the best-scoring game of each of the top `limit` groups.
 */
export function pickBestPerGroup<T extends Candidate>(
  games: T[],
  groupOf: (g: T) => string | null,
  limit: number,
): Array<{ group: string; game: T; ratings: number }> {
  const groups = new Map<string, T[]>();
  for (const g of games) {
    const key = groupOf(g);
    if (!key) continue;
    groups.set(key, [...(groups.get(key) ?? []), g]);
  }
  return [...groups.entries()]
    .map(([group, members]) => ({
      group,
      game: rankByScore(members)[0],
      ratings: members.reduce((n, m) => n + (m.total_rating_count ?? 0), 0),
    }))
    .sort((a, b) => b.ratings - a.ratings || a.group.localeCompare(b.group))
    .slice(0, limit);
}
