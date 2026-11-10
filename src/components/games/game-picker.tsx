"use client";

import { Loader2, Plus, Search } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { Input } from "@/components/ui/form";
import { useGameSearch } from "@/hooks/use-game-search";
import { releaseYear } from "@/lib/utils";
import type { Game, ID } from "@/types";
import { GameCover } from "./game-cover";

/** Search the catalog and pick a game. Already-picked games are marked as added. */
export function GamePicker({
  onPick,
  excludeIds = [],
  placeholder = "Search games to add…",
  disabled = false,
}: {
  onPick: (game: Game) => void;
  excludeIds?: ID[];
  placeholder?: string;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const inputId = useId();
  const listId = useId();
  const excluded = useMemo(() => new Set(excludeIds), [excludeIds]);
  const search = useGameSearch(query);
  const results = search.games.slice(0, 10);

  return (
    <div className="relative">
      <label htmlFor={inputId} className="sr-only">
        {placeholder}
      </label>
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-faint" />
      <Input
        id={inputId}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
        autoComplete="off"
        disabled={disabled}
        aria-controls={listId}
        onKeyDown={(e) => e.key === "Escape" && setQuery("")}
      />
      {query.trim() ? (
        <ul
          id={listId}
          className="animate-fade-in absolute z-20 mt-1.5 max-h-80 w-full overflow-auto rounded-xl border border-border bg-bg-subtle p-1 shadow-xl shadow-black/40"
        >
          {search.status === "error" ? (
            <li className="px-3 py-4 text-center text-sm text-danger">{search.error}</li>
          ) : results.length === 0 ? (
            <li className="flex items-center justify-center gap-2 px-3 py-4 text-center text-sm text-muted">
              {search.status === "done" ? (
                <>No games match “{query}”.</>
              ) : query.trim().length < 2 ? (
                <>Keep typing…</>
              ) : (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Searching…
                </>
              )}
            </li>
          ) : (
            results.map((g) => {
              const added = excluded.has(g.id);
              return (
                <li key={g.id}>
                  <button
                    type="button"
                    disabled={added}
                    onClick={() => {
                      onPick(g);
                      setQuery("");
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-surface disabled:cursor-default disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    <GameCover game={g} showTitle={false} className="w-8 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-fg">{g.title}</span>
                      <span className="block text-xs text-faint">
                        {releaseYear(g.releaseDate)}
                        {g.developer && !g.developer.startsWith("Unknown") ? ` · ${g.developer}` : ""}
                      </span>
                    </span>
                    <span className="text-xs text-muted">{added ? "Added" : <Plus className="h-4 w-4" />}</span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
