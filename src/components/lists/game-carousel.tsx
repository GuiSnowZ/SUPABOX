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
import { clampIndex, swipeStep } from "@/lib/carousel";
import { cn, releaseYear } from "@/lib/utils";
import type { Game } from "@/types";
import { useLocale, useT } from "@/i18n/client";

/**
 * One game in the carousel: Want to Play, or Already Played → stars + review → Add.
 * "Add" saves the game to the profile as Completed (unless it's already in the
 * library as played) together with the rating/review, using the normal actions.
 */
function GameSlide({ game, label }: { game: Game; label?: string | null }) {
  const t = useT();
  const locale = useLocale();
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
    if (!userId) return promptSignIn(t.carousel.signIn(game.title));
    setPlayed((v) => !v);
  }

  async function add() {
    if (rating === null && !body.trim()) return setError(t.carousel.needRating);
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
    toast(t.carousel.added(game.title));
    setPlayed(false);
  }

  return (
    <div className="flex h-full flex-col items-center px-1 text-center">
      {label ? <p className="mb-2 text-xs font-medium tracking-wide text-accent uppercase">{label}</p> : null}
      <Link href={`/games/${game.slug}`} className="group relative block w-36 sm:w-44" aria-label={t.carousel.open(game.title)}>
        <GameCover game={game} className="shadow-2xl shadow-black/50 transition group-hover:ring-2 group-hover:ring-accent/60" />
        <CriticScore game={game} className="absolute bottom-2 left-2" />
      </Link>
      <h3 className="mt-4 line-clamp-2 max-w-sm text-lg leading-snug font-semibold">{game.title}</h3>
      <p className="mt-0.5 text-sm text-muted">
        {releaseYear(game.releaseDate, locale)}
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
          <Gamepad2 className="h-4 w-4" /> {released ? t.carousel.alreadyPlayed : t.carousel.notOut}
        </Button>
      </div>

      {playedStatus && !played ? (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-muted">
          <Check className="h-4 w-4 text-accent" /> {t.carousel.inProfile(t.status[playedStatus])}
          {existing?.rating != null ? <StarRating value={existing.rating} size="xs" className="ml-1" /> : null}
        </p>
      ) : null}

      {played ? (
        <div className="animate-fade-in mt-4 w-full max-w-sm space-y-3 rounded-xl border border-border bg-bg p-4 text-left">
          <div>
            <Label htmlFor={ids.rating}>{t.rating.yourRating}</Label>
            <StarRatingInput id={ids.rating} value={rating} onChange={setRating} />
          </div>
          <div>
            <Label htmlFor={ids.body}>{t.reviews.review}</Label>
            <Textarea
              id={ids.body}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t.reviews.placeholder(game.title)}
              maxLength={MAX_REVIEW_LENGTH}
              rows={3}
              className="min-h-20"
            />
          </div>
          <FormError>{error}</FormError>
          <Button onClick={add} disabled={pending} className="w-full">
            {pending ? t.common.saving : t.carousel.add}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * One-game-at-a-time browser over a list of games. The selected index is the
 * single source of truth (arrows, ←/→ keys and touch swipes change it), so the
 * game shown, the "n / total" counter and the page link can never disagree.
 *
 * (It used to follow the scroll position of a scroll-snap strip. Opening it on
 * game 12 scrolled the strip while the dialog was still laying out, the scroll
 * stayed at game 1, and only slides near 12 were rendered — so you got "12 / 25"
 * over an empty slide, or game 1 when you'd clicked game 2 or 3.)
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
  const t = useT();
  const [index, setIndex] = useState(() => clampIndex(initialIndex, games.length));
  const [direction, setDirection] = useState<1 | -1>(1);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const current = clampIndex(index, games.length);
  const game = games[current];

  useEffect(() => {
    registerGames(games);
  }, [games]);

  function go(to: number) {
    const next = clampIndex(to, games.length);
    if (next === current) return;
    setDirection(next > current ? 1 : -1);
    setIndex(next);
  }

  if (!game) return null;

  return (
    <div
      className={cn("relative", className)}
      role="region"
      aria-roledescription="carousel"
      aria-label={t.carousel.games}
      onKeyDown={(e) => {
        if ((e.target as HTMLElement).closest("textarea, input")) return;
        if (e.key === "ArrowRight") go(current + 1);
        if (e.key === "ArrowLeft") go(current - 1);
      }}
      onTouchStart={(e) => {
        const p = e.touches[0];
        touch.current = p ? { x: p.clientX, y: p.clientY } : null;
      }}
      onTouchEnd={(e) => {
        const start = touch.current;
        const p = e.changedTouches[0];
        touch.current = null;
        if (!start || !p || (e.target as HTMLElement).closest("textarea, input")) return;
        const step = swipeStep(p.clientX - start.x, p.clientY - start.y);
        if (step) go(current + step);
      }}
    >
      <div
        key={`${game.id}-${current}`}
        role="group"
        aria-roledescription="slide"
        aria-label={t.carousel.slide(current + 1, games.length, game.title)}
        className={cn("min-h-96", direction === 1 ? "animate-slide-in-right" : "animate-slide-in-left")}
      >
        <GameSlide game={game} label={labels?.[current]} />
      </div>

      <div className="mt-5 flex items-center justify-center gap-3">
        <Button variant="secondary" size="icon" onClick={() => go(current - 1)} disabled={current === 0} aria-label={t.carousel.previous}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="min-w-16 text-center text-sm text-muted tabular-nums" aria-live="polite">
          {current + 1} / {games.length}
        </span>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => go(current + 1)}
          disabled={current === games.length - 1}
          aria-label={t.carousel.next}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
      <p className="mt-2 text-center">
        <Link href={`/games/${game.slug}`} className="inline-flex items-center gap-1 text-xs text-faint hover:text-fg">
          {t.carousel.openPage} <ExternalLink className="h-3 w-3" />
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
      {/* Keyed by the clicked position: every opening starts fresh on that game. */}
      {index !== null ? <GameCarousel key={index} games={games} labels={labels} initialIndex={index} /> : null}
    </Dialog>
  );
}
