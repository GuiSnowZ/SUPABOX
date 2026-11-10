"use client";

import { BookMarked, CheckCircle2, Gamepad2, ListChecks, NotebookPen, PenLine, PlayCircle, Plus, Users } from "lucide-react";
import Link from "next/link";
import { GameCard, GameGrid } from "@/components/games/game-card";
import { GameCover } from "@/components/games/game-cover";
import { ReviewCard } from "@/components/reviews/review-card";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { Container, EmptyState, SectionHeader, Skeleton } from "@/components/ui/primitives";
import { StarRating } from "@/components/ui/star-rating";
import { getFeed, getProfileById } from "@/features/app/selectors";
import { useAppState } from "@/features/app/store";
import { getGameById } from "@/lib/catalog";
import { timeAgo } from "@/lib/utils";
import type { ActivityType, Game } from "@/types";

const VERB: Record<ActivityType, { text: string; icon: typeof Plus }> = {
  added_to_library: { text: "wants to play", icon: BookMarked },
  started_playing: { text: "started playing", icon: PlayCircle },
  completed: { text: "completed", icon: CheckCircle2 },
  published_review: { text: "reviewed", icon: PenLine },
};

function ActivityFeed() {
  const state = useAppState();
  const feed = getFeed(state, state.currentUserId, 10);
  if (state.loads.bootstrap !== "ready") {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }
  if (!feed.length) {
    return (
      <EmptyState
        icon={<Users />}
        title="No activity yet"
        description="Follow other players to see what they're playing."
      />
    );
  }
  return (
    <ol className="space-y-1">
      {feed.map((a) => {
        const user = getProfileById(state, a.userId);
        const game = getGameById(a.gameId);
        if (!user || !game) return null;
        const { text, icon: Icon } = VERB[a.type];
        const review = a.reviewId ? state.reviews.find((r) => r.id === a.reviewId) : undefined;
        const isMe = user.id === state.currentUserId;
        return (
          <li key={a.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-bg-subtle">
            <Link href={`/users/${user.username}`} aria-label={user.displayName}>
              <Avatar profile={user} size="sm" />
            </Link>
            <p className="min-w-0 flex-1 text-sm text-muted">
              <Link href={`/users/${user.username}`} className="font-medium text-fg hover:text-accent">
                {isMe ? "You" : user.displayName}
              </Link>{" "}
              <Icon className="inline h-3.5 w-3.5 -translate-y-px text-faint" aria-hidden />{" "}
              {isMe && a.type === "added_to_library" ? "want to play" : text}{" "}
              <Link href={`/games/${game.slug}`} className="font-medium text-fg hover:text-accent">
                {game.title}
              </Link>
              {review?.rating ? <StarRating value={review.rating} size="xs" className="ml-2 align-middle" /> : null}
              <span className="block text-xs text-faint">
                <time dateTime={a.createdAt}>{timeAgo(a.createdAt)}</time>
              </span>
            </p>
            <Link href={`/games/${game.slug}`} className="w-9 shrink-0" tabIndex={-1} aria-hidden>
              <GameCover game={game} showTitle={false} />
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

const HERO_POINTS = [
  { icon: Gamepad2, label: "Track" },
  { icon: NotebookPen, label: "Log" },
  { icon: ListChecks, label: "Curate" },
  { icon: Users, label: "Share" },
];

function Hero({ covers }: { covers: Game[] }) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <Container className="grid items-center gap-10 py-14 md:grid-cols-[1.1fr_1fr] md:py-20">
        <div>
          <p className="text-sm font-medium text-accent">Your games. Your story.</p>
          <h1 className="mt-3 text-4xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-5xl">
            The diary for everything you play.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted">
            Track what you&apos;re playing, remember every playthrough, rate and review games, and discover new
            favorites through friends.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/sign-up" size="lg">
              Create your diary
            </ButtonLink>
            <ButtonLink href="/games" size="lg" variant="secondary">
              Browse games
            </ButtonLink>
          </div>
          <ul className="mt-10 grid max-w-lg grid-cols-2 gap-4 text-sm text-muted sm:grid-cols-4">
            {HERO_POINTS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-accent" /> {label}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative hidden md:block" aria-hidden>
          <div className="grid rotate-[-6deg] grid-cols-3 gap-3">
            {covers.slice(0, 9).map((g, i) => (
              <GameCover key={g.id} game={g} className={i % 3 === 1 ? "translate-y-6" : ""} />
            ))}
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-bg/60" />
        </div>
      </Container>
    </section>
  );
}

export function HomeView({ recent }: { recent: Game[] }) {
  const state = useAppState();
  const signedIn = Boolean(state.currentUserId);
  const me = state.currentUserId ? getProfileById(state, state.currentUserId) : null;
  const recentReviews = [...state.reviews]
    .filter((r) => r.body)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3);

  return (
    <>
      {state.authReady && !signedIn ? <Hero covers={recent} /> : null}
      <Container className="space-y-14 pt-10">
        {me ? (
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Welcome back, {me.displayName.split(" ")[0]}.
            </h1>
            <p className="mt-1 text-muted">Here&apos;s what&apos;s happening with you and the people you follow.</p>
          </div>
        ) : null}

        <section aria-labelledby="new-heading">
          <SectionHeader id="new-heading" title="Featured new releases" href="/games" />
          <GameGrid>
            {recent.slice(0, 6).map((g, i) => (
              <GameCard key={g.id} game={g} className={i === 4 ? "md:max-lg:hidden" : i === 5 ? "md:max-xl:hidden" : undefined} />
            ))}
          </GameGrid>
        </section>

        <div className="grid gap-14 lg:grid-cols-[1.2fr_1fr]">
          <section aria-labelledby="activity-heading">
            <SectionHeader id="activity-heading" title={signedIn ? "Friends' activity" : "Community activity"} />
            <ActivityFeed />
          </section>
          <section aria-labelledby="home-reviews-heading">
            <SectionHeader id="home-reviews-heading" title="Recent reviews" href={signedIn ? "/reviews" : undefined} />
            {state.loads.bootstrap !== "ready" ? (
              <Skeleton className="h-40 w-full" />
            ) : recentReviews.length ? (
              recentReviews.map((r) => {
                const g = getGameById(r.gameId);
                return g ? (
                  <ReviewCard key={r.id} review={r} game={g} author={getProfileById(state, r.userId)} showAuthor />
                ) : null;
              })
            ) : (
              <p className="text-sm text-muted">No reviews yet — open a game you&apos;ve played and write the first one.</p>
            )}
          </section>
        </div>

        {signedIn ? (
          <div className="flex flex-wrap gap-3 rounded-[var(--radius-card)] border border-border bg-bg-subtle p-5">
            <p className="w-full text-sm text-muted sm:w-auto sm:flex-1 sm:self-center">Jump back in</p>
            <ButtonLink href="/library" variant="secondary" size="sm">
              Library
            </ButtonLink>
            <ButtonLink href="/library/wishlist" variant="secondary" size="sm">
              Wishlist
            </ButtonLink>
            <ButtonLink href="/lists/new" variant="secondary" size="sm">
              New list
            </ButtonLink>
          </div>
        ) : null}
      </Container>
    </>
  );
}
