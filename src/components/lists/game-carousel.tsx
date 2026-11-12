"use client";

import { Check, ChevronLeft, ChevronRight, ExternalLink, Gamepad2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { CriticScore } from "@/components/games/critic-score";
import { GameCover } from "@/components/games/game-cover";
import { PlatformBadges } from "@/components/games/platform-badges";
import { WishlistButton } from "@/components/games/wishlist-button";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FormError, Label, Textarea } from "@/components/ui/form";
import { StarRating, StarRatingInput } from "@/components/ui/star-rating";
import { getUserGame, getUserReview } from "@/features/app/selectors";
import { MAX_REVIEW_LENGTH } from "@/features/app/state";
import { actions, registerGames, useAppState } from "@/features/app/store";
import { promptSignIn, toast } from "@/features/app/ui-store";
import { isReleasedOn, todayIso } from "@/lib/catalog/rows";
import { STATUS_LABEL } from "@/lib/library";
import { cn, releaseYear } from "@/lib/utils";
import type { Game } from "@/types";

/**
 * One game in the carousel: Want to Play, or Already Played → stars + review → Add.
 * "Add" saves the game to the profile as Completed (unless it's already in the
 * library as played) together with the rating/review, using the normal actions.
 */
function GameSlide({ game, label }: { game: Game; label?: string | null }) {
  const state = useAppState();
  const userId = state.currentUserId;
  const entry = getUserGame(state, userId, game.id);
  const existing = getUserReview(state, userId, game.id);
  const released = isReleasedOn(game, todayIso());
  const [played, setPlayed] = useState(false);
  const [rating, setRating] = useState<number | null>(existing?.rating ?? null);
  const [body, setBody] = useState(existing?.body ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const ids = { rating: useId(), body: useId() };
  const playedStatus = entry && entry.status !== "want_to_play" ? entry.status : null;

  function openPlayed() {
    if (!state.authReady) return;
    if (!userId) return promptSignIn(`Sign in to add ${game.title} to your profile.`);
    setPlayed((v) => !v);
  }

  async function add() {
    if (rating === null && !body.trim()) return setError("Give it a rating or write a few words.");
    setPending(true);
    setError(null);
    registerGames([game]);
    if (!playedStatus) {
      const s = await actions.setLibraryStatus(game.id, "completed");
      if (!s.ok) {
        setPending(false);
        return setError(s.error);
      }
    }
    const r = await actions.upsertReview({ gameId: game.id, rating, body, containsSpoilers: false });
    setPending(false);
    if (!r.ok) return setError(r.error);
    toast(`${game.title} added to your profile`);
    setPlayed(false);
  }

  return (
    <div className="flex h-full flex-col items-center px-1 text-center">
      {label ? <p className="mb-2 text-xs font-medium tracking-wide text-accent uppercase">{label}</p> : null}
      <Link href={`/games/${game.slug}`} className="group relative block w-36 sm:w-44" aria-label={`Open ${game.title}`}>
        <GameCover game={game} className="shadow-2xl shadow-black/50 transition group-hover:ring-2 group-hover:ring-accent/60" />
        <CriticScore game={game} className="absolute bottom-2 left-2" />
      </Link>
      <h3 className="mt-4 line-clamp-2 max-w-sm text-lg leading-snug font-semibold">{game.title}</h3>
      <p className="mt-0.5 text-sm text-muted">
        {releaseYear(game.releaseDate)}
        {game.developer && !game.developer.startsWith("Unknown") ? ` · ${game.developer}` : ""}
      </p>
      <PlatformBadges platforms={game.platforms} className="mt-2 justify-center" />

      <div className="mt-5 grid w-full max-w-sm grid-cols-2 gap-2">
        <WishlistButton game={game} variant="full" className="w-full" />
        <Button
          variant={played ? "primary" : "secondary"}
          onClick={openPlayed}
          disabled={!released}
          aria-expanded={played}
          className="w-full"
        >
          <Gamepad2 className="h-4 w-4" /> {released ? "Already played" : "Not out yet"}
        </Button>
      </div>

      {playedStatus && !played ? (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-muted">
          <Check className="h-4 w-4 text-accent" /> In your profile · {STATUS_LABEL[playedStatus]}
          {existing?.rating != null ? <StarRating value={existing.rating} size="xs" className="ml-1" /> : null}
        </p>
      ) : null}

      {played ? (
        <div className="animate-fade-in mt-4 w-full max-w-sm space-y-3 rounded-xl border border-border bg-bg p-4 text-left">
          <div>
            <Label htmlFor={ids.rating}>Your rating</Label>
            <StarRatingInput id={ids.rating} value={rating} onChange={setRating} />
          </div>
          <div>
            <Label htmlFor={ids.body}>Review</Label>
            <Textarea
              id={ids.body}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={`What did you think of ${game.title}? (optional)`}
              maxLength={MAX_REVIEW_LENGTH}
              rows={3}
              className="min-h-20"
            />
          </div>
          <FormError>{error}</FormError>
          <Button onClick={add} disabled={pending} className="w-full">
            {pending ? "Saving…" : "Add"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Swipeable, one-game-at-a-time browser over a list of games (scroll-snap, so
 * touch swiping works natively; arrows and ←/→ keys too).
 */
export function GameCarousel({
  games,
  initialIndex = 0,
  labels,
  className,
}: {
  games: Game[];
  initialIndex?: number;
  /** Optional caption per game (e.g. its rank or section). */
  labels?: Array<string | null>;
  className?: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    registerGames(games);
  }, [games]);

  useEffect(() => {
    const el = track.current;
    if (el) el.scrollTo({ left: initialIndex * el.clientWidth, behavior: "instant" as ScrollBehavior });
  }, [initialIndex]);

  function go(to: number) {
    const el = track.current;
    if (!el) return;
    const next = Math.max(0, Math.min(games.length - 1, to));
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  }

  if (!games.length) return null;

  return (
    <div
      className={cn("relative", className)}
      onKeyDown={(e) => {
        if ((e.target as HTMLElement).closest("textarea, input")) return;
        if (e.key === "ArrowRight") go(index + 1);
        if (e.key === "ArrowLeft") go(index - 1);
      }}
    >
      <div
        ref={track}
        role="region"
        aria-roledescription="carousel"
        aria-label="Games"
        tabIndex={0}
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
        }}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] focus-visible:outline-none [&::-webkit-scrollbar]:hidden"
      >
        {games.map((g, i) => (
          <div
            key={`${g.id}-${i}`}
            className="w-full shrink-0 snap-center"
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${games.length}: ${g.title}`}
            aria-hidden={Math.abs(i - index) > 1 ? true : undefined}
          >
            {Math.abs(i - index) <= 2 ? <GameSlide game={g} label={labels?.[i]} /> : <div className="h-96" />}
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-center gap-3">
        <Button variant="secondary" size="icon" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous game">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="min-w-16 text-center text-sm text-muted tabular-nums" aria-live="polite">
          {index + 1} / {games.length}
        </span>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => go(index + 1)}
          disabled={index === games.length - 1}
          aria-label="Next game"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
      <p className="mt-2 text-center">
        <Link href={`/games/${games[index]?.slug}`} className="inline-flex items-center gap-1 text-xs text-faint hover:text-fg">
          Open game page <ExternalLink className="h-3 w-3" />
        </Link>
      </p>
    </div>
  );
}

/** The carousel in a dialog, opened by clicking a game inside a list. */
export function ListCarouselDialog({
  title,
  games,
  labels,
  index,
  onClose,
}: {
  title: string;
  games: Game[];
  labels?: Array<string | null>;
  index: number | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={index !== null} onClose={onClose} title={title} className="sm:w-[min(92vw,36rem)]">
      {index !== null ? <GameCarousel games={games} labels={labels} initialIndex={index} /> : null}
    </Dialog>
  );
}
