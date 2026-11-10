/**
 * Core domain types for Supabox.
 *
 * These mirror the planned PostgreSQL schema (see docs/ARCHITECTURE.md and
 * supabase/migrations). Field names are camelCase here and snake_case in SQL.
 */

export type ID = string;

/** ISO 8601 date (YYYY-MM-DD) or timestamp string. */
export type ISODate = string;

export type Platform =
  | "PC"
  | "PlayStation 5"
  | "Xbox Series X|S"
  | "Nintendo Switch 2"
  | "Nintendo Switch"
  | "macOS"
  | "iOS"
  | "Android";

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
  /** Human-readable, unique, stable URL segment. Editions get their own slug (e.g. `-definitive-edition`). */
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
  cover: CoverArt;
  /** Identifier at the external catalog provider (IGDB etc.). Mock data uses `mock:<n>`. */
  externalRef: { provider: string; id: string };
}

export type ReleaseStatus = "released" | "upcoming";

export interface Profile {
  id: ID;
  username: string;
  displayName: string;
  bio: string;
  /** Avatar hue used for the generated avatar in the prototype. */
  avatarHue: number;
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
