"use client";

/**
 * App data store: a client-side cache of Supabase rows.
 *
 * - Reads: loaders in db.ts fetch data (through Row Level Security) and merge
 *   it into the cache. Components read the cache with `useAppState()` and the
 *   pure selectors in selectors.ts.
 * - Writes: `actions.*` validate and apply the change locally first (optimistic
 *   UI) using the pure transitions in state.ts, then persist it. If the
 *   database rejects it, the change is rolled back and an error is returned.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useSyncExternalStore } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Follow, Game, GameList, ID, PlaySession, Profile, Review, UserGame } from "@/types";
import { avatarPublicUrl, friendlyError, loadBootstrap, loadGame, loadGames, loadList, loadUser, type Patch, write } from "./db";
import * as t from "./state";
import { type AppState, createEmptyState, type LoadStatus, PrototypeError } from "./state";

const serverSnapshot: AppState = createEmptyState();
let current: AppState = serverSnapshot;
const listeners = new Set<() => void>();

function get() {
  return current;
}

/** Current state outside React (event handlers that need a fresh snapshot). */
export function getAppState(): AppState {
  return current;
}

function commit(next: AppState) {
  if (next === current) return;
  current = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, get, () => serverSnapshot);
}

// ——— Merging loaded data into the cache ———

function upsert<T>(existing: T[], incoming: T[] | undefined, key: (x: T) => string, drop?: (x: T) => boolean): T[] {
  if (!incoming && !drop) return existing;
  const kept = drop ? existing.filter((x) => !drop(x)) : existing;
  if (!incoming?.length) return kept;
  const map = new Map(kept.map((x) => [key(x), x]));
  for (const x of incoming) map.set(key(x), x);
  return [...map.values()];
}

/** Rows owned by `scopeUserId` that are missing from the patch were deleted, so drop them first. */
function merge(state: AppState, patch: Patch, scopeUserId?: ID): AppState {
  const owned = <T extends { userId: ID }>(x: T) => scopeUserId !== undefined && x.userId === scopeUserId;
  return {
    ...state,
    profiles: upsert<Profile>(state.profiles, patch.profiles, (p) => p.id),
    userGames: upsert<UserGame>(state.userGames, patch.userGames, (u) => `${u.userId}:${u.gameId}`, patch.userGames && owned),
    reviews: upsert<Review>(state.reviews, patch.reviews, (r) => r.id, patch.reviews && owned),
    playSessions: upsert<PlaySession>(state.playSessions, patch.playSessions, (p) => p.id, patch.playSessions && owned),
    lists: upsert<GameList>(state.lists, patch.lists, (l) => l.id, patch.lists && owned),
    follows: upsert<Follow>(
      state.follows,
      patch.follows,
      (f) => `${f.followerId}:${f.followingId}`,
      patch.follows && scopeUserId !== undefined
        ? (f) => f.followerId === scopeUserId || f.followingId === scopeUserId
        : undefined,
    ),
    favorites: patch.favorites ? { ...state.favorites, ...patch.favorites } : state.favorites,
    activities: patch.activities ?? state.activities,
  };
}

/** Add catalog games we already have (e.g. from a server-rendered page or search). */
export function registerGames(games: Game[]) {
  if (!games.length) return;
  const s = get();
  if (games.every((g) => s.games[g.id] === g)) return;
  const next = { ...s.games };
  for (const g of games) next[g.id] = g;
  commit({ ...s, games: next });
}

/** Ids of games referenced by cached rows that aren't in the game cache yet. */
function missingGameIds(s: AppState): ID[] {
  const ids = new Set<ID>();
  for (const u of s.userGames) ids.add(u.gameId);
  for (const r of s.reviews) ids.add(r.gameId);
  for (const p of s.playSessions) ids.add(p.gameId);
  for (const a of s.activities) ids.add(a.gameId);
  for (const l of s.lists) for (const i of l.items) ids.add(i.gameId);
  for (const favs of Object.values(s.favorites)) for (const id of favs) ids.add(id);
  return [...ids].filter((id) => !s.games[id]);
}

async function fillMissingGames(db: SupabaseClient) {
  const missing = missingGameIds(get());
  if (!missing.length) return;
  registerGames(await loadGames(db, missing));
}

function setLoad(key: string, status: LoadStatus) {
  commit({ ...get(), loads: { ...get().loads, [key]: status } });
}

const inflight = new Map<string, Promise<void>>();

/**
 * Write tracking. A fetch that overlaps a write may return data from before the
 * write (e.g. a list that was just deleted), so such results are discarded and
 * fetched again once writes have settled.
 */
