"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { GameCover } from "@/components/games/game-cover";
import { Avatar } from "@/components/ui/avatar";
import { getListGames, getProfileById } from "@/features/app/selectors";
import { useAppState } from "@/features/app/store";
import { pluralize } from "@/lib/utils";
import type { GameList } from "@/types";

/** Overlapping stack of the first few covers. */
export function CoverStack({ list, max = 5 }: { list: GameList; max?: number }) {
  const state = useAppState();
  const games = getListGames(state, list).slice(0, max);
  return (
    <div className="flex">
      {Array.from({ length: max }, (_, i) => {
        const g = games[i];
        return (
          <div
            key={i}
            className="w-1/5 shrink-0 [&:not(:first-child)]:-ml-[6%]"
            style={{ zIndex: max - i }}
          >
            {g ? (
              <GameCover game={g} showTitle={false} className="shadow-lg shadow-black/40" />
            ) : (
              <div className="aspect-[3/4] rounded-[var(--radius-cover)] border border-border bg-surface" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ListCard({ list }: { list: GameList }) {
  const state = useAppState();
  const author = getProfileById(state, list.userId);
  return (
    <article className="group">
      <Link href={`/lists/${list.id}`} className="block rounded-[var(--radius-card)]">
        <div className="transition-transform duration-200 group-hover:-translate-y-0.5">
          <CoverStack list={list} />
        </div>
        <h3 className="mt-3 flex items-center gap-1.5 font-semibold text-fg transition-colors group-hover:text-accent">
          {list.visibility === "private" ? <Lock className="h-3.5 w-3.5 text-faint" aria-label="Private" /> : null}
          <span className="truncate">{list.title}</span>
        </h3>
      </Link>
      <div className="mt-1 flex items-center gap-2 text-xs text-muted">
        {author ? (
          <Link href={`/users/${author.username}`} className="inline-flex items-center gap-1.5 hover:text-fg">
            <Avatar profile={author} size="xs" />
            {author.username}
          </Link>
        ) : null}
        <span className="text-faint">· {pluralize(list.items.length, "game")}</span>
      </div>
      {list.description ? <p className="mt-1.5 line-clamp-2 text-sm text-muted">{list.description}</p> : null}
    </article>
  );
}

export function ListGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}
