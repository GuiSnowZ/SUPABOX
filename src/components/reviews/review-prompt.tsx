"use client";

import { useState } from "react";
import { GameCover } from "@/components/games/game-cover";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { getUserReview } from "@/features/app/selectors";
import { useAppState } from "@/features/app/store";
import { closeReviewPrompt, useUI } from "@/features/app/ui-store";
import { releaseYear } from "@/lib/utils";
import { ReviewEditor } from "./review-editor";
import { StoryShare } from "./story-share";
import { useLocale, useT } from "@/i18n/client";

/**
 * Opens right after a game is marked Completed (anywhere on the site) and
 * asks for a star rating and an optional review, using the normal review editor.
 * Once saved, it shows the Stories image so the rating can be shared right away.
 */
export function ReviewPrompt() {
  const { reviewPromptGameId } = useUI();
  // A fresh prompt (and step) for every game it opens for.
  return <ReviewPromptDialog key={reviewPromptGameId ?? "closed"} gameId={reviewPromptGameId} />;
}

function ReviewPromptDialog({ gameId }: { gameId: string | null }) {
  const t = useT();
  const locale = useLocale();
  const state = useAppState();
  const [sharing, setSharing] = useState(false);
  const game = gameId ? state.games[gameId] : undefined;
  const existing = game ? getUserReview(state, state.currentUserId, game.id) : undefined;
  const shareable = sharing && game && existing;

  return (
    <Dialog
      open={Boolean(game)}
      onClose={closeReviewPrompt}
      title={game ? (shareable ? t.og.shareTitle(game.title) : t.reviews.finished(game.title)) : ""}
      description={shareable ? t.og.shareHint : t.reviews.finishedHint}
    >
      {shareable ? (
        <div className="space-y-5">
          <StoryShare
            reviewId={existing.id}
            version={existing.updatedAt}
            gameTitle={game.title}
            gameSlug={game.slug}
            preview
          />
          <div className="flex justify-center">
            <Button variant="ghost" onClick={closeReviewPrompt}>
              {t.og.done}
            </Button>
          </div>
        </div>
      ) : game ? (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <GameCover game={game} showTitle={false} className="w-12 shrink-0" />
            <div className="min-w-0">
              <p className="truncate font-medium">{game.title}</p>
              <p className="text-xs text-faint">{releaseYear(game.releaseDate, locale)}</p>
            </div>
          </div>
          <ReviewEditor
            key={game.id}
            game={game}
            existing={existing}
            onDone={closeReviewPrompt}
            onSaved={() => setSharing(true)}
          />
        </div>
      ) : null}
    </Dialog>
  );
}
