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
import { useT } from "@/i18n/client";

type Tab = "mine" | "following";

export function ReviewsView() {
  const t = useT();
  const state = useAppState();
  const [tab, setTab] = useState<Tab>("mine");

  return (
    <RequireUser message={t.reviews.signIn}>
      {(user) => {
        const mine = getReviewsByUser(state, user.id);
        const following = getFollowingReviews(state, user.id);
        const followsAnyone = getFollowingIds(state, user.id).length > 0;
        const tabs: Array<{ key: Tab; label: string; count: number }> = [
          { key: "mine", label: t.reviews.mine, count: mine.length },
          { key: "following", label: t.reviews.following, count: following.length },
        ];
        const reviews = tab === "mine" ? mine : following;

        return (
          <Container className="max-w-4xl">
            <PageHeader title={t.reviews.title} description={t.reviews.description} />
            <div role="tablist" aria-label={t.reviews.tabsLabel} className="mb-2 flex gap-6 border-b border-border">
              {tabs.map((item) => (
                <button
                  key={item.key}
                  id={`tab-${item.key}`}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.key}
                  aria-controls={`panel-${item.key}`}
                  onClick={() => setTab(item.key)}
                  className={cn(
                    "-mb-px border-b-2 pb-3 text-sm font-medium transition-colors",
                    tab === item.key ? "border-accent text-fg" : "border-transparent text-muted hover:text-fg",
                  )}
                >
                  {item.label} <span className="ml-1 text-faint">{item.count}</span>
                </button>
              ))}
            </div>
            <p className="mb-2 text-xs text-faint">
              {tab === "mine" ? t.reviews.mineOrder : t.reviews.followingOrder}
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
                  title={t.reviews.noneMine}
                  description={t.reviews.noneMineHint}
                  action={<ButtonLink href="/games">{t.reviews.findGame}</ButtonLink>}
                />
              ) : (
                <EmptyState
                  className="mt-4"
                  icon={<Users />}
                  title={followsAnyone ? t.reviews.noneFollowing : t.reviews.notFollowing}
                  description={
                    followsAnyone
                      ? t.reviews.noneFollowingHint
                      : t.reviews.notFollowingHint
                  }
                  action={<ButtonLink href="/lists">{t.reviews.discover}</ButtonLink>}
                />
              )}
            </div>
          </Container>
        );
      }}
    </RequireUser>
  );
}
