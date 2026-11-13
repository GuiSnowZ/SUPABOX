"use client";

import { ChevronLeft, ListPlus, Users } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useEffect, useId, useMemo, useState } from "react";
import { GameCard, GameGrid, GameGridSkeleton } from "@/components/games/game-card";
import { ListCard, ListGrid } from "@/components/lists/list-card";
import { LoadError, PageSkeleton } from "@/components/layout/require-user";
import { ReviewCard } from "@/components/reviews/review-card";
import { Avatar } from "@/components/ui/avatar";
import { Button, ButtonLink } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { Container, EmptyState, PageHeader } from "@/components/ui/primitives";
import { StarRating } from "@/components/ui/star-rating";
import { toProfile } from "@/features/app/db";
import {
  getFollowerIds,
  getFollowingIds,
  getLibrary,
  getListsByUser,
  getProfileById,
  getProfileByUsername,
  getReviewsByUser,
} from "@/features/app/selectors";
import { loaders, registerProfiles, useAppState, useLoad } from "@/features/app/store";
import { genreName } from "@/i18n/genres";
import {
  arrangeCompleted,
  COMPLETED_FILTERS,
  COMPLETED_SORTS,
  type CompletedFilter,
  type CompletedGame,
  type CompletedOptions,
  type CompletedSort,
  completedGenres,
  DEFAULT_COMPLETED_OPTIONS,
} from "@/lib/completed-games";
import { completionDates } from "@/lib/stats";
import { getSupabase } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import type { Profile } from "@/types";
import { useLocale, useT } from "@/i18n/client";
import { FollowButton } from "./profile-view";

/**
 * The pages behind the five profile numbers: /users/[username]/completed,
 * /reviews, /lists, /followers and /following. They read the same loaded
 * profile data with the same selectors as the profile header, so the count on
 * the profile and the number of items here always agree.
 */

const PAGE = 24;

/** Loads a profile by username and renders `children(profile)`, with loading, error and not-found states. */
function ProfileSubpage({
  username,
  title,
  children,
}: {
  username: string;
  title: (profile: Profile, isOwner: boolean) => string;
  children: (profile: Profile, isOwner: boolean) => ReactNode;
}) {
  const t = useT();
  const state = useAppState();
  const status = useLoad(`user:${username.toLowerCase()}`, () => loaders.user(username));
  const profile = getProfileByUsername(state, username);

  if (status === "error" && !profile) return <LoadError onRetry={() => void loaders.user(username)} />;
  if (!profile) {
    return status === "ready" ? (
      <Container className="py-16">
        <EmptyState title={t.profile.userNotFound} description={t.profile.userNotFoundHint(username)} />
      </Container>
    ) : (
      <PageSkeleton />
    );
  }
  // The profile can be cached (e.g. from a review) before its full data has loaded.
  if (status !== "ready" && status !== "error") return <PageSkeleton />;
  const isOwner = state.currentUserId === profile.id;
  return (
    <Container>
      <nav aria-label="Breadcrumb" className="pt-6 text-sm text-muted">
        <Link href={`/users/${profile.username}`} className="inline-flex items-center gap-1 hover:text-fg">
          <ChevronLeft className="h-4 w-4" /> {t.profilePages.back(profile.displayName)}
        </Link>
      </nav>
      <PageHeader title={title(profile, isOwner)} />
      {children(profile, isOwner)}
    </Container>
  );
}

function ShowMore({ shown, total, onMore }: { shown: number; total: number; onMore: () => void }) {
  const t = useT();
  if (total <= shown) return null;
  return (
    <div className="mt-8 flex flex-col items-center gap-2">
      <p className="text-xs text-faint">{t.profilePages.showing(shown, total)}</p>
      <Button variant="secondary" onClick={onMore}>
        {t.profilePages.showMore}
      </Button>
    </div>
  );
}

// ───────────────────────── Completed ─────────────────────────

