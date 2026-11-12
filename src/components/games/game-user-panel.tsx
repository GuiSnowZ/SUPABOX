"use client";

import { CalendarPlus, Trash2 } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import { WishlistButton } from "@/components/games/wishlist-button";
import { ReviewCard } from "@/components/reviews/review-card";
import { ReviewEditor } from "@/components/reviews/review-editor";
import { Button, buttonClasses } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { Field, FormError, Input, Select } from "@/components/ui/form";
import { Card, EmptyState, SectionHeader, Skeleton } from "@/components/ui/primitives";
import { StarRating } from "@/components/ui/star-rating";
import {
  getCommunityRating,
  getPlaySessions,
  getProfileById,
  getReviewsForGame,
  getUserGame,
  getUserReview,
} from "@/features/app/selectors";
import { actions, getAppState, loaders, registerGames, useAppState, useLoad } from "@/features/app/store";
import { changeLibraryStatus } from "@/features/app/library-actions";
import { promptSignIn, toast } from "@/features/app/ui-store";
import { LIBRARY_STATUSES, SESSION_KIND_LABEL, STATUS_LABEL } from "@/lib/library";
import { formatRating } from "@/lib/ratings";
import { cn, formatDate, pluralize } from "@/lib/utils";
import type { Game, LibraryStatus, PlaySessionKind } from "@/types";

