"use client";

import { AlertTriangle, SearchX, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { GameCard, GameGrid, GameGridSkeleton } from "@/components/games/game-card";
import { RegisterGames } from "@/components/games/register-games";
import { Input } from "@/components/ui/form";
import { EmptyState, SectionHeader } from "@/components/ui/primitives";
import { useGameSearch } from "@/hooks/use-game-search";
import { useProfileSearch } from "@/hooks/use-profile-search";
import { Avatar } from "@/components/ui/avatar";

import type { Game } from "@/types";
import { useT } from "@/i18n/client";

export interface ExploreLink {
  href: string;
  label: string;
}

/**
 * The Search tab: search first (our catalog, then IGDB, via /api/games/search),
 * then links to explore the catalog and the upcoming games. What's new and
 * trending lives on the Home, so it isn't repeated here.
 */
export function GamesBrowser({ upcoming, explore }: { upcoming: Game[]; explore: Array<{ group: string; links: ExploreLink[] }> }) {
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
  const people = useProfileSearch(query);
  const searching = query.trim().length >= 2;
  const results = search.games;

  return (
    <>
      <RegisterGames games={upcoming} />
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

      {searching && people.profiles.length ? (
        <section aria-labelledby="people-heading" className="mb-10">
          <SectionHeader id="people-heading" title={t.games.people} count={people.profiles.length} />
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {people.profiles.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/users/${p.username}`}
                  className="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-bg-subtle px-3 py-2 transition-colors hover:border-accent/60"
                >
                  <Avatar profile={p} size="md" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-fg">{p.displayName}</span>
                    <span className="block truncate text-xs text-muted">@{p.username}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
          <section aria-labelledby="explore-heading">
            <SectionHeader id="explore-heading" title={t.games.explore} />
            <div className="space-y-5">
              {explore.map((g) => (
                <div key={g.group}>
                  <h3 className="mb-2 text-xs font-semibold tracking-[0.12em] text-muted uppercase">{g.group}</h3>
                  <ul className="flex flex-wrap gap-2">
                    {g.links.map((l) => (
                      <li key={l.href}>
                        <Link
                          href={l.href}
                          className="inline-flex min-h-10 items-center rounded-full border border-border bg-bg-subtle px-4 text-sm text-fg transition-colors hover:border-accent/60 hover:text-accent"
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
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
