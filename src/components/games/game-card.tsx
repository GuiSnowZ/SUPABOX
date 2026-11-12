import Link from "next/link";
import type { ReactNode } from "react";
import { cn, formatReleaseDate } from "@/lib/utils";
import type { Game } from "@/types";
import { CriticScore } from "./critic-score";
import { GameCover } from "./game-cover";
import { WishlistButton } from "./wishlist-button";

/** Shortens long platform lists: "PC, PS5 +2". */
const SHORT: Record<string, string> = {
  "PlayStation 5": "PS5",
  "Xbox Series X|S": "Xbox",
  "Nintendo Switch 2": "Switch 2",
  "Nintendo Switch": "Switch",
};

export function platformSummary(platforms: string[], max = 2): string {
  const names = platforms.map((p) => SHORT[p] ?? p);
  return names.length > max ? `${names.slice(0, max).join(", ")} +${names.length - max}` : names.join(", ");
}

export function GameCard({
  game,
  showWishlist = true,
  showMeta = true,
  footer,
  className,
}: {
  game: Game;
  showWishlist?: boolean;
  showMeta?: boolean;
  /** Extra content under the meta row (e.g. a rating). */
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <article className={cn("group relative", className)}>
      <Link
        href={`/games/${game.slug}`}
        className="block rounded-[var(--radius-cover)] focus-visible:outline-offset-4"
      >
        <div className="relative transition-transform duration-200 group-hover:-translate-y-0.5">
          <GameCover
            game={game}
            className="transition-shadow duration-200 group-hover:ring-2 group-hover:ring-accent/60"
          />
          {showMeta ? <CriticScore game={game} className="absolute bottom-2 left-2" /> : null}
        </div>
        {showMeta ? (
          <div className="mt-2.5 min-w-0">
            <h3 className="truncate text-sm font-medium text-fg transition-colors group-hover:text-accent">
              {game.title}
            </h3>
            <p className="mt-0.5 truncate text-xs text-muted">
              <time dateTime={game.releaseDate ?? undefined}>{formatReleaseDate(game.releaseDate)}</time>
              {game.platforms.length ? <span className="text-faint"> · {platformSummary(game.platforms)}</span> : null}
            </p>
          </div>
        ) : (
          <span className="sr-only">{game.title}</span>
        )}
      </Link>
      {footer ? <div className="mt-1">{footer}</div> : null}
      {showWishlist ? (
        <div className="absolute top-2 right-2 opacity-100 transition-opacity sm:opacity-90 sm:group-hover:opacity-100">
          <WishlistButton game={game} />
        </div>
      ) : null}
    </article>
  );
}

export function GameGrid({
  children,
  className,
  dense = false,
}: {
  children: ReactNode;
  className?: string;
  dense?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid gap-x-4 gap-y-6",
        dense
          ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8"
          : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function GameGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <GameGrid>
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <div className="animate-skeleton aspect-[3/4] rounded-[var(--radius-cover)] bg-surface" />
          <div className="animate-skeleton mt-2.5 h-3.5 w-3/4 rounded bg-surface" />
          <div className="animate-skeleton mt-1.5 h-3 w-1/2 rounded bg-surface" />
        </div>
      ))}
    </GameGrid>
  );
}
