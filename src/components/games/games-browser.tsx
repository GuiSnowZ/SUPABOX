"use client";

import { AlertTriangle, SearchX, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TodaysReleases } from "./todays-releases";
import { GameCard, GameGrid, GameGridSkeleton } from "@/components/games/game-card";
import { RegisterGames } from "@/components/games/register-games";
import { Input } from "@/components/ui/form";
import { EmptyState, SectionHeader } from "@/components/ui/primitives";
import { useGameSearch } from "@/hooks/use-game-search";

import type { Game } from "@/types";
import { useT } from "@/i18n/client";

/**
 * Games discovery: search + Recently Released + Out Today + Coming Soon.
 * Sections are server-rendered and passed in; search goes to /api/games/search
 * (our catalog first, then IGDB).
 */
export function GamesBrowser({ recent, upcoming, today = [] }: { recent: Game[]; upcoming: Game[]; today?: Game[] }) {
  const t = useT();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Header search icon links to /games#search — focus the field.
  useEffect(() => {
    const focusIfHash = () => window.location.hash === "#search" && inputRef.current?.focus();
    focusIfHash();
    window.addEventListener("hashchange", focusIfHash);
    return () => window.removeEventListener("hashchange", focusIfHash);
  }, []);

  const search = useGameSearch(query);
  const searching = query.trim().length >= 2;
  const results = search.games;

  return (
    <>
      <RegisterGames games={[...recent, ...today, ...upcoming]} />
      <div id="search" className="relative mb-10 max-w-xl scroll-mt-24">
        <label htmlFor="games-search" className="sr-only">
          {t.common.searchGames}
        </label>
        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-faint" />
        <Input
          ref={inputRef}
          id="games-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && setQuery("")}
          placeholder={t.games.searchPlaceholder}
          className="h-12 rounded-xl pr-10 pl-10 text-base"
          autoComplete="off"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            aria-label={t.games.clearSearch}
            className="absolute top-1/2 right-3 -translate-y-1/2 rounded p-1 text-faint hover:text-fg"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {searching ? (
        <section aria-labelledby="results-heading" aria-live="polite" aria-busy={search.status === "loading"}>
          <SectionHeader
            id="results-heading"
            title={t.games.resultsFor(query.trim())}
            count={search.status === "done" ? results.length : undefined}
          />
          {search.status === "error" ? (
            <EmptyState icon={<AlertTriangle />} title={t.games.searchUnavailable} description={search.error} />
          ) : results.length === 0 && search.status !== "done" ? (
            <GameGridSkeleton count={6} />
          ) : results.length ? (
            <GameGrid>
              {results.map((g) => (
                <GameCard key={g.id} game={g} />
              ))}
            </GameGrid>
          ) : (
            <EmptyState
              icon={<SearchX />}
              title={t.games.noResults}
              description={t.games.noResultsHint}
            />
          )}
        </section>
      ) : (
        <div className="space-y-14">
          <section aria-labelledby="recent-heading">
            <SectionHeader id="recent-heading" title={t.games.recentlyReleased} href="/games/new-releases" />
            <p className="-mt-2 mb-5 text-xs text-faint">{t.games.recentHint}</p>
            {recent.length ? (
              <GameGrid>
                {recent.map((g) => (
                  <GameCard key={g.id} game={g} />
                ))}
              </GameGrid>
            ) : (
              <EmptyState
                title={t.games.noRecent}
                description={t.games.noRecentHint}
              />
            )}
          </section>
          <TodaysReleases games={today} />
          {upcoming.length ? (
            <section aria-labelledby="upcoming-heading">
              <SectionHeader id="upcoming-heading" title={t.games.comingSoon} href="/games/coming-soon" />
              <p className="-mt-2 mb-5 text-xs text-faint">{t.games.comingSoonHint}</p>
              <GameGrid>
                {upcoming.map((g) => (
                  <GameCard key={g.id} game={g} />
                ))}
              </GameGrid>
              <p className="mt-4 text-xs text-faint">
                {t.games.upcomingCount(upcoming.length)}
              </p>
            </section>
          ) : null}
        </div>
      )}
    </>
  );
}
