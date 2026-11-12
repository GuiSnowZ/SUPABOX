"use client";

import {
  BarChart3,
  BellOff,
  BellRing,
  BookMarked,
  CalendarDays,
  Library,
  ListPlus,
  Pencil,
  UserCheck,
  UserPlus,
  UserX,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { GameCard } from "@/components/games/game-card";
import { ListCard, ListGrid } from "@/components/lists/list-card";
import {
  LoadError,
  PageSkeleton,
  RequireUser,
} from "@/components/layout/require-user";
import { ReviewCard } from "@/components/reviews/review-card";
import { Avatar } from "@/components/ui/avatar";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  Container,
  EmptyState,
  SectionHeader,
} from "@/components/ui/primitives";
import {
  getFavoriteGames,
  getFollowerIds,
  getFollowingIds,
  getLibrary,
  getListsByUser,
  getPlaySessions,
  getProfileByUsername,
  getReviewsByUser,
  hasText,
  isFollowing,
} from "@/features/app/selectors";
import { actions, loaders, useAppState, useLoad } from "@/features/app/store";
import { promptSignIn, toast } from "@/features/app/ui-store";
import { formatDate } from "@/lib/utils";
import type { Game, Profile } from "@/types";
import { FavoriteGames } from "./favorite-games";
import { useLocale, useT } from "@/i18n/client";
import { Medals } from "./medals";
import { RatedGames } from "./rated-games";

function Stat({
  value,
  label,
  href,
}: {
  value: number;
  label: string;
  href?: string;
}) {
  const inner = (
    <>
      <span className="block text-lg font-semibold tabular-nums text-fg">
        {value}
      </span>
      <span className="text-xs text-muted">{label}</span>
    </>
  );
  return href ? (
    <Link
      href={href}
      className="rounded-md hover:[&>span:first-child]:text-accent"
    >
      {inner}
    </Link>
  ) : (
    <div>{inner}</div>
  );
}

function FollowButton({ profile }: { profile: Profile }) {
  const t = useT();
  const state = useAppState();
  const following = isFollowing(state, state.currentUserId, profile.id);
  return (
    <Button
      variant={following ? "secondary" : "primary"}
      className="group/follow"
      aria-pressed={following}
      onClick={async () => {
        if (!state.authReady) return;
        if (!state.currentUserId)
          return promptSignIn(t.profile.signInFollow(profile.displayName));
        const r = await actions.toggleFollow(profile.id);
        if (!r.ok) return toast(r.error, "error");
        toast(
          following
            ? t.profile.unfollowed(profile.displayName)
            : t.profile.nowFollowing(profile.displayName),
        );
      }}
    >
      {following ? (
        <>
          <UserCheck className="h-4 w-4 group-hover/follow:hidden" />
          <UserX className="hidden h-4 w-4 group-hover/follow:block" />
          <span className="group-hover/follow:hidden">{t.profile.following}</span>
          <span className="hidden group-hover/follow:inline">{t.profile.unfollow}</span>
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" /> {t.profile.follow}
        </>
      )}
    </Button>
  );
}

/** Per-friend bell: shown next to "Following" to turn this person's notifications on or off. */
function FriendBell({ profile }: { profile: Profile }) {
  const t = useT();
  const state = useAppState();
  const me = state.currentUserId;
  const follow = state.follows.find(
    (f) => f.followerId === me && f.followingId === profile.id,
  );
  if (!follow) return null;
  const on = follow.notify !== false;
  return (
    <Button
      variant="secondary"
      size="icon"
      className="h-10 w-10"
      aria-pressed={on}
      aria-label={
        on
          ? t.profile.bellOff(profile.displayName)
          : t.profile.bellOn(profile.displayName)
      }
      title={on ? t.profile.notificationsOn : t.profile.notificationsOff}
      onClick={async () => {
        const r = await actions.setFollowNotify(profile.id, !on);
        if (!r.ok) return toast(r.error, "error");
        toast(
          on
            ? t.profile.wontNotify(profile.displayName)
            : t.profile.willNotify(profile.displayName),
        );
      }}
    >
      {on ? (
        <BellRing className="h-4 w-4 text-accent" />
      ) : (
        <BellOff className="h-4 w-4" />
      )}
    </Button>
  );
}

