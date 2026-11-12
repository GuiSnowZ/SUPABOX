"use client";

import { Eye, MessageCircle, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { GameCover } from "@/components/games/game-cover";
import { LikeButton } from "@/components/social/like-button";
import { Avatar } from "@/components/ui/avatar";
import { buttonClasses } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { Badge } from "@/components/ui/primitives";
import { StarRating } from "@/components/ui/star-rating";
import { actions } from "@/features/app/store";
import { toast } from "@/features/app/ui-store";
import { cn, formatDate } from "@/lib/utils";
import { useLocale, useT } from "@/i18n/client";
import type { Game, Profile, Review } from "@/types";

export function ReviewBody({ review, clamp = false }: { review: Review; clamp?: boolean }) {
  const t = useT();
  const [revealed, setRevealed] = useState(false);
  if (!review.body) return <p className="text-sm text-faint italic">{t.reviews.ratedOnly}</p>;
  if (review.containsSpoilers && !revealed) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-bg/40 px-3 py-2.5 text-sm">
        <span className="text-muted">{t.reviews.hasSpoilers}</span>{" "}
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
        >
          <Eye className="h-3.5 w-3.5" /> {t.reviews.showReview}
        </button>
      </div>
    );
  }
  return (
    <p className={cn("text-sm leading-relaxed whitespace-pre-line text-fg/90", clamp && "line-clamp-4")}>
      {review.body}
    </p>
  );
}

/**
 * A review with its game. `showAuthor` for social contexts; `editable` adds
 * Edit/Delete for the owner (ownership is re-checked in the state layer).
 */
export function ReviewCard({
  review,
  game,
  author,
  showAuthor = false,
  showGame = true,
  editable = false,
  full = false,
}: {
  review: Review;
  game: Game;
  author?: Profile;
  showAuthor?: boolean;
  showGame?: boolean;
  editable?: boolean;
  /** On the review's own page: never clamp the text, and no "comments" link. */
  full?: boolean;
}) {
  const t = useT();
  const locale = useLocale();
  const edited = review.updatedAt !== review.createdAt;
  return (
    <article className="flex gap-4 border-b border-border py-5 last:border-b-0">
      {showGame ? (
        <Link href={`/games/${game.slug}`} className="w-16 shrink-0 sm:w-20" aria-label={game.title}>
          <GameCover game={game} showTitle={false} />
        </Link>
      ) : null}
      <div className="min-w-0 flex-1">
        {showAuthor && author ? (
          <Link
            href={`/users/${author.username}`}
            className="mb-2 inline-flex items-center gap-2 text-sm text-muted hover:text-fg"
          >
            <Avatar profile={author} size="xs" />
            <span className="font-medium text-fg">{author.displayName}</span>
            <span className="text-faint">@{author.username}</span>
          </Link>
        ) : null}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {showGame ? (
            <Link href={`/games/${game.slug}`} className="font-semibold text-fg hover:text-accent">
              {game.title}
            </Link>
          ) : null}
          {review.rating !== null ? <StarRating value={review.rating} /> : null}
          {review.containsSpoilers ? <Badge tone="warning">{t.reviews.spoilers}</Badge> : null}
        </div>
        <p className="mt-1 text-xs text-faint">
          <time dateTime={review.createdAt}>{formatDate(review.createdAt, locale)}</time>
          {edited ? <span> · {t.reviews.edited(formatDate(review.updatedAt, locale))}</span> : null}
        </p>
        <div className="mt-2.5">
          <ReviewBody review={review} clamp={!editable && !full} />
        </div>
        <div className="mt-2 -ml-2 flex items-center gap-1">
          <LikeButton kind="review" targetId={review.id} count={review.likeCount ?? 0} />
          {full ? null : (
            <Link
              href={`/reviews/${review.id}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted hover:text-fg"
              aria-label={t.reviews.comments(review.commentCount ?? 0)}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span className="tabular-nums">{review.commentCount ? review.commentCount : t.reviews.comment}</span>
            </Link>
          )}
        </div>
        {editable ? (
          <div className="mt-3 flex flex-wrap items-center gap-1">
            <Link href={`/games/${game.slug}#your-review`} className={buttonClasses("ghost", "sm")}>
              <Pencil className="h-3.5 w-3.5" /> {t.reviews.edit}
            </Link>
            <ConfirmButton
              prompt={t.reviews.deleteThis}
              onConfirm={async () => {
                const r = await actions.deleteReview(review.id);
                toast(r.ok ? t.reviews.deleted : r.error, r.ok ? "default" : "error");
              }}
            >
              <Trash2 className="h-3.5 w-3.5" /> {t.common.delete}
            </ConfirmButton>
          </div>
        ) : null}
      </div>
    </article>
  );
}
