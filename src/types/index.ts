/**
 * Core domain types for Supabox.
 *
 * These mirror the planned PostgreSQL schema (see docs/ARCHITECTURE.md and
 * supabase/migrations). Field names are camelCase here and snake_case in SQL.
 */

export type ID = string;

/** ISO 8601 date (YYYY-MM-DD) or timestamp string. */
export type ISODate = string;

/** Display name of a platform, e.g. "PC", "PlayStation 5", "Nintendo Switch 2". */
export type Platform = string;

export type CoverMotif = "orb" | "peaks" | "grid" | "waves" | "shards" | "rings" | "stripes";

/** Procedural cover art parameters (prototype only — real art comes from the catalog provider). */
export interface CoverArt {
  from: string;
  to: string;
  ink: string;
  motif: CoverMotif;
}

export interface Game {
  id: ID;
  /** Human-readable, unique, stable URL segment (from the catalog provider). */
  slug: string;
  title: string;
  /** null = date not announced (TBA). */
  releaseDate: ISODate | null;
  summary: string;
  description: string;
  developer: string;
  publisher: string;
  platforms: Platform[];
  genres: string[];
  /** Licensed cover image (portrait). null → a generated placeholder cover is shown. */
  coverUrl: string | null;
  /** Transparent game logo, when the provider has one. */
  logoUrl: string | null;
  /** Wide artwork or screenshot for page backgrounds. */
  backgroundUrl: string | null;
  /** Provider popularity signal (ratings + hype), used for ranking. */
  popularity: number;
  /** Average professional critic score, 0–100 (from IGDB), or null if unreviewed. */
  criticScore: number | null;
  /** Number of critic reviews behind criticScore. */
  criticCount: number;
  /** Placeholder art parameters (fictional prototype games only). */
  cover?: CoverArt;
  /** Identifier at the external catalog provider (IGDB etc.). */
  externalRef: { provider: string; id: string };
}

export type ReleaseStatus = "released" | "upcoming";

export interface Profile {
  id: ID;
  username: string;
  displayName: string;
  bio: string;
  /** Hue for the generated initials avatar (used when there's no photo). */
  avatarHue: number;
  /** Uploaded profile picture (public URL), if any. */
  avatarUrl?: string | null;
  joinedAt: ISODate;
}

/** Library status. `want_to_play` IS the wishlist — there is no separate wishlist table. */
export type LibraryStatus = "want_to_play" | "playing" | "completed" | "dropped";

export interface UserGame {
  userId: ID;
  gameId: ID;
  status: LibraryStatus;
  addedAt: ISODate;
  updatedAt: ISODate;
}

export type PlaySessionKind = "first_playthrough" | "replay" | "returned";

/** A diary entry. Many per user/game: each playthrough is its own entry. */
export interface PlaySession {
  id: ID;
  userId: ID;
  gameId: ID;
  kind: PlaySessionKind;
  startedOn: ISODate;
  finishedOn: ISODate | null;
  note: string;
  createdAt: ISODate;
}

/** Ratings are stored in half-star steps: 0.5 … 5.0. */
export type Rating = number;

/**
 * One review per user per game. A review can be rating-only (body null),
 * text-only (rating null), or both.
 */
export interface Review {
  id: ID;
  userId: ID;
  gameId: ID;
  rating: Rating | null;
  body: string | null;
  containsSpoilers: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Follow {
  followerId: ID;
  followingId: ID;
  createdAt: ISODate;
}

export type ListVisibility = "public" | "private";

export interface ListItem {
  gameId: ID;
  /** 0-based order within the list. */
  position: number;
  addedAt: ISODate;
}

export interface GameList {
  id: ID;
  userId: ID;
  title: string;
  description: string;
  visibility: ListVisibility;
  /** Editorial pick. Featured lists are curated by the Supabox team, not ranked by fake popularity. */
  featured: boolean;
  items: ListItem[];
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type ActivityType = "added_to_library" | "started_playing" | "completed" | "published_review";

export interface Activity {
  id: ID;
  userId: ID;
  type: ActivityType;
  gameId: ID;
  /** Present for `published_review`. */
  reviewId?: ID;
  createdAt: ISODate;
}

export const MAX_FAVORITE_GAMES = 5;
