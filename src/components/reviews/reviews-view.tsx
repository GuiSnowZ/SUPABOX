"use client";

import { PenLine, Users } from "lucide-react";
import { useState } from "react";
import { ReviewCard } from "@/components/reviews/review-card";
import { RequireUser } from "@/components/layout/require-user";
import { ButtonLink } from "@/components/ui/button";
import { Container, EmptyState, PageHeader } from "@/components/ui/primitives";
import {
  getFollowingIds,
  getFollowingReviews,
  getProfileById,
  getReviewsByUser,
} from "@/features/app/selectors";
import { useAppState } from "@/features/app/store";
import { cn } from "@/lib/utils";

type Tab = "mine" | "following";

export function ReviewsView() {
  const state = useAppState();
  const [tab, setTab] = useState<Tab>("mine");

  return (
    <RequireUser message="Sign in to see your reviews and reviews from people you follow.">
      {(user) => {
        const mine = getReviewsByUser(state, user.id);
        const following = getFollowingReviews(state, user.id);
        const followsAnyone = getFollowingIds(state, user.id).length > 0;
        const tabs: Array<{ key: Tab; label: string; count: number }> = [
          { key: "mine", label: "My Reviews", count: mine.length },
          { key: "following", label: "Following", count: following.length },
        ];
        const reviews = tab === "mine" ? mine : following;

        return (
          <Container className="max-w-4xl">
            <PageHeader title="Reviews" description="Your thoughts, and what the people you follow are saying." />
            <div role="tablist" aria-label="Review views" className="mb-2 flex gap-6 border-b border-border">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  id={`tab-${t.key}`}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.key}
                  aria-controls={`panel-${t.key}`}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "-mb-px border-b-2 pb-3 text-sm font-medium transition-colors",
                    tab === t.key ? "border-accent text-fg" : "border-transparent text-muted hover:text-fg",
                  )}
                >
                  {t.label} <span className="ml-1 text-faint">{t.count}</span>
                </button>
              ))}
            </div>
            <p className="mb-2 text-xs text-faint">
              {tab === "mine" ? "Most recently published or edited first." : "Newest first."}
            </p>
            <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
              {reviews.length ? (
                reviews.map((r) => {
                  const game = state.games[r.gameId];
                  if (!game) return null;
                  return tab === "mine" ? (
                    <ReviewCard key={r.id} review={r} game={game} editable />
                  ) : (
                    <ReviewCard key={r.id} review={r} game={game} author={getProfileById(state, r.userId)} showAuthor />
                  );
                })
              ) : tab === "mine" ? (
                <EmptyState
                  className="mt-4"
                  icon={<PenLine />}
                  title="You haven't written any reviews"
                  description="Open any game you've played and rate or review it."
                  action={<ButtonLink href="/games">Find a game</ButtonLink>}
                />
              ) : (
                <EmptyState
                  className="mt-4"
                  icon={<Users />}
                  title={followsAnyone ? "No reviews from people you follow yet" : "You're not following anyone yet"}
                  description={
                    followsAnyone
                      ? "When people you follow publish reviews, they'll show up here."
                      : "Follow other players from their profiles to see their reviews here."
                  }
                  action={<ButtonLink href="/lists">Discover players through lists</ButtonLink>}
                />
              )}
            </div>
          </Container>
        );
      }}
    </RequireUser>
  );
}
