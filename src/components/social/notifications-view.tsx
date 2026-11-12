"use client";

import { Bell, Heart, MessageCircle, Settings } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import { GameCover } from "@/components/games/game-cover";
import { RequireUser } from "@/components/layout/require-user";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox, FormError } from "@/components/ui/form";
import { Container, EmptyState, PageHeader, Skeleton } from "@/components/ui/primitives";
import {
  DEFAULT_PREFERENCES,
  fetchNotifications,
  fetchPreferences,
  markAllRead,
  type NotificationItem,
  type NotificationPreferences,
  savePreferences,
} from "@/features/app/notifications";
import { getProfileById } from "@/features/app/selectors";
import { useAppState } from "@/features/app/store";
import { toast } from "@/features/app/ui-store";
import { cn, timeAgo } from "@/lib/utils";

const PREF_LABELS: Array<[keyof NotificationPreferences, string, string]> = [
  ["libraryAdds", "A friend adds a game to their collection", "Includes games they save or finish."],
  ["startedPlaying", "A friend starts playing a game", "When they mark a game as Playing."],
  ["reviews", "A friend rates or reviews a game", ""],
  ["likes", "Someone likes your review or list", ""],
  ["comments", "Someone comments on your review or list", ""],
];

function PreferencesPanel() {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPreferences()
      .then(setPrefs)
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Couldn't load your settings.");
        setPrefs(DEFAULT_PREFERENCES);
      });
  }, []);

  async function save() {
    if (!prefs) return;
    setSaving(true);
    setError(null);
    try {
      await savePreferences(prefs);
      toast("Notification settings saved");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save.");
    } finally {
      setSaving(false);
    }
  }

  if (!prefs) return <Skeleton className="h-40 w-full" />;
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Choose what to be notified about. To mute one friend, use the bell on their profile.
      </p>
      <ul className="space-y-2.5">
        {PREF_LABELS.map(([key, label, hint]) => (
          <li key={key}>
            <Checkbox
              label={
                <span>
                  <span className="text-fg">{label}</span>
                  {hint ? <span className="block text-xs text-faint">{hint}</span> : null}
                </span>
              }
              checked={prefs[key]}
              onChange={(e) => setPrefs({ ...prefs, [key]: e.target.checked })}
              className="items-start [&>input]:mt-0.5"
            />
          </li>
        ))}
      </ul>
      <FormError>{error}</FormError>
      <Button size="sm" onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save settings"}
      </Button>
    </div>
  );
}

function describe(n: NotificationItem, game: ReactNode, list: ReactNode): ReactNode {
  switch (n.kind) {
    case "activity":
      if (n.activityType === "started_playing") return <>started playing {game}</>;
      if (n.activityType === "completed") return <>completed {game}</>;
      if (n.activityType === "published_review") return <>rated or reviewed {game}</>;
      return <>added {game} to their collection</>;
    case "review_like":
      return <>liked your review of {game}</>;
    case "review_comment":
      return <>commented on your review of {game}</>;
    case "list_like":
      return <>liked your list {list}</>;
    case "list_comment":
      return <>commented on your list {list}</>;
  }
}

function hrefFor(n: NotificationItem, gameSlug: string | undefined): string {
  if (n.reviewId && (n.kind !== "activity" || n.activityType === "published_review")) return `/reviews/${n.reviewId}`;
  if (n.listId) return `/lists/${n.listId}`;
  return gameSlug ? `/games/${gameSlug}` : "/";
}

function Icon({ n }: { n: NotificationItem }) {
  const cls = "h-3 w-3";
  const icon = n.kind.endsWith("_like") ? <Heart className={cls} /> : n.kind.endsWith("_comment") ? <MessageCircle className={cls} /> : <Bell className={cls} />;
  return (
    <span
      className={cn(
        "absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-bg",
        n.kind.endsWith("_like") ? "bg-[#ff5d7a] text-white" : "bg-accent text-accent-fg",
      )}
    >
      {icon}
    </span>
  );
}

function NotificationsList() {
  const state = useAppState();
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [listTitles, setListTitles] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchNotifications()
      .then(({ items, listTitles }) => {
        if (!alive) return;
        setItems(items);
        setListTitles(listTitles);
        // Opening the page marks everything as read (the highlights stay until you leave).
        if (items.some((i) => !i.readAt)) void markAllRead();
      })
      .catch((e) => alive && setError(e instanceof Error ? e.message : "Couldn't load notifications."));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <Container className="max-w-2xl">
      <PageHeader
        title="Notifications"
        actions={
          <Button variant="secondary" size="sm" onClick={() => setShowSettings((v) => !v)} aria-expanded={showSettings}>
            <Settings className="h-4 w-4" /> Settings
          </Button>
        }
      />
      {showSettings ? (
        <div className="mb-8 rounded-[var(--radius-card)] border border-border bg-bg-subtle p-4">
          <PreferencesPanel />
        </div>
      ) : null}
      {error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : items === null ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Bell />}
          title="No notifications yet"
          description="Follow friends to hear about what they play, and share reviews and lists to get likes and comments."
        />
      ) : (
        <ul className="divide-y divide-border">
          {items.map((n) => {
            const actor = getProfileById(state, n.actorId);
            const game = n.gameId ? state.games[n.gameId] : undefined;
            const gameText = game ? <span className="font-medium text-fg">{game.title}</span> : <>a game</>;
            const listText = <span className="font-medium text-fg">{(n.listId && listTitles[n.listId]) || "a list"}</span>;
            return (
              <li key={n.id}>
                <Link
                  href={hrefFor(n, game?.slug)}
                  className={cn("flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-surface", !n.readAt && "bg-accent/[0.06]")}
                >
                  <span className="relative shrink-0">
                    {actor ? <Avatar profile={actor} size="md" /> : <span className="block h-10 w-10 rounded-full bg-surface" />}
                    <Icon n={n} />
                  </span>
                  <span className="min-w-0 flex-1 text-sm text-muted">
                    <span className="font-medium text-fg">{actor?.displayName ?? "Someone"}</span>{" "}
                    {describe(n, gameText, listText)}
                    <span className="block text-xs text-faint">{timeAgo(n.createdAt)}</span>
                  </span>
                  {game ? <GameCover game={game} showTitle={false} className="w-9 shrink-0" /> : null}
                  {!n.readAt ? <span className="h-2 w-2 shrink-0 rounded-full bg-accent" aria-label="New" /> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Container>
  );
}

export function NotificationsView() {
  return <RequireUser message="Sign in to see your notifications.">{() => <NotificationsList />}</RequireUser>;
}
