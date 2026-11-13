import type { Game } from "@/types";

/** One completed game on a profile: when it was completed and the user's rating (if any). */
export interface CompletedGame {
  game: Game;
  /** YYYY-MM-DD: latest finished diary entry, else the day it was marked Completed (see lib/stats completionDates). */
  completedOn: string;
  rating: number | null;
}

export const COMPLETED_SORTS = ["completed_desc", "completed_asc", "rating_desc", "rating_asc", "title", "release_desc", "release_asc"] as const;
export type CompletedSort = (typeof COMPLETED_SORTS)[number];
export const COMPLETED_FILTERS = ["all", "rated", "unrated"] as const;
export type CompletedFilter = (typeof COMPLETED_FILTERS)[number];

export interface CompletedOptions {
  sort: CompletedSort;
  filter: CompletedFilter;
  genre: string | null;
}

export const DEFAULT_COMPLETED_OPTIONS: CompletedOptions = { sort: "completed_desc", filter: "all", genre: null };

const byTitle = (a: CompletedGame, b: CompletedGame) => a.game.title.localeCompare(b.game.title, "en", { sensitivity: "base" });

/**
 * Filter and sort completed games. Unrated games go last when sorting by
 * rating, undated games last when sorting by release; ties fall back to title.
 */
export function arrangeCompleted(items: CompletedGame[], o: CompletedOptions): CompletedGame[] {
  const out = items.filter(
    (i) =>
      (o.filter === "all" || (o.filter === "rated" ? i.rating !== null : i.rating === null)) &&
      (!o.genre || i.game.genres.includes(o.genre)),
  );
  const rating = (dir: 1 | -1) => (a: CompletedGame, b: CompletedGame) =>
    a.rating === null ? (b.rating === null ? 0 : 1) : b.rating === null ? -1 : dir * (a.rating - b.rating);
  const release = (dir: 1 | -1) => (a: CompletedGame, b: CompletedGame) =>
    !a.game.releaseDate ? (!b.game.releaseDate ? 0 : 1) : !b.game.releaseDate ? -1 : dir * a.game.releaseDate.localeCompare(b.game.releaseDate);
  const cmp: Record<CompletedSort, (a: CompletedGame, b: CompletedGame) => number> = {
    completed_desc: (a, b) => b.completedOn.localeCompare(a.completedOn),
    completed_asc: (a, b) => a.completedOn.localeCompare(b.completedOn),
    rating_desc: rating(-1),
    rating_asc: rating(1),
    title: () => 0,
    release_desc: release(-1),
    release_asc: release(1),
  };
  return out.sort((a, b) => cmp[o.sort](a, b) || byTitle(a, b));
}

/** Genres present in the list, most common first (for the filter menu). */
export function completedGenres(items: CompletedGame[]): string[] {
  const m = new Map<string, number>();
  for (const i of items) for (const g of i.game.genres) m.set(g, (m.get(g) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([g]) => g);
}
