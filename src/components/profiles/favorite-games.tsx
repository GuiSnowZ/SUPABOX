"use client";

import { Check, ChevronLeft, ChevronRight, Pencil, Plus, Replace, Search, X } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { GameCover } from "@/components/games/game-cover";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/form";
import { SectionHeader } from "@/components/ui/primitives";
import { StarRating } from "@/components/ui/star-rating";
import { getFavoriteEligibleGames, getUserReview } from "@/features/app/selectors";
import { toast } from "@/features/app/ui-store";
import { actions, useAppState } from "@/features/app/store";
import { cn, releaseYear } from "@/lib/utils";
import { type Game, type ID, MAX_FAVORITE_GAMES } from "@/types";

function Slot({ index, onClick }: { index: number; onClick?: () => void }) {
  const classes =
    "flex aspect-[3/4] w-full items-center justify-center rounded-[var(--radius-cover)] border border-dashed border-border text-faint";
  if (!onClick) {
    return (
      <div className={classes}>
        <span className="text-sm tabular-nums">{index + 1}</span>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Choose favorite #${index + 1}`}
      className={cn(classes, "transition hover:border-accent hover:text-accent")}
    >
      <Plus className="h-5 w-5" />
    </button>
  );
}

/**
 * Pick a favorite from your own games: only ones you've marked Completed and
 * rated are listed (the same rule the database enforces).
 */
function FavoritePicker({
  open,
  onClose,
  onPick,
  chosen,
  title,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (game: Game) => void;
  chosen: ID[];
  title: string;
}) {
  const state = useAppState();
  const [query, setQuery] = useState("");
  const inputId = useId();
  const userId = state.currentUserId;
  const eligible = userId ? getFavoriteEligibleGames(state, userId) : [];
  const q = query.trim().toLowerCase();
  const results = q ? eligible.filter((g) => g.title.toLowerCase().includes(q)) : eligible;

  function close() {
    setQuery("");
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title={title}
      description="Only games you've marked as Completed and rated can be favorites."
    >
      {eligible.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">
          No eligible games yet. Mark a game as <span className="text-fg">Completed</span> and give it a star
          rating, and it will show up here.
        </p>
      ) : (
        <>
          <label htmlFor={inputId} className="sr-only">
            Search your completed games
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-faint" />
            <Input
              id={inputId}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your completed games…"
              className="pl-9"
              autoComplete="off"
            />
          </div>
          <ul className="mt-3 space-y-0.5">
            {results.length === 0 ? (
              <li className="py-6 text-center text-sm text-muted">None of your completed, rated games match “{query}”.</li>
            ) : (
              results.map((g) => {
                const already = chosen.includes(g.id);
                const rating = getUserReview(state, userId, g.id)?.rating ?? null;
                return (
                  <li key={g.id}>
                    <button
                      type="button"
                      disabled={already}
                      onClick={() => {
                        onPick(g);
                        close();
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-surface disabled:cursor-default disabled:opacity-50 disabled:hover:bg-transparent"
                    >
                      <GameCover game={g} showTitle={false} className="w-10 shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-fg">{g.title}</span>
                        <span className="flex items-center gap-2 text-xs text-faint">
                          {releaseYear(g.releaseDate)}
                          {rating !== null ? <StarRating value={rating} size="xs" /> : null}
                        </span>
                      </span>
                      {already ? (
                        <span className="flex items-center gap-1 text-xs text-muted">
                          <Check className="h-3.5 w-3.5" /> Added
                        </span>
                      ) : (
                        <Plus className="h-4 w-4 text-muted" />
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </>
      )}
    </Dialog>
  );
}

/** Five ordered favorite games. Owners can add, remove, replace and reorder. */
export function FavoriteGames({ games, isOwner }: { games: Game[]; isOwner: boolean }) {
  const state = useAppState();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ID[]>([]);
  const [replacing, setReplacing] = useState<number | null>(null);
  const [picking, setPicking] = useState(false);

  function startEditing() {
    setDraft(games.map((g) => g.id));
    setReplacing(null);
    setEditing(true);
  }

  async function save() {
    const r = await actions.setFavorites(draft);
    if (!r.ok) return toast(r.error, "error");
    toast("Favorite games saved");
    setEditing(false);
  }

  function move(i: number, d: number) {
    setDraft((ids) => {
      const next = [...ids];
      const j = i + d;
      if (j < 0 || j >= next.length) return ids;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function openPicker(replaceIndex: number | null) {
    setReplacing(replaceIndex);
    setPicking(true);
  }

  function pick(game: Game) {
    setDraft((ids) => {
      if (replacing !== null) {
        const next = [...ids];
        next[replacing] = game.id;
        return next;
      }
      return ids.length >= MAX_FAVORITE_GAMES ? ids : [...ids, game.id];
    });
    setReplacing(null);
  }

  const shown = editing ? draft.map((id) => state.games[id]).filter((g): g is Game => Boolean(g)) : games;

  if (!isOwner && games.length === 0) return null;

  return (
    <section aria-labelledby="favorites-heading">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <SectionHeader id="favorites-heading" title="Favorite Games" />
        </div>
        {isOwner && !editing ? (
          <Button variant="ghost" size="sm" className="-mt-1.5" onClick={startEditing}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
        ) : null}
      </div>

      <ol className="grid grid-cols-3 gap-3 sm:grid-cols-5 sm:gap-4">
        {Array.from({ length: MAX_FAVORITE_GAMES }, (_, i) => {
          const g = shown[i];
          if (!g) {
            // Visitors only see filled slots; owners see placeholders.
            if (!isOwner) return null;
            return (
              <li key={`empty-${i}`}>
                <Slot index={i} onClick={editing ? () => openPicker(null) : undefined} />
              </li>
            );
          }
          return (
            <li key={g.id} className={cn("relative", replacing === i && "ring-2 ring-accent rounded-[var(--radius-cover)]")}>
              {editing ? (
                <>
                  <GameCover game={g} />
                  <div className="mt-2 flex items-center justify-center gap-0.5">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${g.title} left`}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openPicker(i)}
                      aria-label={`Replace ${g.title}`}
                    >
                      <Replace className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => move(i, 1)}
                      disabled={i === shown.length - 1}
                      aria-label={`Move ${g.title} right`}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:text-danger"
                      onClick={() => {
                        setDraft((ids) => ids.filter((x) => x !== g.id));
                        setReplacing(null);
                      }}
                      aria-label={`Remove ${g.title}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <Link href={`/games/${g.slug}`} className="group block" aria-label={g.title}>
                  <GameCover game={g} className="transition group-hover:ring-2 group-hover:ring-accent/60" />
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      {isOwner && !editing && games.length === 0 ? (
        <p className="mt-3 text-sm text-muted">
          Pick up to five games that define you.{" "}
          <button type="button" onClick={startEditing} className="font-medium text-accent hover:underline">
            Choose favorites
          </button>
        </p>
      ) : null}

      {editing ? (
        <div className="mt-5 flex flex-wrap items-center gap-2 rounded-[var(--radius-card)] border border-border bg-bg-subtle p-4">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => openPicker(null)}
            disabled={draft.length >= MAX_FAVORITE_GAMES}
          >
            <Plus className="h-4 w-4" /> Add favorite ({draft.length}/{MAX_FAVORITE_GAMES})
          </Button>
          <span className="flex-1" />
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={save}>
            Save favorites
          </Button>
        </div>
      ) : null}

      <FavoritePicker
        open={picking}
        onClose={() => {
          setPicking(false);
          setReplacing(null);
        }}
        onPick={pick}
        chosen={draft}
        title={replacing !== null ? `Replace favorite #${replacing + 1}` : "Add a favorite game"}
      />
    </section>
  );
}
