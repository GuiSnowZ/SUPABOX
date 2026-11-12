"use client";

import { ArrowLeft, Loader2, Plus, Search } from "lucide-react";
import { useId, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/form";
import { useAppState } from "@/features/app/store";
import { closeQuickAdd, openQuickAdd, promptSignIn, useUI } from "@/features/app/ui-store";
import { useGameSearch } from "@/hooks/use-game-search";
import { isReleasedOn, todayIso } from "@/lib/catalog/rows";
import { cn, releaseYear } from "@/lib/utils";
import type { Game } from "@/types";
import { useLocale, useT } from "@/i18n/client";
import { GameCover } from "./game-cover";
import { DiaryForm } from "./game-user-panel";

/** Open quick add, or ask a signed-out visitor to sign in first. */
export function useQuickAdd() {
  const t = useT();
  const state = useAppState();
  return () => {
    if (!state.authReady) return;
    if (!state.currentUserId) return promptSignIn(t.quickAdd.signIn);
    openQuickAdd();
  };
}

/** The "+" button. `variant="tab"` is the raised centre button of the mobile tab bar. */
export function QuickAddButton({ variant = "inline", className }: { variant?: "inline" | "tab"; className?: string }) {
  const t = useT();
  const open = useQuickAdd();
  if (variant === "tab") {
    return (
      <button
        type="button"
        onClick={open}
        aria-label={t.nav.addGame}
        className={cn("flex h-16 w-full items-center justify-center", className)}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-fg shadow-lg shadow-accent/30 transition active:scale-95">
          <Plus className="h-6 w-6" strokeWidth={2.6} />
        </span>
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={open}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-full bg-accent pr-4 pl-3 text-sm font-semibold text-accent-fg shadow-lg shadow-accent/20 transition hover:brightness-110 active:scale-[0.98]",
        className,
      )}
    >
      <Plus className="h-5 w-5" strokeWidth={2.6} /> {t.quickAdd.button}
    </button>
  );
}

function SearchStep({ onPick }: { onPick: (game: Game) => void }) {
  const t = useT();
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const inputId = useId();
  const search = useGameSearch(query);
  const today = todayIso();
  const results = query.trim().length >= 2 ? search.games.slice(0, 12) : [];

  return (
    <div>
      <label htmlFor={inputId} className="sr-only">
        {t.quickAdd.searchLabel}
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-faint" />
        <Input
          id={inputId}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.quickAdd.placeholder}
          className="pl-9"
          autoComplete="off"
          data-autofocus
        />
      </div>
      <ul className="mt-3 min-h-40 space-y-0.5">
        {query.trim().length < 2 ? (
          <li className="py-6 text-center text-sm text-muted">{t.quickAdd.typeHint}</li>
        ) : search.status === "error" ? (
          <li className="py-6 text-center text-sm text-danger">{search.error}</li>
        ) : results.length === 0 ? (
          <li className="flex items-center justify-center gap-2 py-6 text-sm text-muted">
            {search.status === "done" ? (
              <>{t.search.noMatch(query)}</>
            ) : (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> {t.search.searching}
              </>
            )}
          </li>
        ) : (
          results.map((g) => {
            const released = isReleasedOn(g, today);
            return (
              <li key={g.id}>
                <button
                  type="button"
                  disabled={!released}
                  onClick={() => onPick(g)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-surface disabled:cursor-default disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  <GameCover game={g} showTitle={false} className="w-10 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-fg">{g.title}</span>
                    <span className="block text-xs text-faint">
                      {released ? releaseYear(g.releaseDate, locale) : t.quickAdd.notReleased}
                      {g.developer && !g.developer.startsWith("Unknown") ? ` · ${g.developer}` : ""}
                    </span>
                  </span>
                  {released ? <Plus className="h-4 w-4 text-muted" /> : null}
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

/** Quick add: search a game, then log it in the Diary as just started / playing. */
export function QuickAddDialog() {
  const t = useT();
  const locale = useLocale();
  const { quickAddOpen } = useUI();
  const [game, setGame] = useState<Game | null>(null);

  function close() {
    setGame(null);
    closeQuickAdd();
  }

  return (
    <Dialog
      open={quickAddOpen}
      onClose={close}
      title={game ? game.title : t.quickAdd.button}
      description={game ? t.quickAdd.logIt : t.quickAdd.whatPlaying}
    >
      {game ? (
        <div className="space-y-5">
          <button
            type="button"
            onClick={() => setGame(null)}
            className="flex items-center gap-1.5 text-sm text-muted hover:text-fg"
          >
            <ArrowLeft className="h-4 w-4" /> {t.quickAdd.chooseAnother}
          </button>
          <div className="flex items-center gap-3">
            <GameCover game={game} showTitle={false} className="w-12 shrink-0" />
            <div className="min-w-0">
              <p className="truncate font-medium">{game.title}</p>
              <p className="text-xs text-faint">{releaseYear(game.releaseDate, locale)}</p>
            </div>
          </div>
          <DiaryForm key={game.id} game={game} quick onDone={close} />
        </div>
      ) : (
        <SearchStep onPick={setGame} />
      )}
    </Dialog>
  );
}
