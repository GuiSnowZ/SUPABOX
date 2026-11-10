"use client";

import { useEffect, useState } from "react";
import { registerGames } from "@/features/app/store";
import type { Game } from "@/types";

export type SearchState =
  | { status: "idle"; games: [] }
  | { status: "loading"; games: Game[] }
  | { status: "done"; games: Game[] }
  | { status: "error"; games: []; error: string };

/** Debounced game search against /api/games/search. */
export function useGameSearch(query: string, delay = 300): SearchState {
  const [state, setState] = useState<SearchState>({ status: "idle", games: [] });
  const term = query.trim();

  useEffect(() => {
    if (term.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setState((s) => ({ status: "loading", games: s.games }));
      try {
        const res = await fetch(`/api/games/search?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        const json = (await res.json()) as { games?: Game[]; error?: string };
        if (!res.ok || !json.games) throw new Error(json.error ?? "Search failed.");
        registerGames(json.games);
        setState({ status: "done", games: json.games });
      } catch (e) {
        if (controller.signal.aborted) return;
        setState({ status: "error", games: [], error: e instanceof Error ? e.message : "Search failed." });
      }
    }, delay);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term, delay]);

  return term.length < 2 ? { status: "idle", games: [] } : state;
}
