"use client";

import { Bell, Heart, MessageCircle, Settings } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import { GameCover } from "@/components/games/game-cover";
import { RequireUser } from "@/components/layout/require-user";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox, FormError } from "@/components/ui/form";
import {
  Container,
  EmptyState,
  PageHeader,
  Skeleton,
} from "@/components/ui/primitives";
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
import type { Dictionary } from "@/i18n";
import { useLocale, useT } from "@/i18n/client";

const PREF_KEYS: Array<keyof NotificationPreferences> = [
  "libraryAdds",
  "startedPlaying",
  "reviews",
  "likes",
  "comments",
];

function PreferencesPanel() {
  const t = useT();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPreferences()
      .then(setPrefs)
      .catch((e) => {
        setError(
          e instanceof Error ? e.message : t.notifications.settingsError,
        );
        setPrefs(DEFAULT_PREFERENCES);
      });
  }, [t.notifications.settingsError]);

  async function save() {
    if (!prefs) return;
    setSaving(true);
    setError(null);
    try {
      await savePreferences(prefs);
      toast(t.notifications.saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.notifications.saveError);
    } finally {
      setSaving(false);
    }
  }

  if (!prefs) return <Skeleton className="h-40 w-full" />;
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">{t.notifications.settingsHint}</p>
      <ul className="space-y-2.5">
        {PREF_KEYS.map((key) => {
          const [label, hint] = t.notifications.prefs[key];
          return (
            <li key={key}>
              <Checkbox
                label={
                  <span>
                    <span className="text-fg">{label}</span>
                    {hint ? (
                      <span className="block text-xs text-faint">{hint}</span>
                    ) : null}
                  </span>
                }
                checked={prefs[key]}
                onChange={(e) =>
                  setPrefs({ ...prefs, [key]: e.target.checked })
                }
                className="items-start [&>input]:mt-0.5"
              />
            </li>
          );
        })}
      </ul>
      <FormError>{error}</FormError>
      <Button size="sm" onClick={save} disabled={saving}>
        {saving ? t.common.saving : t.notifications.saveSettings}
      </Button>
    </div>
  );
}

function describe(
  t: Dictionary,
  n: NotificationItem,
  game: ReactNode,
  list: ReactNode,
): ReactNode {
  const key =
    n.kind === "activity" ? (n.activityType ?? "added_to_library") : n.kind;
  const [before, after] = t.notifications.text[key];
  const target = n.kind.startsWith("list_") ? list : game;
  return (
    <>
      {before}
      {target}
      {after}
    </>
  );
}

function hrefFor(n: NotificationItem, gameSlug: string | undefined): string {
  if (
    n.reviewId &&
    (n.kind !== "activity" || n.activityType === "published_review")
  )
    return `/reviews/${n.reviewId}`;
  if (n.listId) return `/lists/${n.listId}`;
  return gameSlug ? `/games/${gameSlug}` : "/";
}

function Icon({ n }: { n: NotificationItem }) {
  const cls = "h-3 w-3";
  const icon = n.kind.endsWith("_like") ? (
    <Heart className={cls} />
  ) : n.kind.endsWith("_comment") ? (
    <MessageCircle className={cls} />
  ) : (
    <Bell className={cls} />
  );
  return (
    <span
      className={cn(
        "absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-bg",
        n.kind.endsWith("_like")
          ? "bg-[#ff5d7a] text-white"
          : "bg-accent text-accent-fg",
      )}
    >
      {icon}
    </span>
  );
}

function NotificationsList() {
  const t = useT();
  const locale = useLocale();
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
      .catch(
        (e) =>
          alive &&
          setError(e instanceof Error ? e.message : t.notifications.loadError),
      );
    return () => {
      alive = false;
    };
  }, [t.notifications.loadError]);

  return (
    <Container className="max-w-2xl">
      <PageHeader
        title={t.notifications.title}
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowSettings((v) => !v)}
            aria-expanded={showSettings}
          >
            <Settings className="h-4 w-4" /> {t.notifications.settings}
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
          title={t.notifications.empty}
          description={t.notifications.emptyHint}
        />
      ) : (
        <ul className="divide-y divide-border">
          {items.map((n) => {
            const actor = getProfileById(state, n.actorId);
            const game = n.gameId ? state.games[n.gameId] : undefined;
            const gameText = game ? (
              <span className="font-medium text-fg">{game.title}</span>
            ) : (
              <>{t.notifications.aGame}</>
            );
            const listText = (
              <span className="font-medium text-fg">
                {(n.listId && listTitles[n.listId]) || t.notifications.aList}
              </span>
            );
            return (
              <li key={n.id}>
                <Link
                  href={hrefFor(n, game?.slug)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-surface",
                    !n.readAt && "bg-accent/[0.06]",
                  )}
                >
                  <span className="relative shrink-0">
                    {actor ? (
                      <Avatar profile={actor} size="md" />
                    ) : (
                      <span className="block h-10 w-10 rounded-full bg-surface" />
                    )}
                    <Icon n={n} />
                  </span>
                  <span className="min-w-0 flex-1 text-sm text-muted">
                    <span className="font-medium text-fg">
                      {actor?.displayName ?? t.notifications.someone}
                    </span>{" "}
                    {describe(t, n, gameText, listText)}
                    <span className="block text-xs text-faint">
                      {timeAgo(n.createdAt, locale)}
                    </span>
                  </span>
                  {game ? (
                    <GameCover
                      game={game}
                      showTitle={false}
                      className="w-9 shrink-0"
                    />
                  ) : null}
                  {!n.readAt ? (
                    <span
                      className="h-2 w-2 shrink-0 rounded-full bg-accent"
                      aria-label={t.notifications.new}
                    />
                  ) : null}
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
  const t = useT();
  return (
    <RequireUser message={t.notifications.signIn}>
      {() => <NotificationsList />}
    </RequireUser>
  );
}
