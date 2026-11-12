"use client";

import { SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { GameCover } from "@/components/games/game-cover";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { SectionHeader } from "@/components/ui/primitives";
import { StarRating } from "@/components/ui/star-rating";
import { getReviewsByUser } from "@/features/app/selectors";
import { useAppState } from "@/features/app/store";
import {
  arrangeRatedGames,
  DEFAULT_RATED_OPTIONS,
  RATED_SORTS,
  type RatedGame,
  ratedFacets,
  type RatedOptions,
  type RatedSort,
  RATING_FILTERS,
  type RatingFilter,
} from "@/lib/rated-games";
import { formatShortDate } from "@/lib/utils";
import type { ID } from "@/types";
import { useLocale, useT } from "@/i18n/client";
import { genreName } from "@/i18n/genres";

const PAGE = 12;

/** Every game this user rated, with sorting and filters. Works on any profile. */
export function RatedGames({ userId }: { userId: ID }) {
  const t = useT();
  const locale = useLocale();
  const state = useAppState();
  const ids = { sort: useId(), rating: useId(), genre: useId(), platform: useId() };
  const [options, setOptions] = useState<RatedOptions>(DEFAULT_RATED_OPTIONS);
  const [shown, setShown] = useState(PAGE);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const all = useMemo<RatedGame[]>(
    () =>
      getReviewsByUser(state, userId).flatMap((review) => {
        const game = state.games[review.gameId];
        return game && review.rating !== null ? [{ game, review: { ...review, rating: review.rating } }] : [];
      }),
    [state, userId],
  );
  const facets = useMemo(() => ratedFacets(all), [all]);
  const arranged = useMemo(() => arrangeRatedGames(all, options), [all, options]);
  const filtered = options.rating !== "any" || options.genre !== null || options.platform !== null;

  function update(patch: Partial<RatedOptions>) {
    setOptions((o) => ({ ...o, ...patch }));
    setShown(PAGE);
  }

  return (
    <section aria-labelledby="ratings-heading">
      <SectionHeader id="ratings-heading" title={t.ratings.title} count={all.length} />
      {all.length === 0 ? (
        <p className="text-sm text-muted">{t.ratings.none}</p>
      ) : (
        <>
          <div className="mb-5 flex flex-wrap items-end gap-2">
            <div>
              <label htmlFor={ids.sort} className="mb-1 block text-xs font-medium text-muted">
                {t.ratings.sortBy}
              </label>
              <Select
                id={ids.sort}
                value={options.sort}
                onChange={(e) => update({ sort: e.target.value as RatedSort })}
                className="w-auto"
              >
                {(Object.keys(RATED_SORTS) as RatedSort[]).map((value) => (
                  <option key={value} value={value}>
                    {t.ratings.sorts[value]}
                  </option>
                ))}
              </Select>
            </div>
            <Button
              variant={filtered ? "primary" : "secondary"}
              size="sm"
              className="h-10"
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen((v) => !v)}
            >
              <SlidersHorizontal className="h-4 w-4" /> {t.ratings.filters}
              {filtered ? t.ratings.filtersOn : ""}
            </Button>
            {filtered ? (
              <Button variant="ghost" size="sm" className="h-10" onClick={() => update({ rating: "any", genre: null, platform: null })}>
                {t.ratings.clear}
              </Button>
            ) : null}
          </div>

          {filtersOpen ? (
            <div className="mb-6 grid gap-3 rounded-[var(--radius-card)] border border-border bg-bg-subtle p-4 sm:grid-cols-3">
              <div>
                <label htmlFor={ids.rating} className="mb-1 block text-xs font-medium text-muted">
                  {t.ratings.rating}
                </label>
                <Select id={ids.rating} value={options.rating} onChange={(e) => update({ rating: e.target.value as RatingFilter })}>
                  {(Object.keys(RATING_FILTERS) as RatingFilter[]).map((value) => (
                    <option key={value} value={value}>
                      {t.ratings.ratingFilters[value]}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label htmlFor={ids.genre} className="mb-1 block text-xs font-medium text-muted">
                  {t.ratings.genre}
                </label>
                <Select id={ids.genre} value={options.genre ?? ""} onChange={(e) => update({ genre: e.target.value || null })}>
                  <option value="">{t.ratings.allGenres}</option>
                  {facets.genres.map((g) => (
                    <option key={g} value={g}>
                      {genreName(g, locale)}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label htmlFor={ids.platform} className="mb-1 block text-xs font-medium text-muted">
                  {t.ratings.platform}
                </label>
                <Select
                  id={ids.platform}
                  value={options.platform ?? ""}
                  onChange={(e) => update({ platform: e.target.value || null })}
                >
                  <option value="">{t.ratings.allPlatforms}</option>
                  {facets.platforms.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          ) : null}

          {arranged.length === 0 ? (
            <p className="text-sm text-muted">{t.ratings.noMatch}</p>
          ) : (
            <ul className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-6">
              {arranged.slice(0, shown).map(({ game: g, review: r }) => (
                <li key={r.id}>
                  <Link href={`/games/${g.slug}`} className="group block">
                    <GameCover game={g} showTitle={false} className="transition group-hover:ring-2 group-hover:ring-accent/60" />
                    <p className="mt-2 truncate text-sm font-medium group-hover:text-accent">{g.title}</p>
                  </Link>
                  <StarRating value={r.rating} size="xs" className="mt-1" />
                  <p className="mt-0.5 text-xs text-faint">
                    <time dateTime={r.updatedAt}>{formatShortDate(r.updatedAt, locale)}</time>
                  </p>
                </li>
              ))}
            </ul>
          )}
          {arranged.length > shown ? (
            <div className="mt-6 text-center">
              <Button variant="secondary" size="sm" onClick={() => setShown((n) => n + PAGE * 2)}>
                {t.ratings.showMore(arranged.length - shown)}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
