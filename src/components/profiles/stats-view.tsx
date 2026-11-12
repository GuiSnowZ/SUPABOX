"use client";

import { BarChart3, ChevronLeft, Share2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { GameCover } from "@/components/games/game-cover";
import { LoadError, PageSkeleton } from "@/components/layout/require-user";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Container, EmptyState, SectionHeader } from "@/components/ui/primitives";
import { StarRating } from "@/components/ui/star-rating";
import { getProfileByUsername } from "@/features/app/selectors";
import { loaders, useAppState, useLoad } from "@/features/app/store";
import { toast } from "@/features/app/ui-store";
import { activeYears, computeStats, type Ranked, type Stats } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { useLocale, useT } from "@/i18n/client";
import { genreName } from "@/i18n/genres";

const intlTag = (locale: string) => (locale === "pt-BR" ? "pt-BR" : "en-US");
/** Short month names in the page's language ("Jan", "fev."…). */
const months = (locale: string) =>
  Array.from({ length: 12 }, (_, m) =>
    new Intl.DateTimeFormat(intlTag(locale), { month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2024, m, 1))).replace(".", ""),
  );

function Tile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-bg-subtle p-4">
      <p className="text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </div>
  );
}

/**
 * Vertical bars, one series, single accent hue. Each bar has a native hover
 * tooltip and an accessible label; values are printed only on non-zero bars.
 */
