"use client";

import { ChevronLeft, ChevronRight, Pencil, Plus, Replace, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { GameCover } from "@/components/games/game-cover";
import { GamePicker } from "@/components/games/game-picker";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/primitives";
import { toast } from "@/features/app/ui-store";
import { actions, registerGames, useAppState } from "@/features/app/store";
import { cn } from "@/lib/utils";
import { type Game, type ID, MAX_FAVORITE_GAMES } from "@/types";

function Slot({ index }: { index: number }) {
  return (
    <div className="flex aspect-[3/4] items-center justify-center rounded-[var(--radius-cover)] border border-dashed border-border text-faint">
      <span className="text-sm tabular-nums">{index + 1}</span>
    </div>
  );
}

/** Five ordered favorite games. Owners can add, remove, replace and reorder. */
export function FavoriteGames({ games, isOwner }: { games: Game[]; isOwner: boolean }) {
  const state = useAppState();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ID[]>([]);
  const [replacing, setReplacing] = useState<number | null>(null);

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

  function pick(game: Game) {
    registerGames([game]);
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
                <Slot index={i} />
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
                      onClick={() => setReplacing(replacing === i ? null : i)}
                      aria-pressed={replacing === i}
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
        <div className="mt-5 space-y-3 rounded-[var(--radius-card)] border border-border bg-bg-subtle p-4">
          <p className="flex items-center gap-2 text-sm text-muted">
            <Plus className="h-4 w-4" />
            {replacing !== null
              ? `Pick a game to replace #${replacing + 1}`
              : draft.length >= MAX_FAVORITE_GAMES
                ? "All five slots are filled — remove or replace one to change it."
                : `Add a favorite (${draft.length}/${MAX_FAVORITE_GAMES})`}
          </p>
          <GamePicker
            onPick={pick}
            excludeIds={draft}
            disabled={replacing === null && draft.length >= MAX_FAVORITE_GAMES}
            placeholder="Search for a favorite game…"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={save}>
              Save favorites
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
