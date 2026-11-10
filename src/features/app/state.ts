/**
 * Client-side application state (a cache of database rows) and pure state
 * transitions.
 *
 * Each transition validates input and applies the change locally (optimistic
 * update). The store then persists it to Supabase, where the same rules are
 * enforced again by constraints and Row Level Security. These functions are
 * pure, so they are unit-tested without a database.
 */
import { games as mockGames } from "@/data/games";
import * as seed from "@/data/social";
import { isValidRating } from "@/lib/ratings";
import { createId } from "@/lib/utils";
import {
  type Activity,
  type ActivityType,
  type Follow,
  type Game,
  type GameList,
  type ID,
  type LibraryStatus,
  type ListVisibility,
  MAX_FAVORITE_GAMES,
  type PlaySession,
  type PlaySessionKind,
  type Profile,
  type Review,
  type UserGame,
} from "@/types";

export type LoadStatus = "loading" | "ready" | "error";

export interface AppState {
  version: 2;
  /** The signed-in user, or null when signed out. */
  currentUserId: ID | null;
  /** False until the auth session has been checked on the client. */
  authReady: boolean;
  /** Load status per resource key, e.g. "bootstrap", "game:<id>", "user:<name>", "list:<id>". */
  loads: Record<string, LoadStatus>;
  /** Catalog games referenced by anything loaded (library, reviews, lists, feed…), by id. */
  games: Record<ID, Game>;
  profiles: Profile[];
  userGames: UserGame[];
  reviews: Review[];
  playSessions: PlaySession[];
  lists: GameList[];
  favorites: Record<ID, ID[]>;
  follows: Follow[];
  activities: Activity[];
}

export class PrototypeError extends Error {}

/** Empty cache used by the app before anything is loaded. */
export function createEmptyState(): AppState {
  return {
    version: 2,
    currentUserId: null,
    authReady: false,
    loads: {},
    games: {},
    profiles: [],
    userGames: [],
    reviews: [],
    playSessions: [],
    lists: [],
    favorites: {},
    follows: [],
    activities: [],
  };
}

/** Fictional community data, used by unit tests. */
export function createDemoState(): AppState {
  return structuredClone({
    version: 2 as const,
    currentUserId: seed.DEMO_USER_ID,
    authReady: true,
    loads: {},
    games: Object.fromEntries(mockGames.map((g) => [g.id, g])),
    profiles: seed.profiles,
    userGames: seed.userGames,
    reviews: seed.reviews,
    playSessions: seed.playSessions,
    lists: seed.lists,
    favorites: seed.favoriteGames,
    follows: seed.follows,
    activities: seed.activities,
  });
}

function requireUser(state: AppState): ID {
  if (!state.currentUserId) throw new PrototypeError("You need to sign in first.");
  return state.currentUserId;
}

function pushActivity(
  activities: Activity[],
  userId: ID,
  type: ActivityType,
  gameId: ID,
  now: string,
  reviewId?: ID,
): Activity[] {
  // Avoid duplicate feed events: one event per user/game/type, newest wins.
  const rest = activities.filter(
    (a) => !(a.userId === userId && a.gameId === gameId && a.type === type),
  );
  return [{ id: createId(), userId, type, gameId, reviewId, createdAt: now }, ...rest];
}

const STATUS_ACTIVITY: Record<LibraryStatus, ActivityType | null> = {
  want_to_play: "added_to_library",
  playing: "started_playing",
  completed: "completed",
  dropped: null,
};

// ——— Auth ———

export function signOut(state: AppState): AppState {
  return { ...state, currentUserId: null };
}

// ——— Library & wishlist ———

/** Set or clear (`null`) the current user's library status for a game. */
export function setLibraryStatus(
  state: AppState,
  gameId: ID,
  status: LibraryStatus | null,
  now = new Date().toISOString(),
): AppState {
  const userId = requireUser(state);
  const existing = state.userGames.find((u) => u.userId === userId && u.gameId === gameId);
  const others = state.userGames.filter((u) => !(u.userId === userId && u.gameId === gameId));

  if (status === null) return { ...state, userGames: others };
  if (existing?.status === status) return state;

  const entry: UserGame = existing
    ? { ...existing, status, updatedAt: now }
    : { userId, gameId, status, addedAt: now, updatedAt: now };

  const activityType = STATUS_ACTIVITY[status];
  return {
    ...state,
    userGames: [entry, ...others],
    activities: activityType
      ? pushActivity(state.activities, userId, activityType, gameId, now)
      : state.activities,
  };
}

