import type { Game } from "@/types";

/** Columns selected for a Game everywhere (client and server). */
export const GAME_COLUMNS =
  "id, slug, title, release_date, summary, description, developer, publisher, platforms, genres, cover_url, logo_url, background_url, popularity, provider, provider_id";

export interface GameDbRow {
  id: string;
  slug: string;
  title: string;
  release_date: string | null;
  summary: string;
  description: string;
  developer: string | null;
  publisher: string | null;
  platforms: string[];
  genres: string[];
  cover_url: string | null;
  logo_url: string | null;
  background_url: string | null;
  popularity: number;
  provider: string;
  provider_id: string;
}

export function toGame(r: GameDbRow): Game {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    releaseDate: r.release_date,
    summary: r.summary,
    description: r.description,
    developer: r.developer ?? "Unknown developer",
    publisher: r.publisher ?? r.developer ?? "Unknown publisher",
    platforms: r.platforms ?? [],
    genres: r.genres ?? [],
    coverUrl: r.cover_url,
    logoUrl: r.logo_url,
    backgroundUrl: r.background_url,
    popularity: r.popularity ?? 0,
    externalRef: { provider: r.provider, id: r.provider_id },
  };
}

/** Today's date (UTC) as YYYY-MM-DD. */
export function todayIso(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function isReleasedOn(game: Pick<Game, "releaseDate">, today: string): boolean {
  return game.releaseDate !== null && game.releaseDate <= today;
}
