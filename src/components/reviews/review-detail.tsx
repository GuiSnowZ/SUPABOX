"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { LoadError } from "@/components/layout/require-user";
import { Comments } from "@/components/social/comments";
import { Container, EmptyState, Skeleton } from "@/components/ui/primitives";
import { getProfileById } from "@/features/app/selectors";
import { loaders, useAppState, useLoad } from "@/features/app/store";
import { ReviewCard } from "./review-card";
import { StoryShare } from "./story-share";
import { useT } from "@/i18n/client";

/** `/reviews/[id]`: one review with likes and its comment thread. */
export function ReviewDetail({ id }: { id: string }) {
  const t = useT();
  const state = useAppState();
  const status = useLoad(`review:${id}`, () => loaders.review(id));
  const review = state.reviews.find((r) => r.id === id);
  const game = review ? state.games[review.gameId] : undefined;
  const author = review ? getProfileById(state, review.userId) : undefined;

  if (status === "error" && !review) return <LoadError onRetry={() => void loaders.review(id)} />;
  if (!review || !game) {
    if (status === "ready" && !review) {
      return (
        <Container className="py-16">
          <EmptyState title={t.reviews.notFound} description={t.reviews.notFoundHint} />
        </Container>
      );
    }
    return (
      <Container className="max-w-3xl pt-10">
        <Skeleton className="h-40 w-full" />
      </Container>
    );
  }

  return (
    <Container className="max-w-3xl">
      <nav aria-label="Breadcrumb" className="pt-6 text-sm text-muted">
        <Link href={`/games/${game.slug}`} className="inline-flex items-center gap-1 hover:text-fg">
          <ChevronLeft className="h-4 w-4" /> {game.title}
        </Link>
      </nav>
      <div className="pb-6">
        <ReviewCard review={review} game={game} author={author} showAuthor full editable={review.userId === state.currentUserId} />
        <div className="mt-4">
          <StoryShare reviewId={review.id} version={review.updatedAt} gameTitle={game.title} gameSlug={game.slug} />
        </div>
      </div>
      <Comments kind="review" targetId={review.id} ownerId={review.userId} />
    </Container>
  );
}
