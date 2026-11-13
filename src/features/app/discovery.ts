"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type ActivitySignal,
  buildTaste,
  type DiscoveryItem,
  FRIENDS_WINDOW_DAYS,
  hasEnoughTaste,
  recommend,
  scoreActivity,
  topGenres,
} from "@/lib/discovery";
import { GAME_COLUMNS, type GameDbRow, todayIso, toGame } from "@/lib/catalog/rows";
import { getSupabase } from "@/lib/supabase/client";
import type { Game } from "@/types";
import { toProfile } from "./db";
import { getFollowingIds, getReviewsByUser } from "./selectors";
import { registerGames, registerProfiles, useAppState } from "./store";

/**
 * The personal Home rows, computed in the browser from the signed-in user's
 * own data (already loaded by the app) plus one small query each. Nothing here
 * is shown to anyone else.
 */

type Status = "loading" | "ready" | "error";

/** Candidate games read per recommendation request (only the needed genres). */
const MAX_CANDIDATES = 400;
/** Ignore obscure games when recommending. */
const MIN_CANDIDATE_POPULARITY = 15;

// Results are remembered for the session so moving between pages doesn't refetch.
const forYouCache = new Map<string, DiscoveryItem[]>();
const friendsCache = new Map<string, DiscoveryItem[]>();

export interface ForYouResult {
  status: Status;
  items: DiscoveryItem[];
  /** False when we fell back to popular picks (signed out, or not enough history). */
  personalized: boolean;
}

/**
 * You Might Like. `fallback` is the server's popular picks, used when the
 * user's taste isn't known yet; games they already have are removed from it.
 */
export function useForYou(fallback: Game[], limit = 48): ForYouResult {
  const state = useAppState();
  const userId = state.currentUserId;
  const ready = state.authReady && (!userId || state.loads.bootstrap === "ready");

  const taste = useMemo(() => {
    if (!userId) return null;
    const favorites = (state.favorites[userId] ?? []).flatMap((id) => (state.games[id] ? [state.games[id]] : []));
    const ratings = getReviewsByUser(state, userId).flatMap((r) =>
      r.rating != null && state.games[r.gameId] ? [{ game: state.games[r.gameId], rating: r.rating }] : [],
    );
    const library = state.userGames
      .filter((u) => u.userId === userId)
      .flatMap((u) => (state.games[u.gameId] ? [{ game: state.games[u.gameId], status: u.status }] : []));
    return buildTaste({ favorites, ratings, library });
  }, [state, userId]);

  const personalized = Boolean(taste && hasEnoughTaste(taste));
  const genres = taste && personalized ? topGenres(taste) : [];
  const key = userId && personalized ? `${userId}:${genres.join("|")}:${taste?.known.size}` : null;
  const [result, setResult] = useState<{ key: string; status: Status; items: DiscoveryItem[] } | null>(null);

  useEffect(() => {
    if (!ready || !key || !taste) return;
    if (forYouCache.has(key)) return;
    let alive = true;
    getSupabase()
      .from("games")
      .select(GAME_COLUMNS)
      .overlaps("genres", genres)
      .lte("release_date", todayIso())
      .gte("popularity", MIN_CANDIDATE_POPULARITY)
      .not("cover_url", "is", null)
      .order("popularity", { ascending: false })
      .limit(MAX_CANDIDATES)
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) return setResult({ key, status: "error", items: [] });
        const items = recommend(taste, (data as GameDbRow[]).map(toGame), limit).map((r) => ({ game: r.game, because: r.because }));
        registerGames(items.map((i) => i.game));
        forYouCache.set(key, items);
        setResult({ key, status: "ready", items });
      });
    return () => {
      alive = false;
    };
    // genres is derived from key; taste changes always change key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, key, limit]);

  if (!ready) return { status: "loading", items: [], personalized: false };
  if (!personalized) {
    const known = taste?.known ?? new Set<string>();
    return { status: "ready", items: fallback.filter((g) => !known.has(g.id)).slice(0, limit).map((game) => ({ game })), personalized: false };
  }
  const cached = key ? forYouCache.get(key) : undefined;
  if (cached) return { status: "ready", items: cached, personalized: true };
  if (!result || result.key !== key) return { status: "loading", items: [], personalized: true };
  return { status: result.status, items: result.items, personalized: true };
}

export interface FriendsResult {
  status: Status | "signed-out" | "no-follows";
  items: DiscoveryItem[];
}

const MAX_FRIEND_SIGNALS = 3000;

/**
 * Popular With Friends: games the people you follow were active on in the last
 * 30 days, scored like Trending (each friend counts once per game, recent
 * activity weighs more). Only real activity is shown.
 */
export function useFriendsActivity(limit = 48): FriendsResult {
  const state = useAppState();
  const userId = state.currentUserId;
  const ready = state.authReady && (!userId || state.loads.bootstrap === "ready");
  const following = useMemo(() => (userId ? getFollowingIds(state, userId).sort() : []), [state, userId]);
  const key = userId && following.length ? `${userId}:${following.join(",")}` : null;
  const [result, setResult] = useState<{ key: string; status: Status; items: DiscoveryItem[] } | null>(null);

  useEffect(() => {
    if (!ready || !key) return;
    if (friendsCache.has(key)) return;
    let alive = true;
    (async () => {
      const db = getSupabase();
      const since = new Date(Date.now() - FRIENDS_WINDOW_DAYS * 86_400_000).toISOString();
      const { data, error } = await db
        .from("activities")
        .select("user_id, game_id, type, created_at")
        .in("user_id", following)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(MAX_FRIEND_SIGNALS);
      if (error) throw error;
      const signals: ActivitySignal[] = (data ?? []).map((r) => ({ userId: r.user_id, gameId: r.game_id, type: r.type, createdAt: r.created_at }));
      const ranked = scoreActivity(signals, new Date(), FRIENDS_WINDOW_DAYS).slice(0, limit);
      const ids = ranked.map((r) => r.gameId);
      const games = new Map<string, Game>();
      if (ids.length) {
        const g = await db.from("games").select(GAME_COLUMNS).in("id", ids);
        if (g.error) throw g.error;
        for (const row of g.data as GameDbRow[]) games.set(row.id, toGame(row));
        const people = await db.from("profiles").select("*").in("id", [...new Set(ranked.flatMap((r) => r.userIds.slice(0, 3)))]);
        if (!people.error) registerProfiles((people.data ?? []).map(toProfile));
      }
      const items = ranked.flatMap((r) => {
        const game = games.get(r.gameId);
        return game ? [{ game, friendIds: r.userIds }] : [];
      });
      registerGames(items.map((i) => i.game));
      return items;
    })()
      .then((items) => {
        if (!alive) return;
        friendsCache.set(key, items);
        setResult({ key, status: "ready", items });
      })
      .catch(() => alive && setResult({ key, status: "error", items: [] }));
    return () => {
      alive = false;
    };
    // following is derived from key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, key, limit]);

  if (!ready) return { status: "loading", items: [] };
  if (!userId) return { status: "signed-out", items: [] };
  if (!key) return { status: "no-follows", items: [] };
  const cached = friendsCache.get(key);
  if (cached) return { status: "ready", items: cached };
  if (!result || result.key !== key) return { status: "loading", items: [] };
  return { status: result.status, items: result.items };
}
