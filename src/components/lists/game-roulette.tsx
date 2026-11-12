"use client";

import { BookMarked, Crown, ExternalLink, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { GameCover } from "@/components/games/game-cover";
import { PlatformBadges } from "@/components/games/platform-badges";
import { WishlistButton } from "@/components/games/wishlist-button";
import { Button, buttonClasses } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { getWishlist } from "@/features/app/selectors";
import { registerGames, useAppState } from "@/features/app/store";
import { promptSignIn } from "@/features/app/ui-store";
import { cn, pluralize, releaseYear } from "@/lib/utils";
import type { Game } from "@/types";

/** A roulette wheel: eight coloured segments, a hub and a pointer. */
export function RouletteIcon({ className, spinning = false }: { className?: string; spinning?: boolean }) {
  const colors = ["#2fbf71", "#1d2b45", "#e8a24a", "#1d2b45", "#7a5cff", "#1d2b45", "#c3417a", "#1d2b45"];
  const seg = (i: number) => {
    const a0 = (i * Math.PI) / 4 - Math.PI / 2;
    const a1 = ((i + 1) * Math.PI) / 4 - Math.PI / 2;
    return `M50 50 L${50 + 44 * Math.cos(a0)} ${50 + 44 * Math.sin(a0)} A44 44 0 0 1 ${50 + 44 * Math.cos(a1)} ${50 + 44 * Math.sin(a1)} Z`;
  };
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <g className={cn("origin-center", spinning && "animate-[spin_0.6s_linear_infinite]")} style={{ transformBox: "fill-box" }}>
        <circle cx="50" cy="50" r="47" fill="#0c0d10" stroke="#2fbf71" strokeWidth="3" />
        {colors.map((c, i) => (
          <path key={i} d={seg(i)} fill={c} stroke="#0c0d10" strokeWidth="1.5" />
        ))}
        <circle cx="50" cy="50" r="9" fill="#0c0d10" stroke="#2fbf71" strokeWidth="2.5" />
        <circle cx="50" cy="50" r="3" fill="#2fbf71" />
      </g>
      <path d="M50 1 L57 13 L43 13 Z" fill="#fff" stroke="#0c0d10" strokeWidth="1.5" />
    </svg>
  );
}

function randomIndex(n: number): number {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0] % n;
}

type Source = "wishlist" | "classics";
type Phase = { kind: "choose" } | { kind: "spinning"; source: Source; shown: Game } | { kind: "result"; source: Source; game: Game };

/**
 * Game Roulette: pick a random game from the viewer's Want to Play list or from
 * the classics catalogue, with a short slot-machine style spin.
 */
export function GameRoulette({ classics }: { classics: Game[] }) {
  const state = useAppState();
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>({ kind: "choose" });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userId = state.currentUserId;
  const wishlist = userId ? getWishlist(state, userId).map((e) => e.game) : [];

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function close() {
    if (timer.current) clearTimeout(timer.current);
    setOpen(false);
    setPhase({ kind: "choose" });
  }

  function spin(source: Source) {
    if (source === "wishlist" && !userId) return promptSignIn("Sign in to spin your Want to Play list.");
    const pool = source === "wishlist" ? wishlist : classics;
    if (!pool.length) return;
    registerGames(pool);
    const winner = pool[randomIndex(pool.length)];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || pool.length === 1) return setPhase({ kind: "result", source, game: winner });
    // Flick through random covers, slowing down, then land on the winner.
    let delay = 60;
    const tick = () => {
      if (delay > 380) {
        setPhase({ kind: "result", source, game: winner });
        return;
      }
      setPhase({ kind: "spinning", source, shown: pool[randomIndex(pool.length)] });
      delay *= 1.18;
      timer.current = setTimeout(tick, delay);
    };
    tick();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex w-full items-center gap-4 rounded-[var(--radius-card)] border border-border bg-gradient-to-r from-accent/10 via-bg-subtle to-bg-subtle p-4 text-left transition-colors hover:border-accent/50 sm:p-5"
      >
        <RouletteIcon className="h-16 w-16 shrink-0 transition-transform duration-500 group-hover:rotate-45 sm:h-20 sm:w-20" />
        <span className="min-w-0">
          <span className="block text-lg font-semibold text-fg">Game Roulette</span>
          <span className="mt-0.5 block text-sm text-muted">
            Can&apos;t decide what to play? Spin for a random pick from your Want to Play list or the classics.
          </span>
        </span>
      </button>

      <Dialog open={open} onClose={close} title="Game Roulette" description="Let fate pick your next game.">
        {phase.kind === "choose" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => spin("wishlist")}
              disabled={Boolean(userId) && wishlist.length === 0}
              className="rounded-xl border border-border p-4 text-left transition-colors hover:border-accent/60 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border"
            >
              <BookMarked className="h-6 w-6 text-info" />
              <span className="mt-3 block font-semibold">Want to Play</span>
              <span className="mt-1 block text-sm text-muted">
                {!userId
                  ? "Pick from your wishlist (sign in)."
                  : wishlist.length
                    ? `A random pick from your ${pluralize(wishlist.length, "saved game")}.`
                    : "Your Want to Play list is empty — save some games first."}
              </span>
            </button>
            <button
              type="button"
              onClick={() => spin("classics")}
              disabled={!classics.length}
              className="rounded-xl border border-border p-4 text-left transition-colors hover:border-accent/60 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Crown className="h-6 w-6 text-star" />
              <span className="mt-3 block font-semibold">Classic Games</span>
              <span className="mt-1 block text-sm text-muted">
                {classics.length
                  ? `A random pick from ${classics.length} all-time classics.`
                  : "The classics catalogue isn't available right now."}
              </span>
            </button>
          </div>
        ) : phase.kind === "spinning" ? (
          <div className="flex flex-col items-center py-4" aria-live="polite" aria-busy>
            <RouletteIcon className="h-14 w-14" spinning />
            <div className="mt-4 w-36">
              <GameCover game={phase.shown} showTitle={false} />
            </div>
            <p className="mt-3 h-5 max-w-full truncate text-sm text-muted">{phase.shown.title}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center" aria-live="polite">
            <p className="text-xs font-semibold tracking-[0.12em] text-accent uppercase">Your next game</p>
            <Link href={`/games/${phase.game.slug}`} className="mt-3 block w-40" onClick={close}>
              <GameCover game={phase.game} className="shadow-2xl shadow-accent/20 ring-2 ring-accent/60" />
            </Link>
            <h3 className="mt-4 text-xl font-semibold">{phase.game.title}</h3>
            <p className="text-sm text-muted">{releaseYear(phase.game.releaseDate)}</p>
            <PlatformBadges platforms={phase.game.platforms} className="mt-2 justify-center" />
            <div className="mt-5 grid w-full max-w-sm grid-cols-2 gap-2">
              <Link href={`/games/${phase.game.slug}`} onClick={close} className={buttonClasses("primary", "md")}>
                <ExternalLink className="h-4 w-4" /> Open game
              </Link>
              <Button variant="secondary" onClick={() => spin(phase.source)}>
                <RotateCcw className="h-4 w-4" /> Spin again
              </Button>
              {phase.source === "classics" ? <WishlistButton game={phase.game} variant="full" className="col-span-2 w-full" /> : null}
            </div>
            <button type="button" onClick={() => setPhase({ kind: "choose" })} className="mt-4 text-sm text-faint hover:text-fg">
              Choose another source
            </button>
          </div>
        )}
      </Dialog>
    </>
  );
}
