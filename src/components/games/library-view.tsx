"use client";

import { BookMarked, Library } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { GameCard, GameGrid } from "@/components/games/game-card";
import { RequireUser } from "@/components/layout/require-user";
import { ButtonLink } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { Badge, Container, EmptyState, PageHeader } from "@/components/ui/primitives";
import { StarRating } from "@/components/ui/star-rating";
import { getLibrary, type LibraryEntry } from "@/features/app/selectors";
import { useAppState } from "@/features/app/store";
import { LIBRARY_STATUSES, STATUS_LABEL, STATUS_TONE } from "@/lib/library";
import { cn, pluralize } from "@/lib/utils";
import type { LibraryStatus, Review } from "@/types";

type Sort = "recent" | "title" | "release_desc" | "release_asc" | "rating";

const SORT_LABEL: Record<Sort, string> = {
  recent: "Recently updated",
  title: "Title (A–Z)",
  release_desc: "Release date (newest)",
  release_asc: "Release date (oldest)",
  rating: "Your rating",
};

function sortEntries(entries: LibraryEntry[], sort: Sort, ratings: Map<string, number>): LibraryEntry[] {
  const copy = [...entries];
  const rel = (e: LibraryEntry) => e.game.releaseDate ?? "9999";
  switch (sort) {
    case "title":
      return copy.sort((a, b) => a.game.title.localeCompare(b.game.title));
    case "release_desc":
      return copy.sort((a, b) => rel(b).localeCompare(rel(a)));
    case "release_asc":
      return copy.sort((a, b) => rel(a).localeCompare(rel(b)));
    case "rating":
      return copy.sort((a, b) => (ratings.get(b.game.id) ?? -1) - (ratings.get(a.game.id) ?? -1));
    default:
      return copy.sort((a, b) => b.entry.updatedAt.localeCompare(a.entry.updatedAt));
  }
}

function ratingMap(reviews: Review[], userId: string) {
  return new Map(
    reviews.filter((r) => r.userId === userId && r.rating !== null).map((r) => [r.gameId, r.rating as number]),
  );
}

function SortSelect({ value, onChange, options }: { value: Sort; onChange: (s: Sort) => void; options: Sort[] }) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="library-sort" className="text-sm text-muted">
        Sort
      </label>
      <Select id="library-sort" value={value} onChange={(e) => onChange(e.target.value as Sort)} className="w-auto">
        {options.map((o) => (
          <option key={o} value={o}>
            {SORT_LABEL[o]}
          </option>
        ))}
      </Select>
    </div>
  );
}

export function LibraryView() {
  const state = useAppState();
  const [filter, setFilter] = useState<LibraryStatus | "all">("all");
  const [sort, setSort] = useState<Sort>("recent");

  return (
    <RequireUser message="Sign in to see your library.">
      {(user) => {
        const all = getLibrary(state, user.id);
        const counts = Object.fromEntries(
          LIBRARY_STATUSES.map((s) => [s, all.filter((e) => e.entry.status === s).length]),
        ) as Record<LibraryStatus, number>;
        const ratings = ratingMap(state.reviews, user.id);
        const shown = sortEntries(
          filter === "all" ? all : all.filter((e) => e.entry.status === filter),
          sort,
          ratings,
        );
        const tabs: Array<{ key: LibraryStatus | "all"; label: string; count: number }> = [
          { key: "all", label: "All", count: all.length },
          ...LIBRARY_STATUSES.map((s) => ({ key: s, label: STATUS_LABEL[s], count: counts[s] })),
        ];

        return (
          <Container>
            <PageHeader
              title="Your library"
              description="Everything you've played, are playing, or want to play."
              actions={
                <ButtonLink href="/library/wishlist" variant="secondary" size="sm">
                  <BookMarked className="h-4 w-4" /> Wishlist · {counts.want_to_play}
                </ButtonLink>
              }
            />
            <div className="mb-6 flex flex-col gap-4 border-b border-border pb-4 lg:flex-row lg:items-center lg:justify-between">
              <div role="tablist" aria-label="Filter by status" className="-mx-1 flex gap-1 overflow-x-auto px-1">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    role="tab"
                    aria-selected={filter === t.key}
                    onClick={() => setFilter(t.key)}
                    className={cn(
                      "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                      filter === t.key ? "bg-fg text-bg" : "text-muted hover:bg-surface hover:text-fg",
                    )}
                  >
                    {t.label} <span className="ml-0.5 opacity-60">{t.count}</span>
                  </button>
                ))}
              </div>
              <SortSelect value={sort} onChange={setSort} options={["recent", "title", "release_desc", "release_asc", "rating"]} />
            </div>
            {shown.length ? (
              <GameGrid>
                {shown.map(({ game, entry }) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    showWishlist={false}
                    footer={
                      <div className="flex items-center gap-2">
                        <Badge tone={STATUS_TONE[entry.status]}>{STATUS_LABEL[entry.status]}</Badge>
                        {ratings.has(game.id) ? <StarRating value={ratings.get(game.id)!} size="xs" /> : null}
                      </div>
                    }
                  />
                ))}
              </GameGrid>
            ) : (
              <EmptyState
                icon={<Library />}
                title={filter === "all" ? "Your library is empty" : `Nothing marked as ${STATUS_LABEL[filter as LibraryStatus]}`}
                description="Find games on the Games page and add them with one tap."
                action={<ButtonLink href="/games">Browse games</ButtonLink>}
              />
            )}
          </Container>
        );
      }}
    </RequireUser>
  );
}

export function WishlistView() {
  const state = useAppState();
  const [sort, setSort] = useState<Sort>("recent");
  const options: Sort[] = useMemo(() => ["recent", "title", "release_desc", "release_asc"], []);

  return (
    <RequireUser message="Sign in to see your wishlist.">
      {(user) => {
        const entries = sortEntries(getLibrary(state, user.id, "want_to_play"), sort, new Map());
        return (
          <Container>
            <nav aria-label="Breadcrumb" className="pt-6 text-sm text-muted">
              <Link href="/library" className="hover:text-fg">
                Library
              </Link>{" "}
              / <span className="text-fg">Wishlist</span>
            </nav>
            <PageHeader
              title="Wishlist"
              description={`${pluralize(entries.length, "game")} you want to play. Saving a game marks it as “Want to Play” in your library.`}
            />
            <div className="mb-6 flex justify-end border-b border-border pb-4">
              <SortSelect value={sort} onChange={setSort} options={options} />
            </div>
            {entries.length ? (
              <GameGrid>
                {entries.map(({ game }) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </GameGrid>
            ) : (
              <EmptyState
                icon={<BookMarked />}
                title="Your wishlist is empty"
                description="Tap the bookmark on any game to save it for later."
                action={<ButtonLink href="/games">Discover games</ButtonLink>}
              />
            )}
          </Container>
        );
      }}
    </RequireUser>
  );
}
