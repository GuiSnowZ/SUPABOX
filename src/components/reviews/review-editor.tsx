"use client";

import { Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { Checkbox, FormError, Label, Textarea } from "@/components/ui/form";
import { StarRatingInput } from "@/components/ui/star-rating";
import { MAX_REVIEW_LENGTH } from "@/features/app/state";
import { actions } from "@/features/app/store";
import { toast } from "@/features/app/ui-store";
import type { Game, Review } from "@/types";

/**
 * Create/edit form for the current user's review of a game.
 * Rating and text are independent: either (or both) is enough to publish.
 */
export function ReviewEditor({
  game,
  existing,
  onDone,
}: {
  game: Game;
  existing?: Review;
  onDone?: () => void;
}) {
  const [rating, setRating] = useState<number | null>(existing?.rating ?? null);
  const [body, setBody] = useState(existing?.body ?? "");
  const [spoilers, setSpoilers] = useState(existing?.containsSpoilers ?? false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    const r = await actions.upsertReview({ gameId: game.id, rating, body, containsSpoilers: spoilers });
    setPending(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setError(null);
    toast(existing ? "Review updated" : "Review published");
    onDone?.();
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="review-rating">Rating</Label>
        <StarRatingInput id="review-rating" value={rating} onChange={setRating} />
        <p className="mt-1 text-xs text-faint">Optional. Click a star&apos;s left half for a half star. Click again to clear.</p>
      </div>
      <div>
        <Label htmlFor="review-body">Review</Label>
        <Textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={`What did you think of ${game.title}? (optional)`}
          maxLength={MAX_REVIEW_LENGTH}
          rows={5}
        />
        <div className="mt-1.5 flex items-center justify-between gap-4">
          <Checkbox
            label="Contains spoilers"
            checked={spoilers}
            onChange={(e) => setSpoilers(e.target.checked)}
            disabled={!body.trim()}
          />
          <span className="text-xs tabular-nums text-faint">
            {body.length}/{MAX_REVIEW_LENGTH}
          </span>
        </div>
      </div>
      <FormError>{error}</FormError>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : existing ? "Save changes" : "Publish"}
        </Button>
        {onDone ? (
          <Button variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        ) : null}
        {existing ? (
          <span className="ml-auto">
            <ConfirmButton
              prompt="Delete your review?"
              onConfirm={async () => {
                const r = await actions.deleteReview(existing.id);
                toast(r.ok ? "Review deleted" : r.error, r.ok ? "default" : "error");
                onDone?.();
              }}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </ConfirmButton>
          </span>
        ) : null}
      </div>
    </form>
  );
}