/**
 * The wishlist is the `want_to_play` library status (no separate table).
 * Toggling adds the game as Want to Play, or removes it if it's already there.
 * Games with another status (playing/completed/dropped) are left untouched.
 */
export function toggleWishlist(state: AppState, gameId: ID, now?: string): AppState {
  const userId = requireUser(state);
  const existing = state.userGames.find((u) => u.userId === userId && u.gameId === gameId);
  if (!existing) return setLibraryStatus(state, gameId, "want_to_play", now);
  if (existing.status === "want_to_play") return setLibraryStatus(state, gameId, null, now);
  return state;
}

// ——— Reviews & ratings ———

export interface ReviewInput {
  gameId: ID;
  rating: number | null;
  body: string;
  containsSpoilers: boolean;
}

export const MAX_REVIEW_LENGTH = 5000;

/** Create or update the current user's single review for a game. */
export function upsertReview(
  state: AppState,
  input: ReviewInput,
  now = new Date().toISOString(),
): AppState {
  const userId = requireUser(state);
  const body = input.body.trim();
  if (input.rating !== null && !isValidRating(input.rating)) {
    throw new PrototypeError("Ratings go from 0.5 to 5 stars in half-star steps.");
  }
  if (input.rating === null && !body) {
    throw new PrototypeError("Add a rating, some text, or both.");
  }
  if (body.length > MAX_REVIEW_LENGTH) {
    throw new PrototypeError(`Reviews can be at most ${MAX_REVIEW_LENGTH} characters.`);
  }

  const existing = state.reviews.find((r) => r.userId === userId && r.gameId === input.gameId);
  if (existing) {
    const updated: Review = {
      ...existing,
      rating: input.rating,
      body: body || null,
      containsSpoilers: body ? input.containsSpoilers : false,
      updatedAt: now,
    };
    return { ...state, reviews: state.reviews.map((r) => (r.id === existing.id ? updated : r)) };
  }

  const review: Review = {
    id: createId(),
    userId,
    gameId: input.gameId,
    rating: input.rating,
    body: body || null,
    containsSpoilers: body ? input.containsSpoilers : false,
    createdAt: now,
    updatedAt: now,
  };
  return {
    ...state,
    reviews: [review, ...state.reviews],
    activities: pushActivity(state.activities, userId, "published_review", input.gameId, now, review.id),
  };
}

export function deleteReview(state: AppState, reviewId: ID): AppState {
  const userId = requireUser(state);
  const review = state.reviews.find((r) => r.id === reviewId);
  if (!review) return state;
  if (review.userId !== userId) throw new PrototypeError("You can only delete your own reviews.");
  return {
    ...state,
    reviews: state.reviews.filter((r) => r.id !== reviewId),
    activities: state.activities.filter((a) => a.reviewId !== reviewId),
  };
}

// ——— Diary ———

export interface PlaySessionInput {
  gameId: ID;
  kind: PlaySessionKind;
  startedOn: string;
  finishedOn: string | null;
  note: string;
}

export function logPlaySession(
  state: AppState,
  input: PlaySessionInput,
  now = new Date().toISOString(),
): AppState {
  const userId = requireUser(state);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.startedOn)) {
    throw new PrototypeError("Pick a start date.");
  }
  if (input.finishedOn && input.finishedOn < input.startedOn) {
    throw new PrototypeError("The finish date can't be before the start date.");
  }
  const entry: PlaySession = {
    id: createId(),
    userId,
    gameId: input.gameId,
    kind: input.kind,
    startedOn: input.startedOn,
    finishedOn: input.finishedOn || null,
    note: input.note.trim().slice(0, 500),
    createdAt: now,
  };
  return { ...state, playSessions: [entry, ...state.playSessions] };
}

export function deletePlaySession(state: AppState, sessionId: ID): AppState {
  const userId = requireUser(state);
  const entry = state.playSessions.find((p) => p.id === sessionId);
  if (!entry) return state;
  if (entry.userId !== userId) throw new PrototypeError("You can only delete your own diary entries.");
  return { ...state, playSessions: state.playSessions.filter((p) => p.id !== sessionId) };
}

// ——— Lists ———

export interface ListInput {
  title: string;
  description: string;
  visibility: ListVisibility;
  gameIds: ID[];
}

export const MAX_LIST_TITLE = 100;
export const MAX_LIST_DESCRIPTION = 1000;
export const MAX_LIST_ITEMS = 250;

