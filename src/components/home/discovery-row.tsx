"use client";

import { ArrowRight, ChevronLeft, ChevronRight, Flame, Info, Sparkles, Star, Users } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useEffect, useRef } from "react";
import { GameCard, GameGrid } from "@/components/games/game-card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/primitives";
import { getProfileById } from "@/features/app/selectors";
import { getAppState, registerGames, useAppState } from "@/features/app/store";
import type { Game } from "@/types";
import { genreName } from "@/i18n/genres";
import type { DiscoveryItem } from "@/lib/discovery";
import { formatRating } from "@/lib/ratings";
import { useLocale, useT } from "@/i18n/client";

/**
 * Make the row's games known to the app (for wishlist buttons etc.). Only adds
 * games that aren't cached yet: the same game can arrive as separate copies in
 * several rows, and re-registering each copy would make the rows fight forever.
 */
function useKnownGames(games: Game[]) {
  const ids = games.map((g) => g.id).join(",");
  useEffect(() => {
    const cached = getAppState().games;
    const missing = games.filter((g) => !cached[g.id]);
    if (missing.length) registerGames(missing);
    // Keyed by the ids: a new array with the same games needs nothing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);
}

/** The small line under a card saying why the game is in the row. */
export function DiscoveryFooter({ item }: { item: DiscoveryItem }) {
  const t = useT();
  const locale = useLocale();
  const state = useAppState();
  const cls = "flex min-w-0 items-center gap-1 text-xs text-muted";
  if (item.people) {
    return (
      <p className={cls}>
        <Flame className="h-3.5 w-3.5 shrink-0 text-[#ff8a3d]" />
        <span className="truncate">{t.discover.peopleThisWeek(item.people)}</span>
      </p>
    );
  }
  if (item.average != null && item.ratings) {
    return (
      <p className={cls}>
        <Star className="h-3.5 w-3.5 shrink-0 fill-current text-[#f5c518]" />
        <span className="truncate">{t.discover.communityRating(formatRating(Math.round(item.average * 10) / 10), item.ratings)}</span>
      </p>
    );
  }
  if (item.because) {
    return (
      <p className={cls}>
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-accent" />
        <span className="truncate">{t.discover.forYou.because(genreName(item.because, locale))}</span>
      </p>
    );
  }
  if (item.friendIds?.length) {
    const people = item.friendIds.slice(0, 3).flatMap((id) => {
      const p = getProfileById(state, id);
      return p ? [p] : [];
    });
    return (
      <p className={cls}>
        {people.length ? (
          <span className="flex shrink-0 -space-x-1.5">
            {people.map((p) => (
              <Avatar key={p.id} profile={p} size="xs" className="ring-2 ring-bg" />
            ))}
          </span>
        ) : (
          <Users className="h-3.5 w-3.5 shrink-0" />
        )}
        <span className="truncate">{t.discover.friends.played(item.friendIds.length)}</span>
      </p>
    );
  }
  return null;
}

function RowSkeleton() {
  return (
    <ul className="flex gap-4 overflow-hidden" aria-hidden>
      {Array.from({ length: 4 }, (_, i) => (
        <li key={i} className="w-[42%] shrink-0 sm:w-[30%] md:w-[calc((100%-3rem)/4)]">
          <Skeleton className="aspect-[3/4] w-full rounded-[var(--radius-cover)]" />
          <Skeleton className="mt-2.5 h-4 w-3/4" />
        </li>
      ))}
    </ul>
  );
}

/**
 * One Home discovery row: title, short description, "View all →" and a row of
 * game cards — four in view on desktop, swipeable on phones.
 */
export function DiscoveryRow({
  id,
  title,
  description,
  note,
  how,
  href,
  items,
  empty,
  error,
  limit = 12,
}: {
  id: string;
  title: string;
  description?: string;
  /** Where the data comes from, when it isn't (only) Supabox's own community. */
  note?: string | null;
  /** Tooltip explaining the ranking. */
  how?: string;
  href?: string;
  /** null while loading. */
  items: DiscoveryItem[] | null;
  empty?: ReactNode;
  error?: boolean;
  limit?: number;
}) {
  const t = useT();
  const scroller = useRef<HTMLUListElement>(null);
  const shown = items?.slice(0, limit) ?? null;
  useKnownGames(shown?.map((i) => i.game) ?? []);
  const scroll = (dir: 1 | -1) => scroller.current?.scrollBy({ left: dir * scroller.current.clientWidth * 0.9, behavior: "smooth" });

  return (
    <section aria-labelledby={`${id}-heading`} className="min-w-0">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 id={`${id}-heading`} className="text-lg font-semibold tracking-tight sm:text-xl">
            {title}
          </h2>
          {description ? <p className="mt-0.5 text-sm text-muted">{description}</p> : null}
          {note ? (
            <p className="mt-1 flex items-start gap-1.5 text-xs text-faint">
              <Info className="mt-px h-3.5 w-3.5 shrink-0" />
              <span>{note}</span>
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {shown && shown.length > 4 ? (
            <span className="hidden gap-1 md:flex">
              <Button variant="ghost" size="icon" onClick={() => scroll(-1)} aria-label={t.discover.scrollLeft}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => scroll(1)} aria-label={t.discover.scrollRight}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </span>
          ) : null}
          {href && (shown?.length ?? 0) > 0 ? (
            <Link
              href={href}
              title={how}
              className="inline-flex h-10 items-center gap-1 rounded-lg px-2 text-sm font-medium text-accent hover:bg-surface"
            >
              {t.discover.viewAll} <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </div>
      {error ? (
        <p className="text-sm text-muted">{t.discover.loadError}</p>
      ) : shown === null ? (
        <RowSkeleton />
      ) : shown.length === 0 ? (
        empty ?? null
      ) : (
        <>
          <ul
            ref={scroller}
            className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 md:mx-0 md:scroll-px-0 md:px-0 [&::-webkit-scrollbar]:hidden"
          >
            {shown.map((item) => (
              <li key={item.game.id} className="w-[42%] shrink-0 snap-start sm:w-[30%] md:w-[calc((100%-3rem)/4)]">
                <GameCard game={item.game} footer={<DiscoveryFooter item={item} />} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

/** Full-page grid for a "View all" page, optionally numbered. */
export function DiscoveryGrid({ items, startRank }: { items: DiscoveryItem[]; startRank?: number }) {
  useKnownGames(items.map((i) => i.game));
  return (
    <>
      <GameGrid>
        {items.map((item, i) => (
          <div key={item.game.id} className="relative">
            <GameCard game={item.game} footer={<DiscoveryFooter item={item} />} />
            {startRank != null ? (
              <span className="pointer-events-none absolute top-2 left-2 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-semibold text-white tabular-nums backdrop-blur">
                {startRank + i}
              </span>
            ) : null}
          </div>
        ))}
      </GameGrid>
    </>
  );
}

