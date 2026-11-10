/** Pure read helpers over AppState. These become SQL queries in Phase 2. */
import { getGameById } from "@/lib/catalog";
import { summarizeRatings } from "@/lib/ratings";
import type { Game, GameList, ID, LibraryStatus, Profile, Review, UserGame } from "@/types";
import { type AppState, canViewList } from "./state";

export function getProfileById(state: AppState, id: ID): Profile | undefined {
  return state.profiles.find((p) => p.id === id);
}

export function getProfileByUsername(state: AppState, username: string): Profile | undefined {
  const u = username.toLowerCase();
  return state.profiles.find((p) => p.username.toLowerCase() === u);
}

export function getCurrentProfile(state: AppState): Profile | null {
  return state.currentUserId ? (getProfileById(state, state.currentUserId) ?? null) : null;
}

export function getUserGame(state: AppState, userId: ID | null, gameId: ID): UserGame | undefined {
  if (!userId) return undefined;
  return state.userGames.find((u) => u.userId === userId && u.gameId === gameId);
}

export interface LibraryEntry {
  entry: UserGame;
  game: Game;
}

export function getLibrary(state: AppState, userId: ID, status?: LibraryStatus): LibraryEntry[] {
  return state.userGames
    .filter((u) => u.userId === userId && (!status || u.status === status))
    .map((entry) => ({ entry, game: getGameById(entry.gameId) }))
    .filter((x): x is LibraryEntry => Boolean(x.game));
}

export function getWishlist(state: AppState, userId: ID): LibraryEntry[] {
  return getLibrary(state, userId, "want_to_play");
}

export function getReviewsForGame(state: AppState, gameId: ID): Review[] {
  return state.reviews
    .filter((r) => r.gameId === gameId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getUserReview(state: AppState, userId: ID | null, gameId: ID): Review | undefined {
  if (!userId) return undefined;
  return state.reviews.find((r) => r.userId === userId && r.gameId === gameId);
}

export function getCommunityRating(state: AppState, gameId: ID) {
  return summarizeRatings(state.reviews.filter((r) => r.gameId === gameId));
}

/** Reviews by a user, most recently published or edited first. */
export function getReviewsByUser(state: AppState, userId: ID): Review[] {
  return state.reviews
    .filter((r) => r.userId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** Reviews with a written body (not rating-only). */
export function hasText(review: Review): boolean {
  return Boolean(review.body);
}

/** Rated games, most recently rated first. */
export function getRecentRatings(state: AppState, userId: ID, limit = 8): Review[] {
  return getReviewsByUser(state, userId)
    .filter((r) => r.rating !== null)
    .slice(0, limit);
}

export function getFollowingIds(state: AppState, userId: ID): ID[] {
  return state.follows.filter((f) => f.followerId === userId).map((f) => f.followingId);
}

export function getFollowerIds(state: AppState, userId: ID): ID[] {
  return state.follows.filter((f) => f.followingId === userId).map((f) => f.followerId);
}

export function isFollowing(state: AppState, followerId: ID | null, targetId: ID): boolean {
  if (!followerId) return false;
  return state.follows.some((f) => f.followerId === followerId && f.followingId === targetId);
}

/** Reviews from people the user follows, newest first (by original publication date). */
export function getFollowingReviews(state: AppState, userId: ID): Review[] {
  const following = new Set(getFollowingIds(state, userId));
  return state.reviews
    .filter((r) => following.has(r.userId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getFavoriteGames(state: AppState, userId: ID): Game[] {
  return (state.favorites[userId] ?? []).map(getGameById).filter((g): g is Game => Boolean(g));
}

export function getListsByUser(state: AppState, userId: ID, viewerId: ID | null): GameList[] {
  return state.lists
    .filter((l) => l.userId === userId && canViewList(l, viewerId))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getPublicLists(state: AppState): GameList[] {
  return state.lists
    .filter((l) => l.visibility === "public")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getListGames(list: GameList): Game[] {
  return [...list.items]
    .sort((a, b) => a.position - b.position)
    .map((i) => getGameById(i.gameId))
    .filter((g): g is Game => Boolean(g));
}

/** Diary entries for a user (optionally one game), most recent start first. */
export function getPlaySessions(state: AppState, userId: ID, gameId?: ID) {
  return state.playSessions
    .filter((p) => p.userId === userId && (!gameId || p.gameId === gameId))
    .sort((a, b) => b.startedOn.localeCompare(a.startedOn));
}

/** Activity feed: the viewer and people they follow, chronological (newest first). */
export function getFeed(state: AppState, viewerId: ID | null, limit = 12) {
  const scope = viewerId ? new Set([viewerId, ...getFollowingIds(state, viewerId)]) : null;
  return state.activities
    .filter((a) => !scope || scope.has(a.userId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}
