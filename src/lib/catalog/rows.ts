import type { Game } from "@/types";

/** Columns selected for a Game everywhere (client and server). */
export const GAME_COLUMNS =
  "id, slug, title, release_date, summary, description, developer, publisher, platforms, genres, cover_url, logo_url, background_url, popularity, critic_score, critic_count, provider, provider_id";

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
  critic_score: number | null;
  critic_count: number | null;
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
    criticScore: r.critic_score ?? null,
    criticCount: r.critic_count ?? 0,
    externalRef: { provider: r.provider, id: r.provider_id },
  };
}

/** Today's date (UTC) as YYYY-MM-DD. */
export function todayIso(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Supabox's main audience is in Brazil: "today" for daily sections follows São Paulo time. */
export const SITE_TIME_ZONE = "America/Sao_Paulo";

/** Today's date (YYYY-MM-DD) in a given time zone. */
export function todayIn(timeZone: string, now = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function isReleasedOn(game: Pick<Game, "releaseDate">, today: string): boolean {
  return game.releaseDate !== null && game.releaseDate <= today;
}

/**
 * How "hot" a released game is right now: its popularity (player ratings +
 * pre-release hype), halved for every RELEASE_BUZZ_HALF_LIFE_DAYS since launch.
 * A fresh big release beats a bigger game from two months ago, but a tiny
 * game released today does not beat a hit from last week.
 */
export const RELEASE_BUZZ_HALF_LIFE_DAYS = 21;

export function releaseBuzz(game: Pick<Game, "releaseDate" | "popularity">, today: string): number {
  if (!game.releaseDate) return 0;
  const ageDays = Math.max(0, (Date.parse(today) - Date.parse(game.releaseDate)) / 86_400_000);
  return game.popularity * 0.5 ** (ageDays / RELEASE_BUZZ_HALF_LIFE_DAYS);
}

/** Sort released games hottest first (ties: newest first). Returns a new array. */
export function sortByReleaseBuzz<T extends Pick<Game, "releaseDate" | "popularity">>(games: T[], today: string): T[] {
  return [...games].sort(
    (a, b) =>
      releaseBuzz(b, today) - releaseBuzz(a, today) || (b.releaseDate ?? "").localeCompare(a.releaseDate ?? ""),
  );
}
