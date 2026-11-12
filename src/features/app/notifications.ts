"use client";

/**
 * Notifications (written by database triggers) and notification preferences.
 * The unread count is shared by the header bell and refreshed periodically.
 */
import { useEffect, useSyncExternalStore } from "react";
import { getSupabase } from "@/lib/supabase/client";
import type { ActivityType, ID } from "@/types";
import { friendlyError, loadGames, toProfile } from "./db";
import { getAppState, registerGames, registerProfiles } from "./store";

export type NotificationKind = "activity" | "review_like" | "list_like" | "review_comment" | "list_comment";

export interface NotificationItem {
  id: ID;
  actorId: ID;
  kind: NotificationKind;
  activityType: ActivityType | null;
  gameId: ID | null;
  reviewId: ID | null;
  listId: ID | null;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationPreferences {
  libraryAdds: boolean;
  startedPlaying: boolean;
  reviews: boolean;
  likes: boolean;
  comments: boolean;
}

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  libraryAdds: true,
  startedPlaying: true,
  reviews: true,
  likes: true,
  comments: true,
};

// ——— Unread count (shared) ———

let unread = 0;
const listeners = new Set<() => void>();
const setUnread = (n: number) => {
  if (n === unread) return;
  unread = n;
  listeners.forEach((l) => l());
};

export async function refreshUnreadCount(): Promise<void> {
  const userId = getAppState().currentUserId;
  if (!userId) return setUnread(0);
  const { count, error } = await getSupabase()
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", userId)
    .is("read_at", null);
  if (!error) setUnread(count ?? 0);
}

/** Unread notifications for the signed-in user; polls every minute and when the tab regains focus. */
export function useUnreadCount(userId: ID | null): number {
  useEffect(() => {
    if (!userId) {
      setUnread(0);
      return;
    }
    void refreshUnreadCount();
    const timer = setInterval(() => void refreshUnreadCount(), 60_000);
    const onFocus = () => void refreshUnreadCount();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [userId]);
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => unread,
    () => 0,
  );
}

// ——— List ———

interface NotificationRow {
  id: string;
  actor_id: string;
  kind: NotificationKind;
  activity_type: ActivityType | null;
  game_id: string | null;
  review_id: string | null;
  list_id: string | null;
  created_at: string;
  read_at: string | null;
}

/** Latest notifications plus what's needed to show them (actors, games, list titles). */
export async function fetchNotifications(limit = 60): Promise<{ items: NotificationItem[]; listTitles: Record<ID, string> }> {
  const userId = getAppState().currentUserId;
  if (!userId) return { items: [], listTitles: {} };
  const db = getSupabase();
  const { data, error } = await db
    .from("notifications")
    .select("id, actor_id, kind, activity_type, game_id, review_id, list_id, created_at, read_at")
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(friendlyError(error));
  const items: NotificationItem[] = (data as NotificationRow[]).map((r) => ({
    id: r.id,
    actorId: r.actor_id,
    kind: r.kind,
    activityType: r.activity_type,
    gameId: r.game_id,
    reviewId: r.review_id,
    listId: r.list_id,
    createdAt: r.created_at,
    readAt: r.read_at,
  }));

  const actorIds = [...new Set(items.map((i) => i.actorId))];
  const gameIds = [...new Set(items.flatMap((i) => (i.gameId ? [i.gameId] : [])))].filter((id) => !getAppState().games[id]);
  const listIds = [...new Set(items.flatMap((i) => (i.listId ? [i.listId] : [])))];
  const [profiles, games, lists] = await Promise.all([
    actorIds.length ? db.from("profiles").select("*").in("id", actorIds) : Promise.resolve({ data: [] }),
    gameIds.length ? loadGames(db, gameIds) : Promise.resolve([]),
    listIds.length ? db.from("lists").select("id, title").in("id", listIds) : Promise.resolve({ data: [] }),
  ]);
  registerProfiles(((profiles.data ?? []) as Parameters<typeof toProfile>[0][]).map(toProfile));
  registerGames(games);
  const listTitles = Object.fromEntries(((lists.data ?? []) as Array<{ id: string; title: string }>).map((l) => [l.id, l.title]));
  return { items, listTitles };
}

export async function markAllRead(): Promise<void> {
  const userId = getAppState().currentUserId;
  if (!userId) return;
  await getSupabase().from("notifications").update({ read_at: new Date().toISOString() }).eq("recipient_id", userId).is("read_at", null);
  setUnread(0);
}

// ——— Preferences ———

export async function fetchPreferences(): Promise<NotificationPreferences> {
  const userId = getAppState().currentUserId;
  if (!userId) return DEFAULT_PREFERENCES;
  const { data, error } = await getSupabase()
    .from("notification_preferences")
    .select("library_adds, started_playing, reviews, likes, comments")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(friendlyError(error));
  if (!data) return DEFAULT_PREFERENCES;
  return {
    libraryAdds: data.library_adds,
    startedPlaying: data.started_playing,
    reviews: data.reviews,
    likes: data.likes,
    comments: data.comments,
  };
}

export async function savePreferences(p: NotificationPreferences): Promise<void> {
  const userId = getAppState().currentUserId;
  if (!userId) throw new Error("You need to sign in first.");
  const { error } = await getSupabase().from("notification_preferences").upsert({
    user_id: userId,
    library_adds: p.libraryAdds,
    started_playing: p.startedPlaying,
    reviews: p.reviews,
    likes: p.likes,
    comments: p.comments,
  });
  if (error) throw new Error(friendlyError(error));
}
