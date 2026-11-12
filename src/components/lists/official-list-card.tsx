"use client";

import Link from "next/link";
import { GameCover } from "@/components/games/game-cover";
import { LogoMark } from "@/components/layout/logo";
import { useLocale, useT } from "@/i18n/client";
import { officialListText } from "@/i18n/official-lists";
import type { OfficialListSummary } from "@/lib/official-lists/server";

/** "Official" marker: the Supabox mark plus a label, so these never look like community lists. */
export function OfficialBadge({ className = "" }: { className?: string }) {
  const t = useT();
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border border-accent/40 bg-accent/12 px-1.5 py-0.5 text-[11px] font-semibold text-accent ${className}`}
    >
      <LogoMark className="h-3.5 w-3.5" /> {t.lists.officialBadge}
    </span>
  );
}

export function OfficialListCard({ list }: { list: OfficialListSummary }) {
  const t = useT();
  const text = officialListText(list, useLocale());
  return (
    <article className="group">
      <Link
        href={`/lists/official/${list.slug}`}
        className="block rounded-[var(--radius-card)] border border-accent/20 bg-gradient-to-b from-accent/[0.07] to-transparent p-3 transition-colors hover:border-accent/50"
      >
        <div className="flex transition-transform duration-200 group-hover:-translate-y-0.5">
          {Array.from({ length: 5 }, (_, i) => {
            const g = list.covers[i];
            return (
              <div key={i} className="w-1/5 shrink-0 [&:not(:first-child)]:-ml-[6%]" style={{ zIndex: 5 - i }}>
                {g ? (
                  <GameCover game={g} showTitle={false} className="shadow-lg shadow-black/40" />
                ) : (
                  <div className="aspect-[3/4] rounded-[var(--radius-cover)] border border-border bg-surface" />
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <OfficialBadge />
          <span className="text-xs text-faint">{t.common.games(list.count)}</span>
        </div>
        <h3 className="mt-1.5 truncate font-semibold text-fg transition-colors group-hover:text-accent">{text.title}</h3>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted">{text.description}</p>
      </Link>
    </article>
  );
}
