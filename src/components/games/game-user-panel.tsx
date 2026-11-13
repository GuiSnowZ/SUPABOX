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
import { statusAfterDiaryEntry } from "@/features/app/state";
import { openReviewPrompt, promptSignIn, toast } from "@/features/app/ui-store";
import { LIBRARY_STATUSES } from "@/lib/library";
import { formatRating } from "@/lib/ratings";
import { cn, formatDate } from "@/lib/utils";
import type { Game, LibraryStatus, PlaySessionKind } from "@/types";
import { useLocale, useT } from "@/i18n/client";

export function CommunityRating({ game }: { game: Game }) {
  const t = useT();
  const state = useAppState();
  const status = useLoad(`game:${game.id}`, () => loaders.game(game.id));
  const summary = getCommunityRating(state, game.id);
  const max = Math.max(1, ...summary.distribution);
  return (
    <Card className="p-4">
      <p className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">{t.panel.communityRating}</p>
      {status === "loading" ? (
        <Skeleton className="mt-2 h-16 w-full" />
      ) : summary.average === null ? (
        <p className="mt-2 text-sm text-muted">{t.panel.noRatings}</p>
      ) : (
        <div className="mt-2 flex items-end gap-4">
          <div>
            <p className="text-3xl font-semibold tabular-nums">{formatRating(summary.average)}</p>
            <StarRating value={Math.round(summary.average * 2) / 2} size="xs" />
            <p className="mt-1 text-xs text-faint">{t.common.ratings(summary.count)}</p>
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
  const t = useT();
  const state = useAppState();
  const userId = state.currentUserId;
  const entry = getUserGame(state, userId, game.id);

  async function setStatus(status: LibraryStatus | null) {
    if (!userId) return promptSignIn(t.panel.signInToAdd(game.title));
    await changeLibraryStatus(game, status, t);
  }

  return (
    <div className="space-y-3">
      <WishlistButton game={game} variant="full" className="w-full" />
      <div>
        <label htmlFor="library-status" className="mb-1.5 block text-xs font-medium text-muted">
          {t.panel.libraryStatus}
        </label>
        <Select
          id="library-status"
          value={entry?.status ?? ""}
          onChange={(e) => setStatus((e.target.value || null) as LibraryStatus | null)}
          onFocus={() => state.authReady && !userId && promptSignIn(t.panel.signInToAdd(game.title))}
          disabled={!state.authReady}
        >
          <option value="">{t.panel.notInLibrary}</option>
          {LIBRARY_STATUSES.map((s) => (
            <option key={s} value={s} disabled={!released && s !== "want_to_play"}>
              {t.status[s]}
            </option>
          ))}
        </Select>
        {!released ? <p className="mt-1.5 text-xs text-faint">{t.panel.notReleased}</p> : null}
      </div>
    </div>
  );
}

type QuickStage = "just_started" | "playing" | "completed_today";

const QUICK_STAGES: ReadonlyArray<readonly [QuickStage, "justStarted" | "playing" | "completedToday"]> = [
  ["just_started", "justStarted"],
  ["playing", "playing"],
  ["completed_today", "completedToday"],
];

/** Today's date in the visitor's own time zone (YYYY-MM-DD), not UTC. */
function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * The Diary form. In `quick` mode (the "+" quick add) it asks where you are
 * with the game: just started / playing (status Playing, no finish date) or
 * completed today (finish date today, status Completed, then the rate-and-review
 * prompt opens).
 */
export function DiaryForm({ game, onDone, quick = false }: { game: Game; onDone: () => void; quick?: boolean }) {
  const t = useT();
  const today = localToday();
  const [kind, setKind] = useState<PlaySessionKind>("first_playthrough");
  const [stage, setStage] = useState<QuickStage>("just_started");
  const [startedOn, setStartedOn] = useState(today);
  const [finishedOn, setFinishedOn] = useState("");
  const [note, setNote] = useState("");
  const [hours, setHours] = useState("");
  const [platform, setPlatform] = useState(game.platforms.length === 1 ? game.platforms[0] : "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const showStart = !quick || stage !== "just_started";
  const completing = quick && stage === "completed_today";

  async function submit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    registerGames([game]);
    const r = await actions.logPlaySession({
      gameId: game.id,
      kind,
      startedOn: quick && stage === "just_started" ? today : startedOn,
      finishedOn: quick ? (completing ? today : null) : finishedOn || null,
      note,
      hours: hours.trim() ? Number(hours.replace(",", ".")) : null,
      platform: platform || null,
    });
    if (!r.ok) {
      setPending(false);
      return setError(r.error);
    }
    // A first playthrough moves the game to Completed (finished) or Playing;
    // replays leave the library status as it is.
    const finished = quick ? completing : Boolean(finishedOn);
    const state = getAppState();
    const target = statusAfterDiaryEntry(getUserGame(state, state.currentUserId, game.id)?.status, kind, finished);
    if (target) {
      const s = await actions.setLibraryStatus(game.id, target);
      if (!s.ok) {
        setPending(false);
        return setError(s.error);
      }
    }
    if (quick) {
      setPending(false);
      onDone();
      // Finishing a game asks for a rating and review, like everywhere else.
      if (completing) openReviewPrompt(game.id);
      else toast(t.diary.addedAsPlaying(game.title));
      return;
    } else {
      toast(t.diary.added);
      // Finishing a first playthrough asks for a rating and review too.
      if (target === "completed") openReviewPrompt(game.id);
    }
    setPending(false);
    onDone();
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      {quick ? (
        <fieldset className="sm:col-span-2">
          <legend className="mb-1.5 text-sm font-medium text-fg">{t.diary.whereAreYou}</legend>
          <div className="grid grid-cols-3 gap-2">
            {QUICK_STAGES.map(([value, key]) => (
              <label
                key={value}
                className={cn(
                  "cursor-pointer rounded-lg border px-2.5 py-2.5 text-sm leading-tight transition-colors",
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
                <span className="block font-medium">{t.diary[key]}</span>
                <span className="mt-0.5 block text-xs text-faint">{t.diary[`${key}Hint`]}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
      <Field label={t.diary.type} htmlFor="diary-kind">
        <Select id="diary-kind" value={kind} onChange={(e) => setKind(e.target.value as PlaySessionKind)}>
          {(Object.keys(t.sessionKind) as PlaySessionKind[]).map((k) => (
            <option key={k} value={k}>
              {t.sessionKind[k]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t.diary.note} htmlFor="diary-note">
        <Input id="diary-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder={t.common.optional} />
      </Field>
      <Field label={t.diary.platform} htmlFor="diary-platform">
        <Select id="diary-platform" value={platform} onChange={(e) => setPlatform(e.target.value)}>
          <option value="">{t.diary.notSpecified}</option>
          {game.platforms.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t.diary.hours} htmlFor="diary-hours" hint={t.common.optional}>
        <Input
          id="diary-hours"
          type="number"
          inputMode="decimal"
          min={0}
          max={10000}
          step={0.5}
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          placeholder={t.diary.hoursPlaceholder}
        />
      </Field>
      {showStart ? (
        <Field label={t.diary.started} htmlFor="diary-start">
          <Input id="diary-start" type="date" value={startedOn} max={today} onChange={(e) => setStartedOn(e.target.value)} required />
        </Field>
      ) : null}
      {!quick ? (
        <Field label={t.diary.finished} htmlFor="diary-end" hint={t.diary.finishedHint}>
          <Input id="diary-end" type="date" value={finishedOn} min={startedOn} onChange={(e) => setFinishedOn(e.target.value)} />
        </Field>
      ) : null}
      <div className="sm:col-span-2">
        <FormError>{error}</FormError>
        <div className="mt-2 flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? t.common.saving : completing ? t.diary.saveAndRate : quick ? t.diary.addToDiary : t.diary.saveEntry}
          </Button>
          <Button variant="ghost" onClick={onDone}>
            {t.common.cancel}
          </Button>
        </div>
      </div>
    </form>
  );
}

/** Your diary entries for this game — each playthrough is a separate entry. */
export function GameDiary({ game, released }: { game: Game; released: boolean }) {
  const t = useT();
  const locale = useLocale();
  const state = useAppState();
  const [adding, setAdding] = useState(false);
  if (!state.currentUserId || !released) return null;
  const sessions = getPlaySessions(state, state.currentUserId, game.id);

  return (
    <section aria-labelledby="diary-heading">
      <SectionHeader id="diary-heading" title={t.diary.yourDiary} count={sessions.length} />
      {sessions.length ? (
        <ul className="mb-4 space-y-2">
          {sessions.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm">
              <span className="font-medium">{t.sessionKind[s.kind]}</span>
              <span className="text-muted">
                {formatDate(s.startedOn, locale)} → {s.finishedOn ? formatDate(s.finishedOn, locale) : t.diary.inProgress}
              </span>
              {s.platform || s.hours != null ? (
                <span className="text-faint">
                  {[s.platform, s.hours != null ? t.diary.hoursShort(s.hours) : null].filter(Boolean).join(" · ")}
                </span>
              ) : null}
              {s.note ? <span className="hidden truncate text-faint sm:inline">“{s.note}”</span> : null}
              <span className="ml-auto">
                <ConfirmButton prompt={t.diary.deleteEntry} onConfirm={async () => {
                    const r = await actions.deletePlaySession(s.id);
                    if (!r.ok) toast(r.error, "error");
                  }}>
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="sr-only">{t.diary.deleteEntryLabel}</span>
                </ConfirmButton>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 text-sm text-muted">{t.diary.empty}</p>
      )}
      {adding ? (
        <Card className="p-4">
          <DiaryForm game={game} onDone={() => setAdding(false)} />
        </Card>
      ) : (
        <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>
          <CalendarPlus className="h-4 w-4" /> {t.diary.logPlaythrough}
        </Button>
      )}
    </section>
  );
}

export function GameReviews({ game, released }: { game: Game; released: boolean }) {
  const t = useT();
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
          <SectionHeader id="your-review-heading" title={t.panel.yourReview} />
          {loadingMine ? (
            <Skeleton className="h-40 w-full" />
          ) : !userId ? (
            <EmptyState
              title={t.panel.rateAndReview}
              description={t.panel.rateSignIn}
              action={
                <Link href="/sign-in" className={buttonClasses("primary", "sm")}>
                  {t.common.signIn}
                </Link>
              }
            />
          ) : mine && !editing ? (
            <Card className="px-4 [&>article]:border-b-0">
              <ReviewCard review={mine} game={game} showGame={false} />
              <div className="-mt-2 pb-4">
                <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                  {t.panel.editReview}
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
        <SectionHeader id="reviews-heading" title={t.panel.reviews} count={others.length} />
        {status === "loading" ? (
          <Skeleton className="h-24 w-full" />
        ) : status === "error" ? (
          <p className="text-sm text-danger">{t.panel.loadReviewsError}</p>
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
            {released ? t.panel.noOtherReviews : t.panel.reviewsOpen}
          </p>
        )}
      </section>
    </div>
  );
}
