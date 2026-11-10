"use client";

import { ArrowDown, ArrowUp, Globe, Lock, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { GameCover } from "@/components/games/game-cover";
import { GamePicker } from "@/components/games/game-picker";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Textarea } from "@/components/ui/form";
import { Card } from "@/components/ui/primitives";
import { MAX_LIST_DESCRIPTION, MAX_LIST_TITLE } from "@/features/app/state";
import { actions, registerGames, useAppState } from "@/features/app/store";
import { toast } from "@/features/app/ui-store";
import { cn, releaseYear } from "@/lib/utils";
import type { GameList, ID, ListVisibility } from "@/types";

/** Create or edit a list. Any catalog game can be added — not only library games. */
export function ListEditor({ existing }: { existing?: GameList }) {
  const router = useRouter();
  const state = useAppState();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [visibility, setVisibility] = useState<ListVisibility>(existing?.visibility ?? "public");
  const [gameIds, setGameIds] = useState<ID[]>(
    existing ? [...existing.items].sort((a, b) => a.position - b.position).map((i) => i.gameId) : [],
  );
  const [error, setError] = useState<string | null>(null);

  function move(index: number, delta: number) {
    setGameIds((ids) => {
      const next = [...ids];
      const target = index + delta;
      if (target < 0 || target >= next.length) return ids;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const input = { title, description, visibility, gameIds };
    if (existing) {
      const r = await actions.updateList(existing.id, input);
      if (!r.ok) return setError(r.error);
      toast("List saved");
      router.push(`/lists/${existing.id}`);
    } else {
      const r = await actions.createList(input);
      if (!r.ok) return setError(r.error);
      toast("List created");
      router.push(`/lists/${r.value}`);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_1.3fr]" noValidate>
      <div className="space-y-5">
        <Field label="Title" htmlFor="list-title">
          <Input
            id="list-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Hidden Gems, Games That Made Me Cry…"
            maxLength={MAX_LIST_TITLE}
            required
          />
        </Field>
        <Field label="Description" htmlFor="list-description" hint="Optional">
          <Textarea
            id="list-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={MAX_LIST_DESCRIPTION}
            placeholder="What ties these games together?"
          />
        </Field>
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">Visibility</legend>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["public", Globe, "Public", "Anyone can see it"],
                ["private", Lock, "Private", "Only you can see it"],
              ] as const
            ).map(([value, Icon, label, hint]) => (
              <label
                key={value}
                className={cn(
                  "cursor-pointer rounded-lg border p-3 transition-colors",
                  visibility === value ? "border-accent bg-accent/8" : "border-border hover:border-border-strong",
                )}
              >
                <input
                  type="radio"
                  name="visibility"
                  value={value}
                  checked={visibility === value}
                  onChange={() => setVisibility(value)}
                  className="sr-only"
                />
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Icon className="h-4 w-4" /> {label}
                </span>
                <span className="mt-0.5 block text-xs text-muted">{hint}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <FormError>{error}</FormError>
        <div className="flex gap-2">
          <Button type="submit">{existing ? "Save list" : "Create list"}</Button>
          <Button variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium">
          Games <span className="text-faint">({gameIds.length})</span>
        </p>
        <GamePicker
          onPick={(g) => {
            registerGames([g]);
            setGameIds((ids) => (ids.includes(g.id) ? ids : [...ids, g.id]));
          }}
          excludeIds={gameIds}
        />
        <Card className="mt-3">
          {gameIds.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted">Search above to add games to your list.</p>
          ) : (
            <ol className="divide-y divide-border">
              {gameIds.map((id, i) => {
                const g = state.games[id];
                if (!g) return null;
                return (
                  <li key={id} className="flex items-center gap-3 px-3 py-2">
                    <span className="w-6 text-right text-sm tabular-nums text-faint">{i + 1}</span>
                    <GameCover game={g} showTitle={false} className="w-9 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{g.title}</span>
                      <span className="block text-xs text-faint">{releaseYear(g.releaseDate)}</span>
                    </span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${g.title} up`}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => move(i, 1)}
                      disabled={i === gameIds.length - 1}
                      aria-label={`Move ${g.title} down`}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:text-danger"
                      onClick={() => setGameIds((ids) => ids.filter((x) => x !== id))}
                      aria-label={`Remove ${g.title}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                );
              })}
            </ol>
          )}
        </Card>
      </div>
    </form>
  );
}
