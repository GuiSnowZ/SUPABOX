"use client";

import { GameCover } from "@/components/games/game-cover";
import { Dialog } from "@/components/ui/dialog";
import { getUserReview } from "@/features/app/selectors";
import { useAppState } from "@/features/app/store";
import { closeReviewPrompt, useUI } from "@/features/app/ui-store";
import { releaseYear } from "@/lib/utils";
import { ReviewEditor } from "./review-editor";

/**
 * Opens right after a game is marked Completed (anywhere on the site) and
 * asks for a star rating and an optional review, using the normal review editor.
 */
export function ReviewPrompt() {
  const { reviewPromptGameId } = useUI();
  const state = useAppState();
  const game = reviewPromptGameId ? state.games[reviewPromptGameId] : undefined;
  const existing = game ? getUserReview(state, state.currentUserId, game.id) : undefined;

  return (
    <Dialog
      open={Boolean(game)}
      onClose={closeReviewPrompt}
      title={game ? `You finished ${game.title}!` : ""}
      description="How was it? Rate it and, if you like, write a few words."
    >
      {game ? (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <GameCover game={game} showTitle={false} className="w-12 shrink-0" />
            <div className="min-w-0">
              <p className="truncate font-medium">{game.title}</p>
              <p className="text-xs text-faint">{releaseYear(game.releaseDate)}</p>
            </div>
          </div>
          <ReviewEditor key={game.id} game={game} existing={existing} onDone={closeReviewPrompt} />
        </div>
      ) : null}
    </Dialog>
  );
}