function Section({ children }: { children: ReactNode }) {
  return <div className="min-w-0">{children}</div>;
}

function CoverRow({ games, empty }: { games: Game[]; empty: string }) {
  if (!games.length) return <p className="text-sm text-muted">{empty}</p>;
  return (
    <div className="grid grid-cols-4 gap-3">
      {games.map((g) => (
        <GameCard key={g.id} game={g} showMeta={false} showWishlist={false} />
      ))}
    </div>
  );
}

function ProfileContent({ profile }: { profile: Profile }) {
  const t = useT();
  const locale = useLocale();
  const state = useAppState();
  const viewerId = state.currentUserId;
  const isOwner = viewerId === profile.id;

  const favorites = getFavoriteGames(state, profile.id);
  const reviews = getReviewsByUser(state, profile.id)
    .filter(hasText)
    .slice(0, 3);
  const lists = getListsByUser(state, profile.id, viewerId);
  const library = getLibrary(state, profile.id);
  const completed = library
    .filter((e) => e.entry.status === "completed")
    .sort((a, b) => b.entry.updatedAt.localeCompare(a.entry.updatedAt));
  const wishlistCount = library.filter(
    (e) => e.entry.status === "want_to_play",
  ).length;

  // Recently played: currently playing first, then games from recent diary entries.
  const recentIds = [
    ...library
      .filter((e) => e.entry.status === "playing")
      .map((e) => e.game.id),
    ...getPlaySessions(state, profile.id).map((p) => p.gameId),
  ];
  const recentlyPlayed = [...new Set(recentIds)]
    .map((id) => state.games[id])
    .filter((g): g is Game => Boolean(g))
    .slice(0, 8);

  const followers = getFollowerIds(state, profile.id).length;
  const followingCount = getFollowingIds(state, profile.id).length;

  return (
    <div>
      <div className="relative border-b border-border">
        <div
          aria-hidden
          className="absolute inset-0 -z-0 opacity-40"
          style={{
            background: `radial-gradient(60% 120% at 20% 0%, hsl(${profile.avatarHue} 40% 30% / 0.6), transparent 70%)`,
          }}
        />
        <Container className="relative flex flex-col gap-6 py-8 sm:flex-row sm:items-end sm:py-10">
          <Avatar profile={profile} size="xl" />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {profile.displayName}
            </h1>
            <p className="text-sm text-muted">@{profile.username}</p>
            {profile.bio ? (
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-fg/85">
                {profile.bio}
              </p>
            ) : null}
            <div className="mt-5 grid grid-cols-5 gap-2 sm:flex sm:gap-x-8">
              <Stat value={completed.length} label={t.profile.statCompleted} />
              <Stat
                value={getReviewsByUser(state, profile.id).length}
                label={t.profile.statReviews}
              />
              <Stat value={lists.length} label={t.profile.statLists} />
              <Stat value={followers} label={t.profile.statFollowers} />
              <Stat value={followingCount} label={t.profile.statFollowing} />
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {isOwner ? (
              <ButtonLink href="/profile/edit" variant="secondary">
                <Pencil className="h-4 w-4" /> {t.profile.edit}
              </ButtonLink>
            ) : (
              <>
                <FollowButton profile={profile} />
                <FriendBell profile={profile} />
              </>
            )}
          </div>
        </Container>
      </div>

      <Container className="space-y-14 pt-10">
        <div className="flex flex-wrap gap-2">
          <ButtonLink
            href={`/users/${profile.username}/diary`}
            variant="secondary"
            size="sm"
          >
            <CalendarDays className="h-4 w-4" /> {t.profile.diary}
          </ButtonLink>
          <ButtonLink
            href={`/users/${profile.username}/stats?year=${new Date().getFullYear()}`}
            variant="secondary"
            size="sm"
          >
            <BarChart3 className="h-4 w-4" /> {t.profile.inReview(new Date().getFullYear())}
          </ButtonLink>
          {isOwner ? (
            <>
              <ButtonLink href="/library" variant="secondary" size="sm">
                <Library className="h-4 w-4" /> {t.profile.myLibrary} · {library.length}
              </ButtonLink>
              <ButtonLink
                href="/library/wishlist"
                variant="secondary"
                size="sm"
              >
                <BookMarked className="h-4 w-4" /> {t.profile.myWishlist} · {wishlistCount}
              </ButtonLink>
            </>
          ) : null}
        </div>

        <FavoriteGames games={favorites} isOwner={isOwner} />

        <Medals
          reviews={getReviewsByUser(state, profile.id).filter(hasText).length}
          completed={completed.length}
        />

        <RatedGames userId={profile.id} />

        <div className="grid gap-14 lg:grid-cols-2">
          <Section>
            <SectionHeader title={t.profile.recentlyPlayed} />
            <CoverRow
              games={recentlyPlayed.slice(0, 4)}
              empty={t.profile.nothingRecent}
            />
          </Section>
          <Section>
            <SectionHeader
              title={t.profile.completed}
              count={completed.length}
              href={isOwner ? "/library" : undefined}
            />
            <CoverRow
              games={completed.slice(0, 4).map((e) => e.game)}
              empty={t.profile.noneCompleted}
            />
          </Section>
        </div>

        <section aria-labelledby="lists-heading">
          <SectionHeader
            id="lists-heading"
            title={isOwner ? t.profile.myLists : t.profile.lists}
            count={lists.length}
          />
          {lists.length ? (
            <ListGrid>
              {lists.slice(0, 6).map((l) => (
                <ListCard key={l.id} list={l} />
              ))}
            </ListGrid>
          ) : isOwner ? (
            <EmptyState
              title={t.profile.noLists}
              action={
                <ButtonLink href="/lists/new" size="sm">
                  <ListPlus className="h-4 w-4" /> {t.lists.create}
                </ButtonLink>
              }
            />
          ) : (
            <p className="text-sm text-muted">{t.profile.noPublicLists}</p>
          )}
          {isOwner && lists.length ? (
            <ButtonLink
              href="/lists/new"
              variant="secondary"
              size="sm"
              className="mt-6"
            >
              <ListPlus className="h-4 w-4" /> {t.lists.newList}
            </ButtonLink>
          ) : null}
        </section>

        <section
          aria-labelledby="profile-reviews-heading"
          className="max-w-3xl"
        >
          <SectionHeader
            id="profile-reviews-heading"
            title={t.profile.recentReviews}
            href={isOwner ? "/reviews" : undefined}
          />
          {reviews.length ? (
            reviews.map((r) => {
              const g = state.games[r.gameId];
              return g ? <ReviewCard key={r.id} review={r} game={g} /> : null;
            })
          ) : (
            <p className="text-sm text-muted">{t.profile.noWritten}</p>
          )}
        </section>

        <p className="text-xs text-faint">
          {t.profile.memberSince(formatDate(profile.joinedAt, locale))}
        </p>
      </Container>
    </div>
  );
}

/** `/users/[username]` — anyone's public profile. */
export function PublicProfile({ username }: { username: string }) {
  const t = useT();
  const state = useAppState();
  const status = useLoad(`user:${username.toLowerCase()}`, () =>
    loaders.user(username),
  );
  const profile = getProfileByUsername(state, username);
  if (status === "error")
    return <LoadError onRetry={() => void loaders.user(username)} />;
  if (!profile && status !== "ready") return <PageSkeleton />;
  if (!profile) {
    return (
      <Container className="py-16">
        <EmptyState
          title={t.profile.userNotFound}
          description={t.profile.userNotFoundHint(username)}
        />
      </Container>
    );
  }
  return <ProfileContent profile={profile} />;
}

/** `/profile` — the signed-in user's own profile. */
export function MyProfile() {
  const t = useT();
  return (
    <RequireUser message={t.profile.signIn}>
      {(user) => <ProfileContent profile={user} />}
    </RequireUser>
  );
}
