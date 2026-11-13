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
import { useT } from "@/i18n/client";

/**
 * Create/edit form for the current user's review of a game.
 * Rating and text are independent: either (or both) is enough to publish.
 */
export function ReviewEditor({
  game,
  existing,
  onDone,
  onSaved,
}: {
  game: Game;
  existing?: Review;
  /** Called when the editor closes (cancel, delete, or after saving if there's no onSaved). */
  onDone?: () => void;
  /** Called after a successful save instead of onDone. */
  onSaved?: () => void;
}) {
  const t = useT();
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
    toast(existing ? t.reviews.updated : t.reviews.published);
    if (onSaved) onSaved();
    else onDone?.();
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="review-rating">{t.reviews.rating}</Label>
        <StarRatingInput id="review-rating" value={rating} onChange={setRating} />
        <p className="mt-1 text-xs text-faint">{t.reviews.ratingHint}</p>
      </div>
      <div>
        <Label htmlFor="review-body">{t.reviews.review}</Label>
        <Textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t.reviews.placeholder(game.title)}
          maxLength={MAX_REVIEW_LENGTH}
          rows={5}
        />
        <div className="mt-1.5 flex items-center justify-between gap-4">
          <Checkbox
            label={t.reviews.containsSpoilers}
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
          {pending ? t.common.saving : existing ? t.reviews.saveChanges : t.reviews.publish}
        </Button>
        {onDone ? (
          <Button variant="ghost" onClick={onDone}>
            {t.common.cancel}
          </Button>
        ) : null}
        {existing ? (
          <span className="ml-auto">
            <ConfirmButton
              prompt={t.reviews.deleteYours}
              onConfirm={async () => {
                const r = await actions.deleteReview(existing.id);
                toast(r.ok ? t.reviews.deleted : r.error, r.ok ? "default" : "error");
                onDone?.();
              }}
            >
              <Trash2 className="h-3.5 w-3.5" /> {t.common.delete}
            </ConfirmButton>
          </span>
        ) : null}
      </div>
    </form>
  );
}
