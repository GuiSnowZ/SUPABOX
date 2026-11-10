"use client";

import { SearchX, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { GameCard, GameGrid } from "@/components/games/game-card";
import { Input } from "@/components/ui/form";
import { EmptyState, SectionHeader } from "@/components/ui/primitives";
import { getAllGames } from "@/lib/catalog";
import { matchesQuery, sortByReleaseDesc } from "@/lib/catalog/provider";
import { pluralize } from "@/lib/utils";
import type { Game } from "@/types";

/**
 * Games discovery: search + Recently Released + Coming Soon.
 * Sections are server-rendered and passed in; search filters the (mock)
 * catalog on the client. Phase 3 moves search to the catalog provider API.
 */
export function GamesBrowser({ recent, upcoming }: { recent: Game[]; upcoming: Game[] }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Header search icon links to /games#search — focus the field.
  useEffect(() => {
    const focusIfHash = () => window.location.hash === "#search" && inputRef.current?.focus();
    focusIfHash();
    window.addEventListener("hashchange", focusIfHash);
    return () => window.removeEventListener("hashchange", focusIfHash);
  }, []);

  const results = useMemo(
    () => (query.trim() ? getAllGames().filter((g) => matchesQuery(g, query)).sort(sortByReleaseDesc) : null),
    [query],
  );

  return (
    <>
      <div id="search" className="relative mb-10 max-w-xl scroll-mt-24">
        <label htmlFor="games-search" className="sr-only">
          Search games
        </label>
        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-faint" />
        <Input
          ref={inputRef}
          id="games-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && setQuery("")}
          placeholder="Search by title, studio, genre or platform"
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
            aria-label="Clear search"
            className="absolute top-1/2 right-3 -translate-y-1/2 rounded p-1 text-faint hover:text-fg"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {results ? (
        <section aria-labelledby="results-heading" aria-live="polite">
          <SectionHeader id="results-heading" title={`Results for “${query.trim()}”`} count={results.length} />
          {results.length ? (
            <GameGrid>
              {results.map((g) => (
                <GameCard key={g.id} game={g} />
              ))}
            </GameGrid>
          ) : (
            <EmptyState
              icon={<SearchX />}
              title="No games found"
              description="Try a different title, studio or genre. The prototype catalog has a small set of fictional games."
            />
          )}
        </section>
      ) : (
        <div className="space-y-14">
          <section aria-labelledby="recent-heading">
            <SectionHeader id="recent-heading" title="Recently Released" count={recent.length} />
            {recent.length ? (
              <GameGrid>
                {recent.map((g) => (
                  <GameCard key={g.id} game={g} />
                ))}
              </GameGrid>
            ) : (
              <EmptyState title="No recent releases" description="Check back soon." />
            )}
          </section>
          {upcoming.length ? (
            <section aria-labelledby="upcoming-heading">
              <SectionHeader id="upcoming-heading" title="Coming Soon" count={upcoming.length} />
              <GameGrid>
                {upcoming.map((g) => (
                  <GameCard key={g.id} game={g} />
                ))}
              </GameGrid>
              <p className="mt-4 text-xs text-faint">
                {pluralize(upcoming.length, "upcoming game")} — save them to your wishlist to keep track.
              </p>
            </section>
          ) : null}
        </div>
      )}
    </>
  );
}