let writeVersion = 0;
let pendingWrites = 0;
let settledWaiters: Array<() => void> = [];

function writeStarted() {
  pendingWrites++;
  writeVersion++;
}

function writeFinished() {
  pendingWrites--;
  writeVersion++;
  if (pendingWrites === 0) {
    settledWaiters.forEach((r) => r());
    settledWaiters = [];
  }
}

function writesSettled(): Promise<void> {
  return pendingWrites === 0 ? Promise.resolve() : new Promise((r) => settledWaiters.push(r));
}

type Applier = (s: AppState) => AppState;

/** Run a loader once per key (concurrent callers share the request). */
function load(key: string, fetcher: (db: SupabaseClient) => Promise<Applier>, force = false): Promise<void> {
  if (!isSupabaseConfigured) return Promise.resolve();
  if (!force && (get().loads[key] === "ready" || inflight.has(key))) return inflight.get(key) ?? Promise.resolve();
  setLoad(key, "loading");
  const p = (async () => {
    const db = getSupabase();
    for (let attempt = 0; ; attempt++) {
      await writesSettled();
      const version = writeVersion;
      const apply = await fetcher(db);
      if ((version === writeVersion && pendingWrites === 0) || attempt >= 3) {
        commit(apply(get()));
        // Fetch the games those rows point at before reporting "ready", so pages don't flash empty cards.
        await fillMissingGames(db);
        return;
      }
      // A write happened while fetching: this result may be stale. Fetch again.
    }
  })()
    .then(() => setLoad(key, "ready"))
    .catch((e) => {
      console.error(`[supabox] failed to load ${key}`, e);
      setLoad(key, "error");
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

export const loaders = {
  bootstrap: (force = false) =>
    load(
      "bootstrap",
      async (db) => {
        const userId = get().currentUserId;
        const patch = await loadBootstrap(db, userId);
        return (s) => (s.currentUserId === userId ? merge(s, patch, userId ?? undefined) : s);
      },
      force,
    ),
  game: (gameId: ID) =>
    load(`game:${gameId}`, async (db) => {
      const patch = await loadGame(db, gameId);
      // Replace this game's reviews (deleted ones disappear), keep everything else.
      return (s) =>
        merge({ ...s, reviews: s.reviews.filter((r) => r.gameId !== gameId || r.userId === s.currentUserId) }, patch);
    }),
  user: (username: string) =>
    load(`user:${username.toLowerCase()}`, async (db) => {
      const patch = await loadUser(db, username);
      return (s) => (patch ? merge(s, patch, patch.userId) : s);
    }),
  list: (listId: ID) =>
    load(`list:${listId}`, async (db) => {
      const patch = await loadList(db, listId);
      return (s) => merge({ ...s, lists: s.lists.filter((l) => l.id !== listId) }, patch);
    }),
};

/** Trigger a loader from a component; returns its status. */
export function useLoad(key: string | null, run: () => Promise<void>): LoadStatus | undefined {
  const state = useAppState();
  const ready = state.authReady;
  useEffect(() => {
    if (key && ready) void run();
    // `run` is recreated each render; the key identifies the resource.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ready]);
  return key ? (ready ? (state.loads[key] ?? "loading") : "loading") : undefined;
}

// ——— Auth session ———

let started = false;

/** Start listening to the auth session (once, in the browser). */
export function startStore() {
  if (started || typeof window === "undefined") return;
  started = true;
  if (!isSupabaseConfigured) {
    commit({ ...get(), authReady: true });
    return;
  }
  const db = getSupabase();
  db.auth.onAuthStateChange((_event, session) => {
    const userId = session?.user.id ?? null;
    const s = get();
    if (s.authReady && s.currentUserId === userId) return;
    // Defer: Supabase recommends not awaiting other calls inside this callback.
    setTimeout(() => {
      const fresh = userId === s.currentUserId ? get() : { ...createEmptyState(), games: get().games };
      commit({ ...fresh, currentUserId: userId, authReady: true });
      void loaders.bootstrap(true);
    }, 0);
  });
}

// ——— Writes ———

export type ActionResult<T = void> = { ok: true; value: T } | { ok: false; error: string };

/**
 * Optimistic mutation: apply `compute` locally, then `persist`. On failure,
 * roll back (if nothing else changed meanwhile) or reload from the server.
 */
async function mutate<T = void>(
  compute: (s: AppState) => { state: AppState; value: T },
  persist: (db: SupabaseClient, prev: AppState, next: AppState, value: T) => Promise<void>,
): Promise<ActionResult<T>> {
  const prev = get();
  let result: { state: AppState; value: T };
  try {
    result = compute(prev);
  } catch (e) {
    if (e instanceof PrototypeError) return { ok: false, error: e.message };
    throw e;
  }
  if (!isSupabaseConfigured) return { ok: false, error: "Supabox isn't connected to its database yet." };
  commit(result.state);
  writeStarted();
  try {
    await persist(getSupabase(), prev, result.state, result.value);
    return { ok: true, value: result.value };
  } catch (e) {
    if (get() === result.state) commit(prev);
    else void loaders.bootstrap(true);
    return { ok: false, error: friendlyError(e) };
  } finally {
    writeFinished();
  }
}

const same = (fn: (s: AppState) => AppState) => (s: AppState) => ({ state: fn(s), value: undefined });

function me(s: AppState): ID {
  if (!s.currentUserId) throw new PrototypeError("You need to sign in first.");
  return s.currentUserId;
}

function libraryStatusAfter(s: AppState, gameId: ID) {
  return s.userGames.find((u) => u.userId === s.currentUserId && u.gameId === gameId)?.status ?? null;
}

export const actions = {
  setLibraryStatus: (gameId: ID, status: UserGame["status"] | null) =>
    mutate(same((s) => t.setLibraryStatus(s, gameId, status)), (db, _p, next) =>
      write.setLibraryStatus(db, me(next), gameId, status),
    ),

  toggleWishlist: (gameId: ID) =>
    mutate(same((s) => t.toggleWishlist(s, gameId)), async (db, prev, next) => {
      if (prev === next) return;
      await write.setLibraryStatus(db, me(next), gameId, libraryStatusAfter(next, gameId));
    }),

  upsertReview: (input: t.ReviewInput) =>
    mutate(same((s) => t.upsertReview(s, input)), async (db, _p, next) => {
      const review = next.reviews.find((r) => r.userId === next.currentUserId && r.gameId === input.gameId);
      if (review) await write.upsertReview(db, review);
    }),

  deleteReview: (reviewId: ID) =>
    mutate(same((s) => t.deleteReview(s, reviewId)), (db) => write.deleteReview(db, reviewId)),

  logPlaySession: (input: t.PlaySessionInput) =>
    mutate(same((s) => t.logPlaySession(s, input)), async (db, prev, next) => {
      const added = next.playSessions.find((p) => !prev.playSessions.includes(p));
      if (added) await write.insertPlaySession(db, added);
    }),

  deletePlaySession: (sessionId: ID) =>
    mutate(same((s) => t.deletePlaySession(s, sessionId)), (db) => write.deletePlaySession(db, sessionId)),

  createList: (input: t.ListInput) =>
    mutate(
      (s) => {
        const r = t.createList(s, input);
        return { state: r.state, value: r.listId };
      },
      async (db, _p, next, listId) => {
        const list = next.lists.find((l) => l.id === listId);
        if (list) await write.saveList(db, list);
      },
    ),

  updateList: (listId: ID, input: t.ListInput) =>
    mutate(same((s) => t.updateList(s, listId, input)), async (db, _p, next) => {
      const list = next.lists.find((l) => l.id === listId);
      if (list) await write.saveList(db, list);
    }),

  deleteList: (listId: ID) => mutate(same((s) => t.deleteList(s, listId)), (db) => write.deleteList(db, listId)),

  setFavorites: (gameIds: ID[]) =>
    mutate(same((s) => t.setFavorites(s, gameIds)), async (db, _p, next) => {
      await write.setFavorites(db, next.favorites[me(next)] ?? []);
    }),

  toggleFollow: (targetId: ID) =>
    mutate(same((s) => t.toggleFollow(s, targetId)), async (db, _p, next) => {
      const userId = me(next);
      const nowFollowing = next.follows.some((f) => f.followerId === userId && f.followingId === targetId);
      await write.follow(db, userId, targetId, nowFollowing);
    }),

  /** Point the profile at an already-uploaded picture (or remove it with null). */
  setAvatarPath: (path: string | null) =>
    mutate(
      same((s) => {
        const userId = me(s);
        const avatarUrl = path ? avatarPublicUrl(path) : null;
        return { ...s, profiles: s.profiles.map((p) => (p.id === userId ? { ...p, avatarUrl } : p)) };
      }),
      (db, _p, next) => write.setAvatarPath(db, me(next), path),
    ),

  updateProfile: (input: t.ProfileInput) =>
    mutate(same((s) => t.updateProfile(s, input)), async (db, _p, next) => {
      const p = next.profiles.find((x) => x.id === next.currentUserId);
      if (p) await write.updateProfile(db, p.id, p.displayName, p.bio);
    }),
};
