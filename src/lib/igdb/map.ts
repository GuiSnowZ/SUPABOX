/**
 * Mapping from IGDB records to rows of our `games` table.
 * Pure functions (unit-tested). No Next.js imports so scripts can reuse them.
 */
import type { IgdbClient } from "./client.ts";

export interface IgdbGame {
  id: number;
  name: string;
  slug: string;
  first_release_date?: number;
  summary?: string;
  storyline?: string;
  cover?: { image_id: string };
  artworks?: { image_id: string }[];
  screenshots?: { image_id: string }[];
  platforms?: { name: string; abbreviation?: string }[];
  genres?: { name: string }[];
  themes?: { name: string }[];
  involved_companies?: { company?: { name: string }; developer?: boolean; publisher?: boolean }[];
  total_rating_count?: number;
  hypes?: number;
  game_type?: number;
  /** Average of external critic reviews, 0–100. */
  aggregated_rating?: number;
  aggregated_rating_count?: number;
}

export interface IgdbLogo {
  game: number;
  image_id: string;
  width?: number;
  height?: number;
}

/** Columns we request for every game. */
export const GAME_FIELDS = [
  "name",
  "slug",
  "first_release_date",
  "summary",
  "storyline",
  "cover.image_id",
  "artworks.image_id",
  "screenshots.image_id",
  "platforms.name",
  "platforms.abbreviation",
  "genres.name",
  "themes.name",
  "involved_companies.company.name",
  "involved_companies.developer",
  "involved_companies.publisher",
  "total_rating_count",
  "hypes",
  "game_type",
  "aggregated_rating",
  "aggregated_rating_count",
].join(",");

/** Main games, remakes, remasters and expanded editions — not DLC, bundles, mods or seasons. */
export const PLAYABLE_GAME_TYPES = "(0,8,9,10)";

export type ImageSize = "cover_big" | "cover_big_2x" | "logo_med" | "screenshot_big" | "1080p" | "720p" | "thumb";

