import type { Game, ReleaseStatus } from "@/types";

/**
 * Game catalog provider abstraction.
 *
 * The app talks to this interface only, so the data source (mock data today,
 * a licensed provider such as IGDB later) can be swapped without touching UI
 * code or user-generated data. User data references our own stable `Game.id`,
 * never a provider's ID directly.
 */
export interface CatalogProvider {
  readonly name: string;
  listGames(): Promise<Game[]>;
  getGameBySlug(slug: string): Promise<Game | null>;
  searchGames(query: string): Promise<Game[]>;
  /** Released games only, newest first. */
  getRecentlyReleased(limit?: number): Promise<Game[]>;
  /** Unreleased games (future date or TBA), soonest first, TBA last. */
  getUpcoming(limit?: number): Promise<Game[]>;
}

/** A game is released once its release date is on or before `today`. TBA is upcoming. */
export function getReleaseStatus(game: Pick<Game, "releaseDate">, today: string): ReleaseStatus {
  return game.releaseDate !== null && game.releaseDate <= today ? "released" : "upcoming";
}

/** Case- and accent-insensitive text normalisation for search. */
export function normalizeSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function matchesQuery(game: Game, query: string): boolean {
  const q = normalizeSearch(query);
  if (!q) return true;
  const haystack = normalizeSearch(
    [game.title, game.developer, game.publisher, ...game.genres, ...game.platforms].join(" "),
  );
  return q.split(" ").every((term) => haystack.includes(term));
}

export function sortByReleaseDesc(a: Game, b: Game): number {
  return (b.releaseDate ?? "").localeCompare(a.releaseDate ?? "");
}
