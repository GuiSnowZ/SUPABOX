"use client";

/**
 * Supabase queries and row mappers (snake_case rows → camelCase domain types).
 * All reads go through Row Level Security with the visitor's session, so
 * private data the user may not see is never returned.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { GAME_COLUMNS, type GameDbRow, toGame } from "@/lib/catalog/rows";
import { SUPABASE_URL } from "@/lib/supabase/config";
import type {
  Activity,
  Follow,
  Game,
  GameList,
  ID,
  PlaySession,
  Profile,
  Review,
  UserGame,
} from "@/types";

// ——— Row shapes ———

interface ProfileRow {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_hue: number;
  avatar_path?: string | null;
  created_at: string;
}
interface UserGameRow {
  user_id: string;
  game_id: string;
  status: UserGame["status"];
  added_at: string;
  updated_at: string;
}
interface ReviewRow {
  id: string;
  user_id: string;
  game_id: string;
  rating: number | string | null;
  body: string | null;
  contains_spoilers: boolean;
  created_at: string;
  updated_at: string;
  like_count?: number;
  comment_count?: number;
}
interface PlaySessionRow {
  id: string;
  user_id: string;
  game_id: string;
  kind: PlaySession["kind"];
  started_on: string;
  finished_on: string | null;
  note: string;
  hours?: number | string | null;
  platform?: string | null;
  created_at: string;
}
interface ListRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  visibility: GameList["visibility"];
  featured: boolean;
  created_at: string;
  updated_at: string;
  like_count?: number;
  comment_count?: number;
  list_items?: { game_id: string; position: number; added_at: string }[];
}
interface FollowRow {
  follower_id: string;
  following_id: string;
  created_at: string;
  notify?: boolean;
}
interface FavoriteRow {
  user_id: string;
  game_id: string;
  position: number;
}
interface ActivityRow {
  id: string;
  user_id: string;
  type: Activity["type"];
  game_id: string;
  review_id: string | null;
  created_at: string;
}

// ——— Mappers ———

export const toProfile = (r: ProfileRow): Profile => ({
  id: r.id,
  username: r.username,
  displayName: r.display_name,
  bio: r.bio,
  avatarHue: r.avatar_hue,
  avatarUrl: r.avatar_path ? avatarPublicUrl(r.avatar_path) : null,
  joinedAt: r.created_at,
});

/** Public URL of a file in the "avatars" storage bucket. */
export function avatarPublicUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/avatars/${path}`;
}

export const toUserGame = (r: UserGameRow): UserGame => ({
  userId: r.user_id,
  gameId: r.game_id,
  status: r.status,
  addedAt: r.added_at,
  updatedAt: r.updated_at,
});

export const toReview = (r: ReviewRow): Review => ({
  id: r.id,
  userId: r.user_id,
  gameId: r.game_id,
  rating: r.rating === null ? null : Number(r.rating),
  body: r.body,
  containsSpoilers: r.contains_spoilers,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  likeCount: r.like_count ?? 0,
  commentCount: r.comment_count ?? 0,
});

export const toPlaySession = (r: PlaySessionRow): PlaySession => ({
  id: r.id,
  userId: r.user_id,
  gameId: r.game_id,
  kind: r.kind,
  startedOn: r.started_on,
  finishedOn: r.finished_on,
  note: r.note,
  hours: r.hours == null ? null : Number(r.hours),
  platform: r.platform ?? null,
  createdAt: r.created_at,
});

export const toList = (r: ListRow): GameList => ({
  id: r.id,
  userId: r.user_id,
  title: r.title,
  description: r.description,
  visibility: r.visibility,
  featured: r.featured,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  likeCount: r.like_count ?? 0,
  commentCount: r.comment_count ?? 0,
  items: (r.list_items ?? [])
    .map((i) => ({ gameId: i.game_id, position: i.position, addedAt: i.added_at }))
    .sort((a, b) => a.position - b.position),
});

export const toFollow = (r: FollowRow): Follow => ({
  followerId: r.follower_id,
  followingId: r.following_id,
  createdAt: r.created_at,
  notify: r.notify ?? true,
});

export const toActivity = (r: ActivityRow): Activity => ({
  id: r.id,
  userId: r.user_id,
  type: r.type,
  gameId: r.game_id,
  reviewId: r.review_id ?? undefined,
  createdAt: r.created_at,
});

export function toFavorites(rows: FavoriteRow[]): Record<ID, ID[]> {
  const out: Record<ID, ID[]> = {};
  for (const r of [...rows].sort((a, b) => a.position - b.position)) {
    (out[r.user_id] ??= []).push(r.game_id);
  }
  return out;
}

const LIST_SELECT = "*, list_items(game_id, position, added_at)";

/** Throws a readable error for failed queries. */
function unwrap<T>(res: { data: T | null; error: { message: string; code?: string } | null }): T {
  if (res.error) throw new DbError(res.error.message, res.error.code);
  return res.data as T;
}

export class DbError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
  }
}

/** Turns database/network errors into messages people can act on. */
export function friendlyError(e: unknown): string {
  if (e instanceof DbError) {
    if (e.code === "23505") return "That already exists.";
    if (e.code === "42501") return "You don't have permission to do that.";
    if (e.code === "23514") return "That value isn't allowed.";
    return e.message;
  }
  if (e instanceof TypeError) return "Couldn't reach Supabox. Check your connection and try again.";
  return e instanceof Error ? e.message : "Something went wrong. Please try again.";
}

// ——— Loaders. Each returns partial cache data for the store to merge. ———

export interface Patch {
  profiles?: Profile[];
  userGames?: UserGame[];
  reviews?: Review[];
  playSessions?: PlaySession[];
  lists?: GameList[];
  favorites?: Record<ID, ID[]>;
  follows?: Follow[];
  activities?: Activity[];
  /** Reviews and lists the signed-in user has liked. */
  liked?: { reviews: ID[]; lists: ID[] };
}

async function fetchProfiles(db: SupabaseClient, ids: Iterable<ID>): Promise<Profile[]> {
  const unique = [...new Set(ids)];
  if (!unique.length) return [];
  return unwrap<ProfileRow[]>(await db.from("profiles").select("*").in("id", unique)).map(toProfile);
}

/** Everything the app needs at start: the user's own data plus community highlights. */
export async function loadBootstrap(db: SupabaseClient, userId: ID | null): Promise<Patch> {
  const community = Promise.all([
    db.from("lists").select(LIST_SELECT).eq("visibility", "public").order("created_at", { ascending: false }).limit(30),
    db.from("lists").select(LIST_SELECT).eq("visibility", "public").eq("featured", true).limit(12),
    db.from("reviews").select("*").not("body", "is", null).order("created_at", { ascending: false }).limit(20),
  ]);

  let own: Patch = {};
  let following: ID[] = [];
  if (userId) {
    const [profile, library, reviews, sessions, lists, favorites, follows, reviewLikes, listLikes] = await Promise.all([
      db.from("profiles").select("*").eq("id", userId).maybeSingle(),
      db.from("user_games").select("*").eq("user_id", userId),
      db.from("reviews").select("*").eq("user_id", userId),
      db.from("play_sessions").select("*").eq("user_id", userId),
      db.from("lists").select(LIST_SELECT).eq("user_id", userId),
      db.from("user_favorite_games").select("*").eq("user_id", userId),
      db.from("follows").select("*").or(`follower_id.eq.${userId},following_id.eq.${userId}`),
      db.from("review_likes").select("review_id").eq("user_id", userId).limit(5000),
      db.from("list_likes").select("list_id").eq("user_id", userId).limit(5000),
    ]);
    const followRows = unwrap<FollowRow[]>(follows).map(toFollow);
    following = followRows.filter((f) => f.followerId === userId).map((f) => f.followingId);
    const p = unwrap<ProfileRow | null>(profile);
    own = {
      profiles: p ? [toProfile(p)] : [],
      userGames: unwrap<UserGameRow[]>(library).map(toUserGame),
      reviews: unwrap<ReviewRow[]>(reviews).map(toReview),
      playSessions: unwrap<PlaySessionRow[]>(sessions).map(toPlaySession),
      lists: unwrap<ListRow[]>(lists).map(toList),
      favorites: { [userId]: toFavorites(unwrap<FavoriteRow[]>(favorites))[userId] ?? [] },
      follows: followRows,
      liked: {
        reviews: (reviewLikes.data ?? []).map((r: { review_id: string }) => r.review_id),
        lists: (listLikes.data ?? []).map((r: { list_id: string }) => r.list_id),
      },
    };
  }

  const feedUsers = userId ? [userId, ...following] : null;
  const [feed, followingReviews] = await Promise.all([
    feedUsers
      ? db.from("activities").select("*").in("user_id", feedUsers).order("created_at", { ascending: false }).limit(40)
      : db.from("activities").select("*").order("created_at", { ascending: false }).limit(30),
    following.length
      ? db.from("reviews").select("*").in("user_id", following).order("created_at", { ascending: false }).limit(100)
      : Promise.resolve({ data: [] as ReviewRow[], error: null }),
  ]);
  const [recentLists, featuredLists, recentReviews] = await community;

  const lists = [...unwrap<ListRow[]>(recentLists), ...unwrap<ListRow[]>(featuredLists)].map(toList);
  const activities = unwrap<ActivityRow[]>(feed).map(toActivity);
  const reviews = [
    ...(own.reviews ?? []),
    ...unwrap<ReviewRow[]>(followingReviews).map(toReview),
    ...unwrap<ReviewRow[]>(recentReviews).map(toReview),
  ];

  const profileIds = new Set<ID>([
    ...lists.map((l) => l.userId),
    ...activities.map((a) => a.userId),
    ...reviews.map((r) => r.userId),
    ...(own.follows ?? []).flatMap((f) => [f.followerId, f.followingId]),
  ]);
  if (userId) profileIds.delete(userId);
  const profiles = [...(own.profiles ?? []), ...(await fetchProfiles(db, profileIds))];

  // Activities may reference reviews not loaded yet (e.g. ratings) — fetch them for star display.
  const missingReviewIds = activities
    .map((a) => a.reviewId)
    .filter((id): id is string => Boolean(id) && !reviews.some((r) => r.id === id));
  if (missingReviewIds.length) {
    reviews.push(...unwrap<ReviewRow[]>(await db.from("reviews").select("*").in("id", missingReviewIds)).map(toReview));
  }

  return { ...own, profiles, lists: [...(own.lists ?? []), ...lists], reviews, activities };
}

/** Reviews for a game page (and their authors). */
/** One review with its author (for the review page). */
export async function loadReview(db: SupabaseClient, reviewId: ID): Promise<Patch> {
  const row = unwrap<ReviewRow | null>(await db.from("reviews").select("*").eq("id", reviewId).maybeSingle());
  if (!row) return {};
  const review = toReview(row);
  return { reviews: [review], profiles: await fetchProfiles(db, [review.userId]) };
}

// ——— Comments (loaded per review/list, not cached globally) ———

export interface CommentItem {
  id: ID;
  userId: ID;
  body: string;
  createdAt: ISODateString;
}
type ISODateString = string;

export async function loadComments(
  db: SupabaseClient,
  kind: "review" | "list",
  targetId: ID,
): Promise<{ comments: CommentItem[]; profiles: Profile[] }> {
  const rows = unwrap<Array<{ id: string; user_id: string; body: string; created_at: string }>>(
    await db
      .from("comments")
      .select("id, user_id, body, created_at")
      .eq(kind === "review" ? "review_id" : "list_id", targetId)
      .order("created_at", { ascending: true })
      .limit(300),
  );
  const comments = rows.map((r) => ({ id: r.id, userId: r.user_id, body: r.body, createdAt: r.created_at }));
  return { comments, profiles: await fetchProfiles(db, comments.map((c) => c.userId)) };
}

export async function postComment(db: SupabaseClient, kind: "review" | "list", targetId: ID, userId: ID, body: string): Promise<CommentItem> {
  const r = unwrap<{ id: string; user_id: string; body: string; created_at: string }>(
    await db
      .from("comments")
      .insert({ user_id: userId, body, [kind === "review" ? "review_id" : "list_id"]: targetId })
      .select("id, user_id, body, created_at")
      .single(),
  );
  return { id: r.id, userId: r.user_id, body: r.body, createdAt: r.created_at };
}

export async function deleteComment(db: SupabaseClient, id: ID) {
  unwrap(await db.from("comments").delete().eq("id", id));
}

export async function loadGame(db: SupabaseClient, gameId: ID): Promise<Patch> {
  const reviews = unwrap<ReviewRow[]>(
    await db.from("reviews").select("*").eq("game_id", gameId).order("updated_at", { ascending: false }).limit(200),
  ).map(toReview);
  return { reviews, profiles: await fetchProfiles(db, reviews.map((r) => r.userId)) };
}

/** A public profile with everything shown on it. Returns null if the user doesn't exist. */
export async function loadUser(db: SupabaseClient, username: string): Promise<(Patch & { userId: ID }) | null> {
  const row = unwrap<ProfileRow | null>(await db.from("profiles").select("*").eq("username", username.toLowerCase()).maybeSingle());
  if (!row) return null;
  const id = row.id;
  const [library, reviews, sessions, lists, favorites, follows] = await Promise.all([
    db.from("user_games").select("*").eq("user_id", id),
    db.from("reviews").select("*").eq("user_id", id),
    db.from("play_sessions").select("*").eq("user_id", id).order("started_on", { ascending: false }).limit(2000),
    db.from("lists").select(LIST_SELECT).eq("user_id", id),
    db.from("user_favorite_games").select("*").eq("user_id", id),
    db.from("follows").select("*").or(`follower_id.eq.${id},following_id.eq.${id}`),
  ]);
  return {
    userId: id,
    profiles: [toProfile(row)],
    userGames: unwrap<UserGameRow[]>(library).map(toUserGame),
    reviews: unwrap<ReviewRow[]>(reviews).map(toReview),
    playSessions: unwrap<PlaySessionRow[]>(sessions).map(toPlaySession),
    lists: unwrap<ListRow[]>(lists).map(toList),
    favorites: { [id]: toFavorites(unwrap<FavoriteRow[]>(favorites))[id] ?? [] },
    follows: unwrap<FollowRow[]>(follows).map(toFollow),
  };
}

/** One list (RLS returns nothing for private lists you don't own). */
export async function loadList(db: SupabaseClient, listId: ID): Promise<Patch> {
  const row = unwrap<ListRow | null>(await db.from("lists").select(LIST_SELECT).eq("id", listId).maybeSingle());
  if (!row) return { lists: [] };
  const list = toList(row);
  return { lists: [list], profiles: await fetchProfiles(db, [list.userId]) };
}

/** Games by id (chunked to keep URLs short). */
export async function loadGames(db: SupabaseClient, ids: ID[]): Promise<Game[]> {
  const out: Game[] = [];
  const unique = [...new Set(ids)];
  for (let i = 0; i < unique.length; i += 100) {
    const chunk = unique.slice(i, i + 100);
    out.push(...unwrap<GameDbRow[]>(await db.from("games").select(GAME_COLUMNS).in("id", chunk)).map(toGame));
  }
  return out;
}

// ——— Writes ———

export const write = {
  async setLibraryStatus(db: SupabaseClient, userId: ID, gameId: ID, status: UserGame["status"] | null) {
    if (status === null) {
      unwrap(await db.from("user_games").delete().eq("user_id", userId).eq("game_id", gameId));
    } else {
      unwrap(
        await db
          .from("user_games")
          .upsert({ user_id: userId, game_id: gameId, status }, { onConflict: "user_id,game_id" }),
      );
    }
  },
  async upsertReview(db: SupabaseClient, r: Review) {
    unwrap(
      await db.from("reviews").upsert(
        {
          id: r.id,
          user_id: r.userId,
          game_id: r.gameId,
          rating: r.rating,
          body: r.body,
          contains_spoilers: r.containsSpoilers,
        },
        { onConflict: "user_id,game_id" },
      ),
    );
  },
  async deleteReview(db: SupabaseClient, id: ID) {
    unwrap(await db.from("reviews").delete().eq("id", id));
  },
  async insertPlaySession(db: SupabaseClient, p: PlaySession) {
    unwrap(
      await db.from("play_sessions").insert({
        id: p.id,
        user_id: p.userId,
        game_id: p.gameId,
        kind: p.kind,
        started_on: p.startedOn,
        finished_on: p.finishedOn,
        note: p.note,
        hours: p.hours ?? null,
        platform: p.platform ?? null,
      }),
    );
  },
  async deletePlaySession(db: SupabaseClient, id: ID) {
    unwrap(await db.from("play_sessions").delete().eq("id", id));
  },
  async saveList(db: SupabaseClient, l: GameList) {
    unwrap(
      await db.rpc("save_list", {
        p_id: l.id,
        p_title: l.title,
        p_description: l.description,
        p_visibility: l.visibility,
        p_game_ids: [...l.items].sort((a, b) => a.position - b.position).map((i) => i.gameId),
      }),
    );
  },
  async deleteList(db: SupabaseClient, id: ID) {
    unwrap(await db.from("lists").delete().eq("id", id));
  },
  async setFavorites(db: SupabaseClient, gameIds: ID[]) {
    unwrap(await db.rpc("set_favorite_games", { p_game_ids: gameIds }));
  },
  async setLike(db: SupabaseClient, kind: "review" | "list", userId: ID, targetId: ID, on: boolean) {
    const table = kind === "review" ? "review_likes" : "list_likes";
    const column = kind === "review" ? "review_id" : "list_id";
    if (on) unwrap(await db.from(table).insert({ user_id: userId, [column]: targetId }));
    else unwrap(await db.from(table).delete().eq("user_id", userId).eq(column, targetId));
  },
  async setFollowNotify(db: SupabaseClient, followerId: ID, followingId: ID, notify: boolean) {
    unwrap(await db.from("follows").update({ notify }).eq("follower_id", followerId).eq("following_id", followingId));
  },
  async follow(db: SupabaseClient, followerId: ID, followingId: ID, on: boolean) {
    if (on) unwrap(await db.from("follows").insert({ follower_id: followerId, following_id: followingId }));
    else unwrap(await db.from("follows").delete().eq("follower_id", followerId).eq("following_id", followingId));
  },
  async updateProfile(db: SupabaseClient, id: ID, displayName: string, bio: string) {
    unwrap(await db.from("profiles").update({ display_name: displayName, bio }).eq("id", id));
  },
  async setAvatarPath(db: SupabaseClient, id: ID, path: string | null) {
    unwrap(await db.from("profiles").update({ avatar_path: path }).eq("id", id));
  },
};