export function CommunityRating({ game }: { game: Game }) {
  const state = useAppState();
  const status = useLoad(`game:${game.id}`, () => loaders.game(game.id));
  const summary = getCommunityRating(state, game.id);
  const max = Math.max(1, ...summary.distribution);
  return (
    <Card className="p-4">
      <p className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">Community rating</p>
      {status === "loading" ? (
        <Skeleton className="mt-2 h-16 w-full" />
      ) : summary.average === null ? (
        <p className="mt-2 text-sm text-muted">No ratings yet.</p>
      ) : (
        <div className="mt-2 flex items-end gap-4">
          <div>
            <p className="text-3xl font-semibold tabular-nums">{formatRating(summary.average)}</p>
            <StarRating value={Math.round(summary.average * 2) / 2} size="xs" />
            <p className="mt-1 text-xs text-faint">{pluralize(summary.count, "rating")}</p>
          </div>
          <div className="flex h-12 flex-1 items-end gap-0.5" aria-hidden>
            {summary.distribution.map((n, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm bg-accent/70"
                style={{ height: `${Math.max(4, (n / max) * 100)}%`, opacity: n ? 1 : 0.2 }}
              />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

/** Library status + wishlist + quick rating, shown under the cover. */
export function GameActions({ game, released }: { game: Game; released: boolean }) {
  const state = useAppState();
  const userId = state.currentUserId;
  const entry = getUserGame(state, userId, game.id);

  async function setStatus(status: LibraryStatus | null) {
    if (!userId) return promptSignIn(`Sign in to add ${game.title} to your library.`);
    await changeLibraryStatus(game, status);
  }

  return (
    <div className="space-y-3">
      <WishlistButton game={game} variant="full" className="w-full" />
      <div>
        <label htmlFor="library-status" className="mb-1.5 block text-xs font-medium text-muted">
          Library status
        </label>
        <Select
          id="library-status"
          value={entry?.status ?? ""}
          onChange={(e) => setStatus((e.target.value || null) as LibraryStatus | null)}
          onFocus={() => state.authReady && !userId && promptSignIn(`Sign in to add ${game.title} to your library.`)}
          disabled={!state.authReady}
        >
          <option value="">Not in library</option>
          {LIBRARY_STATUSES.map((s) => (
            <option key={s} value={s} disabled={!released && s !== "want_to_play"}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
        {!released ? <p className="mt-1.5 text-xs text-faint">Not released yet — you can wishlist it.</p> : null}
      </div>
    </div>
  );
}

/**
 * The Diary form. In `quick` mode (the "+" quick add) it asks whether you just
 * started or are already playing, hides the finish date, and also sets the
 * game's library status to Playing.
 */
export function DiaryForm({ game, onDone, quick = false }: { game: Game; onDone: () => void; quick?: boolean }) {
  const today = new Date().toISOString().slice(0, 10);
  const [kind, setKind] = useState<PlaySessionKind>("first_playthrough");
  const [stage, setStage] = useState<"just_started" | "playing">("just_started");
  const [startedOn, setStartedOn] = useState(today);
  const [finishedOn, setFinishedOn] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const showStart = !quick || stage === "playing";

  async function submit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    registerGames([game]);
    const r = await actions.logPlaySession({
      gameId: game.id,
      kind,
      startedOn: quick && stage === "just_started" ? today : startedOn,
      finishedOn: quick ? null : finishedOn || null,
      note,
    });
    if (!r.ok) {
      setPending(false);
      return setError(r.error);
    }
    if (quick) {
      const state = getAppState();
      if (getUserGame(state, state.currentUserId, game.id)?.status !== "playing") {
        const s = await actions.setLibraryStatus(game.id, "playing");
        if (!s.ok) {
          setPending(false);
          return setError(s.error);
        }
      }
      toast(`${game.title} added to your diary as Playing`);
    } else {
      toast("Added to your diary");
    }
    setPending(false);
    onDone();
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      {quick ? (
        <fieldset className="sm:col-span-2">
          <legend className="mb-1.5 text-sm font-medium text-fg">Where are you?</legend>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["just_started", "Just started", "Starting it today"],
                ["playing", "Already playing", "Started a while ago"],
              ] as const
            ).map(([value, label, hint]) => (
              <label
                key={value}
                className={cn(
                  "cursor-pointer rounded-lg border px-3 py-2.5 text-sm transition-colors",
                  stage === value ? "border-accent bg-accent/10 text-fg" : "border-border text-muted hover:border-border-strong",
                )}
              >
                <input
                  type="radio"
                  name="diary-stage"
                  value={value}
                  checked={stage === value}
                  onChange={() => setStage(value)}
                  className="sr-only"
                />
                <span className="block font-medium">{label}</span>
                <span className="block text-xs text-faint">{hint}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
      <Field label="Type" htmlFor="diary-kind">
        <Select id="diary-kind" value={kind} onChange={(e) => setKind(e.target.value as PlaySessionKind)}>
          {Object.entries(SESSION_KIND_LABEL).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Note" htmlFor="diary-note">
        <Input id="diary-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Optional" />
      </Field>
      {showStart ? (
        <Field label="Started" htmlFor="diary-start">
          <Input id="diary-start" type="date" value={startedOn} max={today} onChange={(e) => setStartedOn(e.target.value)} required />
        </Field>
      ) : null}
      {!quick ? (
        <Field label="Finished" htmlFor="diary-end" hint="Leave empty if you're still playing.">
          <Input id="diary-end" type="date" value={finishedOn} min={startedOn} onChange={(e) => setFinishedOn(e.target.value)} />
        </Field>
      ) : null}
      <div className="sm:col-span-2">
        <FormError>{error}</FormError>
        <div className="mt-2 flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : quick ? "Add to my diary" : "Save entry"}
          </Button>
          <Button variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}

/** Your diary entries for this game — each playthrough is a separate entry. */
export function GameDiary({ game, released }: { game: Game; released: boolean }) {
  const state = useAppState();
  const [adding, setAdding] = useState(false);
  if (!state.currentUserId || !released) return null;
  const sessions = getPlaySessions(state, state.currentUserId, game.id);

  return (
    <section aria-labelledby="diary-heading">
      <SectionHeader id="diary-heading" title="Your diary" count={sessions.length} />
      {sessions.length ? (
        <ul className="mb-4 space-y-2">
          {sessions.map((s) => (
            <li key={s.id} className="flex items-center gap-3 rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm">
              <span className="font-medium">{SESSION_KIND_LABEL[s.kind]}</span>
              <span className="text-muted">
                {formatDate(s.startedOn)} → {s.finishedOn ? formatDate(s.finishedOn) : "in progress"}
              </span>
              {s.note ? <span className="hidden truncate text-faint sm:inline">“{s.note}”</span> : null}
              <span className="ml-auto">
                <ConfirmButton prompt="Delete entry?" onConfirm={async () => {
                    const r = await actions.deletePlaySession(s.id);
                    if (!r.ok) toast(r.error, "error");
                  }}>
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="sr-only">Delete diary entry</span>
                </ConfirmButton>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 text-sm text-muted">No diary entries yet. Log when you start or finish a playthrough.</p>
      )}
      {adding ? (
        <Card className="p-4">
          <DiaryForm game={game} onDone={() => setAdding(false)} />
        </Card>
      ) : (
        <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>
          <CalendarPlus className="h-4 w-4" /> Log a playthrough
        </Button>
      )}
    </section>
  );
}

export function GameReviews({ game, released }: { game: Game; released: boolean }) {
  const state = useAppState();
  const userId = state.currentUserId;
  const status = useLoad(`game:${game.id}`, () => loaders.game(game.id));
  const mine = getUserReview(state, userId, game.id);
  const [editing, setEditing] = useState(false);
  const others = getReviewsForGame(state, game.id).filter((r) => r.userId !== userId);
  const loadingMine = !state.authReady || (Boolean(userId) && state.loads.bootstrap !== "ready");

  return (
    <div className="space-y-12">
      {released ? (
        <section id="your-review" aria-labelledby="your-review-heading" className="scroll-mt-24">
          <SectionHeader id="your-review-heading" title="Your review" />
          {loadingMine ? (
            <Skeleton className="h-40 w-full" />
          ) : !userId ? (
            <EmptyState
              title="Rate and review this game"
              description="Sign in to share what you thought."
              action={
                <Link href="/sign-in" className={buttonClasses("primary", "sm")}>
                  Sign in
                </Link>
              }
            />
          ) : mine && !editing ? (
            <Card className="px-4 [&>article]:border-b-0">
              <ReviewCard review={mine} game={game} showGame={false} />
              <div className="-mt-2 pb-4">
                <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                  Edit review
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-4 sm:p-5">
              <ReviewEditor
                key={mine?.updatedAt ?? "new"}
                game={game}
                existing={mine}
                onDone={mine ? () => setEditing(false) : undefined}
              />
            </Card>
          )}
        </section>
      ) : null}

      <section aria-labelledby="reviews-heading">
        <SectionHeader id="reviews-heading" title="Reviews" count={others.length} />
        {status === "loading" ? (
          <Skeleton className="h-24 w-full" />
        ) : status === "error" ? (
          <p className="text-sm text-danger">Couldn&apos;t load reviews.</p>
        ) : others.length ? (
          <div>
            {others.map((r) => {
              const author = getProfileById(state, r.userId);
              return (
                <ReviewCard key={r.id} review={r} game={game} author={author} showAuthor showGame={false} />
              );
            })}
          </div>
        ) : (
          <p className={cn("text-sm text-muted")}>
            {released ? "No one else has reviewed this game yet." : "Reviews open when the game is released."}
          </p>
        )}
      </section>
    </div>
  );
}