export function igdbImageUrl(imageId: string, size: ImageSize, ext: "jpg" | "png" = "jpg"): string {
  return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.${ext}`;
}

const PLATFORM_NAMES: Record<string, string> = {
  "PC (Microsoft Windows)": "PC",
  Mac: "macOS",
  "Xbox Series X|S": "Xbox Series X|S",
  "PlayStation 5": "PlayStation 5",
  "PlayStation 4": "PlayStation 4",
  "Nintendo Switch 2": "Nintendo Switch 2",
  "Nintendo Switch": "Nintendo Switch",
  "Web browser": "Browser",
  "Google Stadia": "Stadia",
};

/** Order platforms most players care about first. */
const PLATFORM_ORDER = [
  "PC",
  "PlayStation 5",
  "Xbox Series X|S",
  "Nintendo Switch 2",
  "Nintendo Switch",
  "PlayStation 4",
  "Xbox One",
  "macOS",
  "Linux",
  "iOS",
  "Android",
];

const GENRE_NAMES: Record<string, string> = {
  "Role-playing (RPG)": "RPG",
  "Hack and slash/Beat 'em up": "Hack and Slash",
  "Turn-based strategy (TBS)": "Turn-based Strategy",
  "Real Time Strategy (RTS)": "Real-time Strategy",
  Platform: "Platformer",
  Simulator: "Simulation",
  "Point-and-click": "Point-and-click",
  "Card & Board Game": "Card & Board",
  "Quiz/Trivia": "Trivia",
  "MOBA": "MOBA",
};

/** Themes that read well as genre tags. */
const THEME_TAGS = new Set(["Horror", "Survival", "Open world", "Science fiction", "Fantasy", "Sandbox", "Stealth", "Mystery"]);
const THEME_NAMES: Record<string, string> = { "Science fiction": "Sci-Fi", "Open world": "Open World" };

export function mapPlatforms(platforms: IgdbGame["platforms"] = []): string[] {
  const names = [...new Set(platforms.map((p) => PLATFORM_NAMES[p.name] ?? p.name))];
  const rank = (n: string) => {
    const i = PLATFORM_ORDER.indexOf(n);
    return i === -1 ? PLATFORM_ORDER.length : i;
  };
  return names.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

export function mapGenres(g: Pick<IgdbGame, "genres" | "themes">): string[] {
  const genres = (g.genres ?? []).map((x) => GENRE_NAMES[x.name] ?? x.name);
  const themes = (g.themes ?? []).filter((t) => THEME_TAGS.has(t.name)).map((t) => THEME_NAMES[t.name] ?? t.name);
  return [...new Set([...genres, ...themes])].slice(0, 6);
}

/** First sentence (or first ~200 chars) for the short lead text. */
export function shortSummary(text: string, max = 200): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const sentence = /^(.{20,}?[.!?])(\s|$)/.exec(clean)?.[1];
  const candidate = sentence && sentence.length <= max ? sentence : clean;
  if (candidate.length <= max) return candidate;
  return `${candidate.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

/** Unix seconds → YYYY-MM-DD (UTC). */
export function toIsoDate(seconds?: number): string | null {
  if (!seconds && seconds !== 0) return null;
  return new Date(seconds * 1000).toISOString().slice(0, 10);
}

/** Our slug rule allows IGDB's own slugs (lowercase words joined by one or more dashes). */
export function normalizeSlug(slug: string, fallbackId: number): string {
  const s = slug
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || `game-${fallbackId}`;
}

export interface GameRow {
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
  critic_count: number;
  provider: "igdb";
  provider_id: string;
  provider_synced_at: string;
}

/** Critic score rounded to 0–100; null when IGDB has no critic reviews. */
export function criticScore(g: Pick<IgdbGame, "aggregated_rating" | "aggregated_rating_count">) {
  const score = g.aggregated_rating;
  if (score == null || !Number.isFinite(score) || !g.aggregated_rating_count) {
    return { critic_score: null, critic_count: 0 };
  }
  return { critic_score: Math.max(0, Math.min(100, Math.round(score))), critic_count: g.aggregated_rating_count };
}

export function toGameRow(g: IgdbGame, logo?: IgdbLogo, now = new Date().toISOString()): GameRow {
  const companies = g.involved_companies ?? [];
  const developer = companies.find((c) => c.developer)?.company?.name ?? null;
  const publisher = companies.find((c) => c.publisher)?.company?.name ?? developer;
  const text = (g.summary || g.storyline || "").trim();
  const background = g.artworks?.[0]?.image_id ?? g.screenshots?.[0]?.image_id;
  return {
    slug: normalizeSlug(g.slug, g.id),
    title: g.name.trim(),
    release_date: toIsoDate(g.first_release_date),
    summary: shortSummary(text),
    description: text,
    developer,
    publisher,
    platforms: mapPlatforms(g.platforms),
    genres: mapGenres(g),
    cover_url: g.cover ? igdbImageUrl(g.cover.image_id, "cover_big_2x") : null,
    logo_url: logo ? igdbImageUrl(logo.image_id, "logo_med", "png") : null,
    background_url: background ? igdbImageUrl(background, "1080p") : null,
    popularity: Math.round((g.total_rating_count ?? 0) + (g.hypes ?? 0)),
    ...criticScore(g),
    provider: "igdb",
    provider_id: String(g.id),
    provider_synced_at: now,
  };
}

/** Fetch games for a query `where` clause, plus their logos, as rows. */
export async function fetchGameRows(
  igdb: IgdbClient,
  where: string,
  { sort, limit = 500, offset = 0 }: { sort?: string; limit?: number; offset?: number } = {},
): Promise<GameRow[]> {
  const body = `fields ${GAME_FIELDS}; where ${where}; ${sort ? `sort ${sort};` : ""} limit ${limit}; offset ${offset};`;
  const games = await igdb.query<IgdbGame>("games", body);
  if (!games.length) return [];
  const logos = await fetchLogos(igdb, games.map((g) => g.id));
  return games.filter((g) => g.name && g.slug).map((g) => toGameRow(g, logos.get(g.id)));
}

/** First logo per game (the `logos` endpoint is keyed by game id). */
export async function fetchLogos(igdb: IgdbClient, gameIds: number[]): Promise<Map<number, IgdbLogo>> {
  const out = new Map<number, IgdbLogo>();
  for (let i = 0; i < gameIds.length; i += 500) {
    const chunk = gameIds.slice(i, i + 500);
    const logos = await igdb.query<IgdbLogo>("logos", `fields game,image_id,width,height; where game = (${chunk.join(",")}); limit 500;`);
    for (const l of logos) if (!out.has(l.game)) out.set(l.game, l);
  }
  return out;
}

/** Escape a user search for an Apicalypse string literal. */
export function igdbSearchTerm(q: string): string {
  return q.replace(/["\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}
