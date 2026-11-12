import type { Game, Review } from "@/types";

/** One rated game on a profile: the game plus that user's rating. */
export interface RatedGame {
  game: Game;
  review: Review & { rating: number };
}

export const RATED_SORTS = {
  rated_desc: "Recently rated",
  release_desc: "Newest releases",
  release_asc: "Oldest releases",
  title: "Title (A–Z)",
  rating_desc: "Highest rated",
  rating_asc: "Lowest rated",
  critic_desc: "Critic score",
} as const;
export type RatedSort = keyof typeof RATED_SORTS;

export const RATING_FILTERS = {
  any: "Any rating",
  "5": "★★★★★ only",
  "4": "★★★★ and up",
  "3": "★★★ and up",
  low: "Below ★★★",
} as const;
export type RatingFilter = keyof typeof RATING_FILTERS;

export interface RatedOptions {
  sort: RatedSort;
  rating: RatingFilter;
  genre: string | null;
  platform: string | null;
}

export const DEFAULT_RATED_OPTIONS: RatedOptions = { sort: "rated_desc", rating: "any", genre: null, platform: null };

function matchesRating(stars: number, filter: RatingFilter): boolean {
  if (filter === "any") return true;
  if (filter === "low") return stars < 3;
  return stars >= Number(filter);
}

const byTitle = (a: RatedGame, b: RatedGame) => a.game.title.localeCompare(b.game.title, "en", { sensitivity: "base" });
// Games without a release date / critic score always go last.
const dateKey = (g: RatedGame) => g.game.releaseDate ?? "";

/** Filter and sort a profile's rated games. Ties fall back to title so the order is stable. */
export function arrangeRatedGames(items: RatedGame[], o: RatedOptions): RatedGame[] {
  const out = items.filter(
    (i) =>
      matchesRating(i.review.rating, o.rating) &&
      (!o.genre || i.game.genres.includes(o.genre)) &&
      (!o.platform || i.game.platforms.includes(o.platform)),
  );
  const cmp: Record<RatedSort, (a: RatedGame, b: RatedGame) => number> = {
    rated_desc: (a, b) => b.review.updatedAt.localeCompare(a.review.updatedAt),
    release_desc: (a, b) => (!dateKey(a) ? 1 : !dateKey(b) ? -1 : dateKey(b).localeCompare(dateKey(a))),
    release_asc: (a, b) => (!dateKey(a) ? 1 : !dateKey(b) ? -1 : dateKey(a).localeCompare(dateKey(b))),
    title: () => 0,
    rating_desc: (a, b) => b.review.rating - a.review.rating,
    rating_asc: (a, b) => a.review.rating - b.review.rating,
    critic_desc: (a, b) => (b.game.criticScore ?? -1) - (a.game.criticScore ?? -1),
  };
  return out.sort((a, b) => cmp[o.sort](a, b) || byTitle(a, b));
}

/** Genres and platforms present in the rated games, most common first (for the filter menus). */
export function ratedFacets(items: RatedGame[]): { genres: string[]; platforms: string[] } {
  const count = (pick: (g: Game) => string[]) => {
    const m = new Map<string, number>();
    for (const i of items) for (const v of pick(i.game)) m.set(v, (m.get(v) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([v]) => v);
  };
  return { genres: count((g) => g.genres), platforms: count((g) => g.platforms) };
}
