"use client";

import { AlertTriangle, SearchX, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GameCard, GameGrid, GameGridSkeleton } from "@/components/games/game-card";
import { RegisterGames } from "@/components/games/register-games";
import { Input } from "@/components/ui/form";
import { EmptyState, SectionHeader } from "@/components/ui/primitives";
import { useGameSearch } from "@/hooks/use-game-search";
import { pluralize } from "@/lib/utils";
import type { Game } from "@/types";

/**
 * Games discovery: search + Recently Released + Coming Soon.
 * Sections are server-rendered and passed in; search goes to /api/games/search
 * (our catalog first, then IGDB).
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

  const search = useGameSearch(query);
  const searching = query.trim().length >= 2;
  const results = search.games;

  return (
    <>
      <RegisterGames games={[...recent, ...upcoming]} />
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
          placeholder="Search any game by title"
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

      {searching ? (
        <section aria-labelledby="results-heading" aria-live="polite" aria-busy={search.status === "loading"}>
          <SectionHeader
            id="results-heading"
            title={`Results for “${query.trim()}”`}
            count={search.status === "done" ? results.length : undefined}
          />
          {search.status === "error" ? (
            <EmptyState icon={<AlertTriangle />} title="Search is unavailable" description={search.error} />
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
              title="No games found"
              description="Try a different spelling, or the game's full title."
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
              <EmptyState
                title="No recent releases yet"
                description="The game catalog hasn't been loaded. Run the catalog sync to import games."
              />
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