function ColumnChart({
  values,
  labels,
  unit,
  title,
}: {
  values: number[];
  labels: string[];
  unit: (n: number) => string;
  title: string;
}) {
  const max = Math.max(1, ...values);
  return (
    <figure>
      <div className="flex h-40 items-end gap-1 border-b border-border sm:gap-2" role="list" aria-label={title}>
        {values.map((v, i) => {
          const text = `${labels[i]}: ${unit(v)}`;
          return (
            <div key={i} role="listitem" aria-label={text} title={text} className="group flex h-full flex-1 flex-col justify-end">
              {v > 0 ? <span className="mb-1 text-center text-[11px] text-muted tabular-nums">{v}</span> : null}
              <div
                className="rounded-t-[4px] bg-accent transition-opacity group-hover:opacity-80"
                style={{ height: v ? `${Math.max(4, (v / max) * 100)}%` : 0 }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-1 sm:gap-2" aria-hidden>
        {labels.map((l, i) => (
          <span key={i} className="flex-1 text-center text-[10px] text-faint sm:text-[11px]">
            {l}
          </span>
        ))}
      </div>
    </figure>
  );
}

/** Horizontal bars for a top-5 list (counts printed at the end of each bar). */
function RankBars({ items, empty }: { items: Ranked[]; empty: string }) {
  if (!items.length) return <p className="text-sm text-muted">{empty}</p>;
  const max = Math.max(...items.map((i) => i.count));
  return (
    <ul className="space-y-2.5">
      {items.map((i) => (
        <li key={i.name} title={`${i.name}: ${i.count}`}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-fg">{i.name}</span>
            <span className="text-muted tabular-nums">{i.count}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-surface">
            <div className="h-full rounded-full bg-accent" style={{ width: `${(i.count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function StatsBody({ stats }: { stats: Stats }) {
  const t = useT();
  const locale = useLocale();
  const fmt = new Intl.NumberFormat(intlTag(locale), { maximumFractionDigits: 1 });
  const hasAny = stats.gamesPlayed || stats.ratingsGiven || stats.completed.length;
  if (!hasAny) {
    return (
      <EmptyState
        icon={<BarChart3 />}
        title={stats.year ? t.stats.nothingIn(stats.year) : t.stats.none}
        description={t.stats.noneHint}
      />
    );
  }
  return (
    <div className="space-y-12">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Tile value={fmt.format(stats.gamesPlayed)} label={t.stats.gamesPlayed} />
        <Tile value={fmt.format(stats.completed.length)} label={t.stats.completed} />
        <Tile value={fmt.format(stats.hours)} label={t.stats.hours} />
        <Tile value={fmt.format(stats.reviewsWritten)} label={t.stats.reviewsWritten} />
        <Tile value={stats.averageRating !== null ? `${fmt.format(stats.averageRating)}★` : "—"} label={t.stats.averageRating} />
      </div>

      {stats.year ? (
        <section aria-labelledby="by-month-heading">
          <SectionHeader id="by-month-heading" title={t.stats.perMonth} />
          <ColumnChart values={stats.completedByMonth} labels={months(locale)} unit={t.stats.gamesUnit} title={t.stats.perMonth} />
        </section>
      ) : null}

      <section aria-labelledby="ratings-dist-heading">
        <SectionHeader id="ratings-dist-heading" title={t.stats.ratings} count={stats.ratingsGiven} />
        {stats.ratingsGiven ? (
          <ColumnChart
            values={stats.ratingDistribution}
            labels={["½", "1", "1½", "2", "2½", "3", "3½", "4", "4½", "5"]}
            unit={t.stats.ratingsUnit}
            title={t.stats.ratingSpread}
          />
        ) : (
          <p className="text-sm text-muted">{t.stats.noRatings}</p>
        )}
      </section>

      <div className="grid gap-12 sm:grid-cols-2">
        <section aria-labelledby="genres-heading">
          <SectionHeader id="genres-heading" title={t.stats.topGenres} />
          <RankBars items={stats.topGenres.map((g) => ({ ...g, name: genreName(g.name, locale) }))} empty={t.stats.noGenres} />
        </section>
        <section aria-labelledby="platforms-heading">
          <SectionHeader id="platforms-heading" title={t.stats.topPlatforms} />
          <RankBars items={stats.topPlatforms} empty={t.stats.noPlatforms} />
        </section>
      </div>

      {stats.topRated.length ? (
        <section aria-labelledby="top-rated-heading">
          <SectionHeader id="top-rated-heading" title={stats.year ? t.stats.highestIn(stats.year) : t.stats.highest} />
          <ol className="grid grid-cols-3 gap-4 sm:grid-cols-5">
            {stats.topRated.map(({ game, rating }, i) => (
              <li key={game.id}>
                <Link href={`/games/${game.slug}`} className="group block">
                  <div className="relative">
                    <GameCover game={game} className="transition group-hover:ring-2 group-hover:ring-accent/60" />
                    <span className="absolute top-2 left-2 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-semibold text-white">#{i + 1}</span>
                  </div>
                  <p className="mt-2 truncate text-sm font-medium group-hover:text-accent">{game.title}</p>
                </Link>
                <StarRating value={rating} size="xs" className="mt-1" />
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {stats.completed.length ? (
        <section aria-labelledby="completed-heading">
          <SectionHeader id="completed-heading" title={t.stats.completedSection} count={stats.completed.length} />
          <ul className="grid grid-cols-4 gap-3 sm:grid-cols-8">
            {stats.completed.slice(0, 48).map(({ game, date }) => (
              <li key={game.id}>
                <Link href={`/games/${game.slug}`} title={`${game.title} — ${date}`}>
                  <GameCover game={game} showTitle={false} className="transition hover:ring-2 hover:ring-accent/60" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

/** `/users/[username]/stats?year=2026`: stats for one year (the Year in Review) or all time. */
export function StatsView({ username }: { username: string }) {
  const t = useT();
  const state = useAppState();
  const router = useRouter();
  const params = useSearchParams();
  const status = useLoad(`user:${username.toLowerCase()}`, () => loaders.user(username));
  const profile = getProfileByUsername(state, username);

  const input = useMemo(
    () =>
      profile
        ? {
            games: state.games,
            userGames: state.userGames.filter((u) => u.userId === profile.id),
            reviews: state.reviews.filter((r) => r.userId === profile.id),
            sessions: state.playSessions.filter((s) => s.userId === profile.id),
          }
        : null,
    [profile, state.games, state.userGames, state.reviews, state.playSessions],
  );
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const ys = input ? activeYears(input) : [];
    return ys.includes(currentYear) ? ys : [currentYear, ...ys];
  }, [input, currentYear]);
  const yearParam = params.get("year");
  const year = yearParam === "all" ? null : Number(yearParam) || currentYear;
  const stats = useMemo(() => (input ? computeStats(input, year) : null), [input, year]);

  if (status === "error" && !profile) return <LoadError onRetry={() => void loaders.user(username)} />;
  if (!profile || !stats) {
    return status === "ready" && !profile ? (
      <Container className="py-16">
        <EmptyState title={t.profile.userNotFound} description={t.profile.userNotFoundHint(username)} />
      </Container>
    ) : (
      <PageSkeleton />
    );
  }

  // The profile can be cached before its diary has loaded: wait instead of showing "nothing yet".
  if (status !== "ready" && status !== "error") return <PageSkeleton />;

  const first = profile.displayName.split(" ")[0];
  const title = year ? t.stats.titleYear(first, year) : t.stats.titleAll(first);

  async function share() {
    const url = `${window.location.origin}/users/${profile!.username}/stats?year=${year ?? "all"}`;
    try {
      if (navigator.share) await navigator.share({ title: `${title} · Supabox`, url });
      else {
        await navigator.clipboard.writeText(url);
        toast(t.stats.linkCopied);
      }
    } catch {
      // Share sheet dismissed.
    }
  }

  return (
    <Container className="max-w-4xl">
      <nav aria-label="Breadcrumb" className="pt-6 text-sm text-muted">
        <Link href={`/users/${profile.username}`} className="inline-flex items-center gap-1 hover:text-fg">
          <ChevronLeft className="h-4 w-4" /> {profile.displayName}
        </Link>
      </nav>
      <header className="flex flex-col gap-4 pt-4 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar profile={profile} size="lg" />
          <div>
            <p className="text-xs font-semibold tracking-[0.12em] text-accent uppercase">{year ? t.stats.yearInReview : t.stats.allTime}</p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={share}>
          <Share2 className="h-4 w-4" /> {t.stats.share}
        </Button>
      </header>

      <div role="tablist" aria-label={t.stats.period} className="-mx-1 mb-8 flex gap-1 overflow-x-auto px-1 pb-1">
        {[...years.map(String), "all"].map((y) => {
          const active = (y === "all" && year === null) || Number(y) === year;
          return (
            <button
              key={y}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => router.replace(`/users/${profile.username}/stats?year=${y}`, { scroll: false })}
              className={cn(
                "h-9 shrink-0 rounded-full px-4 text-sm font-medium transition-colors",
                active ? "bg-accent text-accent-fg" : "border border-border text-muted hover:text-fg",
              )}
            >
              {y === "all" ? t.stats.allTime : y}
            </button>
          );
        })}
      </div>

      <StatsBody stats={stats} />
      <p className="mt-10 text-xs text-faint">
        {t.stats.footnote}
      </p>
    </Container>
  );
}