function validateList(input: ListInput): ListInput {
  const title = input.title.trim();
  const description = input.description.trim();
  if (!title) throw new PrototypeError("Give your list a title.");
  if (title.length > MAX_LIST_TITLE) throw new PrototypeError(`Titles can be at most ${MAX_LIST_TITLE} characters.`);
  if (description.length > MAX_LIST_DESCRIPTION) {
    throw new PrototypeError(`Descriptions can be at most ${MAX_LIST_DESCRIPTION} characters.`);
  }
  // A game can appear only once per list (mirrors the list_items unique constraint).
  const gameIds = [...new Set(input.gameIds)];
  if (gameIds.length > MAX_LIST_ITEMS) throw new PrototypeError(`Lists can hold at most ${MAX_LIST_ITEMS} games.`);
  return { title, description, visibility: input.visibility, gameIds };
}

export function createList(
  state: AppState,
  input: ListInput,
  now = new Date().toISOString(),
): { state: AppState; listId: ID } {
  const userId = requireUser(state);
  const clean = validateList(input);
  const list: GameList = {
    id: createId(),
    userId,
    title: clean.title,
    description: clean.description,
    visibility: clean.visibility,
    featured: false,
    items: clean.gameIds.map((gameId, position) => ({ gameId, position, addedAt: now })),
    createdAt: now,
    updatedAt: now,
  };
  return { state: { ...state, lists: [list, ...state.lists] }, listId: list.id };
}

export function updateList(
  state: AppState,
  listId: ID,
  input: ListInput,
  now = new Date().toISOString(),
): AppState {
  const userId = requireUser(state);
  const list = state.lists.find((l) => l.id === listId);
  if (!list) throw new PrototypeError("List not found.");
  if (list.userId !== userId) throw new PrototypeError("You can only edit your own lists.");
  const clean = validateList(input);
  const previous = new Map(list.items.map((i) => [i.gameId, i.addedAt]));
  const updated: GameList = {
    ...list,
    title: clean.title,
    description: clean.description,
    visibility: clean.visibility,
    items: clean.gameIds.map((gameId, position) => ({
      gameId,
      position,
      addedAt: previous.get(gameId) ?? now,
    })),
    updatedAt: now,
  };
  return { ...state, lists: state.lists.map((l) => (l.id === listId ? updated : l)) };
}

export function deleteList(state: AppState, listId: ID): AppState {
  const userId = requireUser(state);
  const list = state.lists.find((l) => l.id === listId);
  if (!list) return state;
  if (list.userId !== userId) throw new PrototypeError("You can only delete your own lists.");
  return { ...state, lists: state.lists.filter((l) => l.id !== listId) };
}

/** Private lists are visible to their owner only. */
export function canViewList(list: GameList, viewerId: ID | null): boolean {
  return list.visibility === "public" || list.userId === viewerId;
}

// ——— Favorites ———

export function setFavorites(state: AppState, gameIds: ID[]): AppState {
  const userId = requireUser(state);
  const unique = [...new Set(gameIds)];
  if (unique.length > MAX_FAVORITE_GAMES) {
    throw new PrototypeError(`You can pick up to ${MAX_FAVORITE_GAMES} favorite games.`);
  }
  return { ...state, favorites: { ...state.favorites, [userId]: unique } };
}

// ——— Follows ———

export function toggleFollow(state: AppState, targetId: ID, now = new Date().toISOString()): AppState {
  const userId = requireUser(state);
  if (userId === targetId) throw new PrototypeError("You can't follow yourself.");
  const isFollowing = state.follows.some((f) => f.followerId === userId && f.followingId === targetId);
  return {
    ...state,
    follows: isFollowing
      ? state.follows.filter((f) => !(f.followerId === userId && f.followingId === targetId))
      : [...state.follows, { followerId: userId, followingId: targetId, createdAt: now }],
  };
}

// ——— Profile ———

export interface ProfileInput {
  displayName: string;
  bio: string;
}

export function updateProfile(state: AppState, input: ProfileInput): AppState {
  const userId = requireUser(state);
  const displayName = input.displayName.trim();
  const bio = input.bio.trim();
  if (!displayName) throw new PrototypeError("Display name can't be empty.");
  if (displayName.length > 50) throw new PrototypeError("Display name can be at most 50 characters.");
  if (bio.length > 300) throw new PrototypeError("Bio can be at most 300 characters.");
  return {
    ...state,
    profiles: state.profiles.map((p) => (p.id === userId ? { ...p, displayName, bio } : p)),
  };
}