function CompletedList({ profile }: { profile: Profile }) {
  const t = useT();
  const locale = useLocale();
  const state = useAppState();
  const ids = { sort: useId(), filter: useId(), genre: useId() };
  const [options, setOptions] = useState<CompletedOptions>(DEFAULT_COMPLETED_OPTIONS);
  const [shown, setShown] = useState(PAGE);

  const all = useMemo<CompletedGame[]>(() => {
    // Same source as the profile's "Completed" number: library entries marked Completed.
    const entries = getLibrary(state, profile.id).filter((e) => e.entry.status === "completed");
    const dates = completionDates({
      games: state.games,
      userGames: entries.map((e) => e.entry),
      reviews: [],
      sessions: state.playSessions.filter((s) => s.userId === profile.id),
    });
    const ratings = new Map(getReviewsByUser(state, profile.id).map((r) => [r.gameId, r.rating]));
    return entries.map((e) => ({
      game: e.game,
      completedOn: dates.get(e.game.id) ?? e.entry.updatedAt.slice(0, 10),
      rating: ratings.get(e.game.id) ?? null,
    }));
  }, [state, profile.id]);
  const genres = useMemo(() => completedGenres(all), [all]);
  const arranged = useMemo(() => arrangeCompleted(all, options), [all, options]);
  const update = (patch: Partial<CompletedOptions>) => {
    setOptions((o) => ({ ...o, ...patch }));
    setShown(PAGE);
  };

  if (!all.length) return <EmptyState title={t.profilePages.completed.empty} />;
  return (
    <>
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor={ids.sort} className="mb-1 block text-xs font-medium text-muted">
            {t.profilePages.sort}
          </label>
          <Select id={ids.sort} value={options.sort} onChange={(e) => update({ sort: e.target.value as CompletedSort })}>
            {COMPLETED_SORTS.map((s) => (
              <option key={s} value={s}>
                {t.profilePages.sorts[s]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor={ids.filter} className="mb-1 block text-xs font-medium text-muted">
            {t.profilePages.show}
          </label>
          <Select id={ids.filter} value={options.filter} onChange={(e) => update({ filter: e.target.value as CompletedFilter })}>
            {COMPLETED_FILTERS.map((f) => (
              <option key={f} value={f}>
                {t.profilePages.filters[f]}
              </option>
            ))}
          </Select>
        </div>
        {genres.length > 1 ? (
          <div>
            <label htmlFor={ids.genre} className="mb-1 block text-xs font-medium text-muted">
              {t.profilePages.genre}
            </label>
            <Select id={ids.genre} value={options.genre ?? ""} onChange={(e) => update({ genre: e.target.value || null })}>
              <option value="">{t.profilePages.allGenres}</option>
              {genres.map((g) => (
                <option key={g} value={g}>
                  {genreName(g, locale)}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
      </div>
      {arranged.length ? (
        <GameGrid>
          {arranged.slice(0, shown).map((i) => (
            <GameCard
              key={i.game.id}
              game={i.game}
              showWishlist={false}
              footer={
                <div className="space-y-0.5">
                  {i.rating !== null ? <StarRating value={i.rating} size="xs" /> : null}
                  <p className="text-xs text-faint">{t.profilePages.completedOn(formatDate(i.completedOn, locale))}</p>
                </div>
              }
            />
          ))}
        </GameGrid>
      ) : (
        <p className="text-sm text-muted">{t.profilePages.noMatch}</p>
      )}
      <ShowMore shown={Math.min(shown, arranged.length)} total={arranged.length} onMore={() => setShown((n) => n + PAGE)} />
    </>
  );
}

export function CompletedView({ username }: { username: string }) {
  const t = useT();
  return (
    <ProfileSubpage
      username={username}
      title={(p, mine) => (mine ? t.profilePages.completed.mine : t.profilePages.completed.title(p.displayName))}
    >
      {(profile) => <CompletedList profile={profile} />}
    </ProfileSubpage>
  );
}

// ───────────────────────── Reviews ─────────────────────────

function ReviewsList({ profile, isOwner }: { profile: Profile; isOwner: boolean }) {
  const t = useT();
  const state = useAppState();
  const [shown, setShown] = useState(20);
  // Same source as the profile's "Reviews" number (ratings with or without text), newest first.
  const reviews = useMemo(
    () => getReviewsByUser(state, profile.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [state, profile.id],
  );
  if (!reviews.length) return <EmptyState title={t.profilePages.reviews.empty} />;
  return (
    <div className="max-w-3xl">
      {reviews.slice(0, shown).map((r) => {
        const game = state.games[r.gameId];
        return game ? <ReviewCard key={r.id} review={r} game={game} editable={isOwner} /> : null;
      })}
      <ShowMore shown={Math.min(shown, reviews.length)} total={reviews.length} onMore={() => setShown((n) => n + 20)} />
    </div>
  );
}

export function UserReviewsView({ username }: { username: string }) {
  const t = useT();
  return (
    <ProfileSubpage username={username} title={(p, mine) => (mine ? t.profilePages.reviews.mine : t.profilePages.reviews.title(p.displayName))}>
      {(profile, isOwner) => <ReviewsList profile={profile} isOwner={isOwner} />}
    </ProfileSubpage>
  );
}

// ───────────────────────── Lists ─────────────────────────

function ListsList({ profile, isOwner }: { profile: Profile; isOwner: boolean }) {
  const t = useT();
  const state = useAppState();
  // Same visibility rule as the profile's "Lists" number: private lists only for their owner.
  const lists = getListsByUser(state, profile.id, state.currentUserId);
  return (
    <>
      {isOwner ? (
        <ButtonLink href="/lists/new" className="mb-6">
          <ListPlus className="h-4 w-4" /> {t.lists.newList}
        </ButtonLink>
      ) : null}
      {lists.length ? (
        <ListGrid>
          {lists.map((l) => (
            <ListCard key={l.id} list={l} />
          ))}
        </ListGrid>
      ) : (
        <EmptyState title={isOwner ? t.profilePages.lists.emptyMine : t.profilePages.lists.empty} />
      )}
    </>
  );
}

export function UserListsView({ username }: { username: string }) {
  const t = useT();
  return (
    <ProfileSubpage username={username} title={(p, mine) => (mine ? t.profilePages.lists.mine : t.profilePages.lists.title(p.displayName))}>
      {(profile, isOwner) => <ListsList profile={profile} isOwner={isOwner} />}
    </ProfileSubpage>
  );
}

// ───────────────────────── Followers / Following ─────────────────────────

/** Fetch profiles we don't have yet (followers can be anyone). */
function useProfiles(ids: string[]): "loading" | "ready" | "error" {
  const state = useAppState();
  const missing = ids.filter((id) => !getProfileById(state, id));
  const key = missing.sort().join(",");
  const [failed, setFailed] = useState<string | null>(null);
  useEffect(() => {
    if (!key) return;
    let alive = true;
    const wanted = key.split(",");
    (async () => {
      for (let i = 0; i < wanted.length; i += 100) {
        const { data, error } = await getSupabase().from("profiles").select("*").in("id", wanted.slice(i, i + 100));
        if (error) throw error;
        if (alive) registerProfiles((data ?? []).map(toProfile));
      }
    })().catch(() => alive && setFailed(key));
    return () => {
      alive = false;
    };
  }, [key]);
  if (!key) return "ready";
  return failed === key ? "error" : "loading";
}

function PeopleList({ profile, kind }: { profile: Profile; kind: "followers" | "following" }) {
  const t = useT();
  const state = useAppState();
  const [shown, setShown] = useState(50);
  // Same source as the profile's numbers. People unfollowed from this page stay
  // listed (with a "Follow" button) until you leave, so a mis-tap can be undone.
  const current = kind === "followers" ? getFollowerIds(state, profile.id) : getFollowingIds(state, profile.id);
  const [kept, setKept] = useState<string[]>(current);
  const missingFromKept = current.filter((id) => !kept.includes(id));
  if (missingFromKept.length) setKept([...kept, ...missingFromKept]);
  const ids = kept;
  const status = useProfiles(ids);
  const people = ids.flatMap((id) => {
    const p = getProfileById(state, id);
    return p ? [p] : [];
  });

  if (!ids.length) return <EmptyState icon={<Users />} title={t.profilePages[kind].empty} />;
  if (status === "error") return <LoadError onRetry={() => location.reload()} />;
  if (status === "loading" && people.length < ids.length) return <GameGridSkeleton count={4} />;
  return (
    <>
      <ul className="grid max-w-3xl gap-2">
        {people.slice(0, shown).map((p) => (
          <li key={p.id} className="flex items-center gap-3 rounded-xl border border-border bg-bg-subtle p-3">
            <Link href={`/users/${p.username}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg">
              <Avatar profile={p} size="md" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-fg hover:text-accent">{p.displayName}</span>
                <span className="block truncate text-xs text-muted">@{p.username}</span>
              </span>
            </Link>
            {p.id === state.currentUserId ? (
              <span className="shrink-0 text-xs text-faint">{t.profilePages.you}</span>
            ) : (
              <FollowButton profile={p} size="sm" />
            )}
          </li>
        ))}
      </ul>
      <ShowMore shown={Math.min(shown, people.length)} total={people.length} onMore={() => setShown((n) => n + 50)} />
    </>
  );
}

export function PeopleView({ username, kind }: { username: string; kind: "followers" | "following" }) {
  const t = useT();
  return (
    <ProfileSubpage username={username} title={(p, mine) => (mine ? t.profilePages[kind].mine : t.profilePages[kind].title(p.displayName))}>
      {(profile) => <PeopleList profile={profile} kind={kind} />}
    </ProfileSubpage>
  );
}
