"use client";

import { Bookmark, BookmarkCheck, Check } from "lucide-react";
import { getUserGame } from "@/features/app/selectors";
import { actions, registerGames, useAppState } from "@/features/app/store";
import { promptSignIn, toast } from "@/features/app/ui-store";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/client";
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
  game: Game;
  variant?: "overlay" | "full";
  className?: string;
}) {
  const t = useT();
  const state = useAppState();
  const entry = getUserGame(state, state.currentUserId, game.id);
  const wishlisted = entry?.status === "want_to_play";
  const otherStatus = entry && !wishlisted ? entry.status : null;

  async function onClick() {
    if (!state.authReady) return;
    if (!state.currentUserId) {
      promptSignIn(t.wishlist.signIn(game.title));
      return;
    }
    if (otherStatus) {
      toast(t.wishlist.alreadyIn(game.title, t.status[otherStatus]));
      return;
    }
    registerGames([game]);
    const result = await actions.toggleWishlist(game.id);
    if (!result.ok) toast(result.error, "error");
    else toast(wishlisted ? t.wishlist.removed(game.title) : t.wishlist.added(game.title));
  }

  const label = otherStatus
    ? `${game.title}: ${t.status[otherStatus]}`
    : wishlisted
      ? t.wishlist.removeLabel(game.title)
      : t.wishlist.addLabel(game.title);

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
        {otherStatus ? t.wishlist.inLibrary(t.status[otherStatus]) : wishlisted ? t.wishlist.inWantToPlay : t.wishlist.wantToPlay}
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
