"use client";

import { Heart } from "lucide-react";
import { actions, useAppState } from "@/features/app/store";
import { promptSignIn, toast } from "@/features/app/ui-store";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/client";

/** Heart + count for a review or list. Optimistic; rolls back if the save fails. */
export function LikeButton({
  kind,
  targetId,
  count = 0,
  size = "sm",
  className,
}: {
  kind: "review" | "list";
  targetId: string;
  count?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const t = useT();
  const state = useAppState();
  const liked = state.liked[kind === "review" ? "reviews" : "lists"].includes(targetId);

  async function onClick() {
    if (!state.authReady) return;
    if (!state.currentUserId) return promptSignIn(t.social.signInLike(kind));
    const r = await actions.toggleLike(kind, targetId);
    if (!r.ok) toast(r.error, "error");
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={liked}
      aria-label={t.social.likeLabel(liked, kind, count)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg font-medium transition-colors",
        size === "md" ? "h-10 border border-border px-3 text-sm hover:border-border-strong" : "h-8 px-2 text-xs",
        liked ? "text-[#ff5d7a]" : "text-muted hover:text-fg",
        className,
      )}
    >
      <Heart className={cn(size === "md" ? "h-4 w-4" : "h-3.5 w-3.5", liked && "fill-current")} />
      <span className="tabular-nums">{count > 0 ? count : size === "md" ? t.social.like : ""}</span>
    </button>
  );
}
