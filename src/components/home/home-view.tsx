"use client";

import { BarChart3, BookMarked, CalendarDays, CheckCircle2, Gamepad2, ListChecks, NotebookPen, PenLine, PlayCircle, Plus, Star, Users } from "lucide-react";
import Link from "next/link";
import { GameCard, GameGrid } from "@/components/games/game-card";
import { QuickAddButton } from "@/components/games/quick-add";
import { TodaysReleases } from "@/components/games/todays-releases";
import { GameCover } from "@/components/games/game-cover";
import { ReviewCard } from "@/components/reviews/review-card";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { Container, EmptyState, SectionHeader, Skeleton } from "@/components/ui/primitives";
import { StarRating } from "@/components/ui/star-rating";
import { getFeed, getProfileById } from "@/features/app/selectors";
import { useAppState } from "@/features/app/store";
import { cn, timeAgo } from "@/lib/utils";
import type { ActivityType, Game } from "@/types";
import { useLocale, useT } from "@/i18n/client";

const VERB_ICON: Record<ActivityType, typeof Plus> = {
  added_to_library: BookMarked,
  started_playing: PlayCircle,
  completed: CheckCircle2,
  published_review: PenLine,
};

function ActivityFeed() {
  const t = useT();
  const locale = useLocale();
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
        title={t.home.noActivity}
        description={t.home.noActivityHint}
      />
    );
  }
  return (
    <ol className="space-y-1">
      {feed.map((a) => {
        const user = getProfileById(state, a.userId);
        const game = state.games[a.gameId];
        if (!user || !game) return null;
        const Icon = VERB_ICON[a.type];
        const review = a.reviewId ? state.reviews.find((r) => r.id === a.reviewId) : undefined;
        const isMe = user.id === state.currentUserId;
        return (
          <li key={a.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-bg-subtle">
            <Link href={`/users/${user.username}`} aria-label={user.displayName}>
              <Avatar profile={user} size="sm" />
            </Link>
            <p className="min-w-0 flex-1 text-sm text-muted">
              <Link href={`/users/${user.username}`} className="font-medium text-fg hover:text-accent">
                {isMe ? t.home.you : user.displayName}
              </Link>{" "}
              <Icon className="inline h-3.5 w-3.5 -translate-y-px text-faint" aria-hidden />{" "}
              {isMe && a.type === "added_to_library" ? t.home.youWantToPlay : t.home.verbs[a.type]}{" "}
              <Link href={`/games/${game.slug}`} className="font-medium text-fg hover:text-accent">
                {game.title}
              </Link>
              {review?.rating ? <StarRating value={review.rating} size="xs" className="ml-2 align-middle" /> : null}
              <span className="block text-xs text-faint">
                <time dateTime={a.createdAt}>{timeAgo(a.createdAt, locale)}</time>
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
  { icon: Gamepad2, key: "track" },
  { icon: NotebookPen, key: "log" },
  { icon: ListChecks, key: "curate" },
  { icon: Users, key: "share" },
] as const;

const FEATURES = [
  { icon: CalendarDays, key: "diary" },
  { icon: Star, key: "reviews" },
  { icon: ListChecks, key: "lists" },
  { icon: BarChart3, key: "stats" },
] as const;

/** For visitors: what Supabox does, and a last call to sign up. */
function Landing({ className }: { className?: string }) {
  const t = useT();
  return (
    <section aria-labelledby="landing-heading" className={cn("space-y-8", className)}>
      <div className="max-w-2xl">
        <h2 id="landing-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t.home.landingTitle}
        </h2>
        <p className="mt-2 text-muted">{t.home.landingText}</p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ icon: Icon, key }) => {
          const [title, text] = t.home.features[key];
          return (
            <li key={key} className="rounded-[var(--radius-card)] border border-border bg-bg-subtle p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-col items-start gap-4 rounded-[var(--radius-card)] border border-accent/30 bg-accent/[0.07] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-semibold">{t.home.ctaTitle}</p>
          <p className="text-sm text-muted">{t.home.ctaText}</p>
        </div>
        <ButtonLink href="/sign-up" size="lg">
          {t.home.createDiary}
        </ButtonLink>
      </div>
    </section>
  );
}

function Hero({ covers, className }: { covers: Game[]; className?: string }) {
  const t = useT();
  return (
    <section className={cn("relative overflow-hidden border-b border-border", className)}>
      <Container className="grid items-center gap-10 py-14 md:grid-cols-[1.1fr_1fr] md:py-20">
        <div>
          <p className="text-sm font-medium text-accent">{t.home.heroTagline}</p>
          <h1 className="mt-3 text-4xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-5xl">
            {t.home.heroTitle}
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted">
            {t.home.heroText}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/sign-up" size="lg">
              {t.home.createDiary}
            </ButtonLink>
            <ButtonLink href="/games" size="lg" variant="secondary">
              {t.home.browse}
            </ButtonLink>
          </div>
          <ul className="mt-10 grid max-w-lg grid-cols-2 gap-4 text-sm text-muted sm:grid-cols-4">
            {HERO_POINTS.map(({ icon: Icon, key }) => (
              <li key={key} className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-accent" /> {t.home.points[key]}
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

export function HomeView({ recent, today = [] }: { recent: Game[]; today?: Game[] }) {
  const t = useT();
  const state = useAppState();
  const signedIn = Boolean(state.currentUserId);
  const me = state.currentUserId ? getProfileById(state, state.currentUserId) : null;
  const recentReviews = [...state.reviews]
    .filter((r) => r.body)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3);

  return (
    <>
      {/* Rendered on the server too (for search engines and first paint); the
          "visitor-only" class hides it for signed-in browsers until auth is known. */}
      {!signedIn ? <Hero covers={recent} className={state.authReady ? undefined : "visitor-only"} /> : null}
      <Container className="space-y-14 pt-10">
        {me ? (
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {t.home.welcomeBack(me.displayName.split(" ")[0])}
              </h1>
              <p className="mt-1 text-muted">{t.home.welcomeHint}</p>
            </div>
            <QuickAddButton />
          </div>
        ) : null}

        <section aria-labelledby="new-heading">
          <SectionHeader id="new-heading" title={t.home.biggest} href="/games" />
          <GameGrid>
            {recent.slice(0, 6).map((g, i) => (
              <GameCard key={g.id} game={g} className={i === 4 ? "md:max-lg:hidden" : i === 5 ? "md:max-xl:hidden" : undefined} />
            ))}
          </GameGrid>
        </section>

        <TodaysReleases games={today} />

        <div className="grid gap-14 lg:grid-cols-[1.2fr_1fr]">
          <section aria-labelledby="activity-heading">
            <SectionHeader id="activity-heading" title={signedIn ? t.home.friendsActivity : t.home.communityActivity} />
            <ActivityFeed />
          </section>
          <section aria-labelledby="home-reviews-heading">
            <SectionHeader id="home-reviews-heading" title={t.home.recentReviews} href={signedIn ? "/reviews" : undefined} />
            {state.loads.bootstrap !== "ready" ? (
              <Skeleton className="h-40 w-full" />
            ) : recentReviews.length ? (
              recentReviews.map((r) => {
                const g = state.games[r.gameId];
                return g ? (
                  <ReviewCard key={r.id} review={r} game={g} author={getProfileById(state, r.userId)} showAuthor />
                ) : null;
              })
            ) : (
              <p className="text-sm text-muted">{t.home.noReviews}</p>
            )}
          </section>
        </div>

        {!signedIn ? <Landing className={state.authReady ? undefined : "visitor-only"} /> : null}

        {signedIn ? (
          <div className="flex flex-wrap gap-3 rounded-[var(--radius-card)] border border-border bg-bg-subtle p-5">
            <p className="w-full text-sm text-muted sm:w-auto sm:flex-1 sm:self-center">{t.home.jumpBack}</p>
            <ButtonLink href="/library" variant="secondary" size="sm">
              {t.nav.library}
            </ButtonLink>
            <ButtonLink href="/library/wishlist" variant="secondary" size="sm">
              {t.nav.wishlist}
            </ButtonLink>
            <ButtonLink href="/lists/new" variant="secondary" size="sm">
              {t.home.newList}
            </ButtonLink>
          </div>
        ) : null}
      </Container>
    </>
  );
}
