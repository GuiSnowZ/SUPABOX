import { cn, pluralize } from "@/lib/utils";
import type { Game } from "@/types";

/** Colour tier commonly used for 0–100 critic scores. */
function tier(score: number) {
  if (score >= 75) return "bg-accent text-accent-fg";
  if (score >= 50) return "bg-star text-[#2a2208]";
  return "bg-danger text-white";
}

/**
 * Average professional critic score (IGDB aggregate of outlet reviews).
 * "badge" = compact square for covers; "full" = labelled block for game pages.
 */
export function CriticScore({
  game,
  variant = "badge",
  className,
}: {
  game: Pick<Game, "criticScore" | "criticCount">;
  variant?: "badge" | "full";
  className?: string;
}) {
  if (game.criticScore === null) return null;
  const label = `Critic score ${game.criticScore} out of 100, from ${pluralize(game.criticCount, "review")}`;

  if (variant === "badge") {
    return (
      <span
        title={label}
        aria-label={label}
        className={cn(
          "inline-flex h-7 min-w-7 items-center justify-center rounded-md px-1 text-xs font-bold tabular-nums shadow-md shadow-black/40",
          tier(game.criticScore),
          className,
        )}
      >
        {game.criticScore}
      </span>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-3", className)} aria-label={label}>
      <span
        aria-hidden
        className={cn(
          "inline-flex h-12 w-12 items-center justify-center rounded-lg text-xl font-bold tabular-nums",
          tier(game.criticScore),
        )}
      >
        {game.criticScore}
      </span>
      <span className="text-sm leading-tight">
        <span className="block font-medium text-fg">Critic score</span>
        <span className="block text-xs text-muted">
          Average of {pluralize(game.criticCount, "review")}
        </span>
      </span>
    </div>
  );
}
