"use client";

import { Bookmark, BookmarkCheck, Check } from "lucide-react";
import { getUserGame } from "@/features/app/selectors";
import { actions, useAppState } from "@/features/app/store";
import { promptSignIn, toast } from "@/features/app/ui-store";
import { STATUS_LABEL } from "@/lib/library";
import { cn } from "@/lib/utils";
import type { Game } from "@/types";

/**
 * Quick wishlist toggle. The wishlist is the "Want to Play" library status.
 * If the game already has another status, the button shows that status
 * instead of overwriting it.
 */
export function WishlistButton({
  game,
  variant = "overlay",
  className,
}: {
  game: Pick<Game, "id" | "title">;
  variant?: "overlay" | "full";
  className?: string;
}) {
  const state = useAppState();
  const entry = getUserGame(state, state.currentUserId, game.id);
  const wishlisted = entry?.status === "want_to_play";
  const otherStatus = entry && !wishlisted ? entry.status : null;

  async function onClick() {
    if (!state.authReady) return;
    if (!state.currentUserId) {
      promptSignIn(`Sign in to save ${game.title} to your wishlist.`);
      return;
    }
    if (otherStatus) {
      toast(`${game.title} is already in your library as ${STATUS_LABEL[otherStatus]}.`);
      return;
    }
    const result = await actions.toggleWishlist(game.id);
    if (!result.ok) toast(result.error, "error");
    else toast(wishlisted ? `Removed ${game.title} from your wishlist` : `Added ${game.title} to your wishlist`);
  }

  const label = otherStatus
    ? `${game.title}: ${STATUS_LABEL[otherStatus]}`
    : wishlisted
      ? `Remove ${game.title} from wishlist`
      : `Add ${game.title} to wishlist`;

  const Icon = otherStatus ? Check : wishlisted ? BookmarkCheck : Bookmark;

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={wishlisted}
        aria-label={label}
        className={cn(
          "inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors",
          wishlisted
            ? "border-accent/40 bg-accent/12 text-accent hover:bg-accent/20"
            : "border-border bg-surface text-fg hover:border-border-strong hover:bg-surface-hover",
          otherStatus && "text-muted",
          className,
        )}
      >
        <Icon className={cn("h-4 w-4", wishlisted && "fill-current")} />
        {otherStatus ? `In library · ${STATUS_LABEL[otherStatus]}` : wishlisted ? "On your wishlist" : "Add to wishlist"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={wishlisted}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-all duration-150 active:scale-90",
        wishlisted
          ? "bg-accent text-accent-fg shadow-sm"
          : otherStatus
            ? "bg-black/60 text-accent"
            : "bg-black/55 text-white hover:bg-black/75",
        className,
      )}
    >
      <Icon className={cn("h-4 w-4", wishlisted && "fill-current")} strokeWidth={2.25} />
    </button>
  );
}
