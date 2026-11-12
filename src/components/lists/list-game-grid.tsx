"use client";

import { useMemo, useState } from "react";
import { CriticScore } from "@/components/games/critic-score";
import { GameCover } from "@/components/games/game-cover";
import { SectionHeader } from "@/components/ui/primitives";
import { formatReleaseDate } from "@/lib/utils";
import type { Game } from "@/types";
import { ListCarouselDialog } from "./game-carousel";
import { useLocale, useT } from "@/i18n/client";
import { officialSection } from "@/i18n/official-lists";

export interface ListGridEntry {
  game: Game;
  section?: string | null;
  note?: string | null;
}

/**
 * The games of a list (community or official). Clicking a game opens the
 * carousel at that game, to browse the whole list one by one and act on each.
 */
export function ListGameGrid({ title, entries, ranked = true }: { title: string; entries: ListGridEntry[]; ranked?: boolean }) {
  const t = useT();
  const locale = useLocale();
  const [open, setOpen] = useState<number | null>(null);
  const games = useMemo(() => entries.map((e) => e.game), [entries]);
  const labels = useMemo(
    () =>
      entries.map((e, i) => [ranked ? `#${i + 1}` : null, officialSection(e.section, locale), e.note].filter(Boolean).join(" · ") || null),
    [entries, ranked, locale],
  );

  // Group consecutive entries that share a section ("1990s", "2014"…).
  const groups: Array<{ section: string | null; items: Array<{ entry: ListGridEntry; index: number }> }> = [];
  entries.forEach((entry, index) => {
    const section = entry.section ?? null;
    const last = groups.at(-1);
    if (last && last.section === section) last.items.push({ entry, index });
    else groups.push({ section, items: [{ entry, index }] });
  });

  return (
    <>
      <div className="space-y-10">
        {groups.map((group, gi) => (
          <section key={`${group.section ?? "all"}-${gi}`} aria-label={officialSection(group.section, locale) ?? undefined}>
            {group.section ? <SectionHeader title={officialSection(group.section, locale) ?? ""} count={group.items.length} /> : null}
            <ol className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {group.items.map(({ entry, index }, i) => (
                <li key={`${entry.game.id}-${index}`}>
                  <button
                    type="button"
                    onClick={() => setOpen(index)}
                    className="group block w-full text-left"
                    aria-label={t.lists.browseFromHere(entry.game.title)}
                  >
                    <div className="relative transition-transform duration-200 group-hover:-translate-y-0.5">
                      <GameCover game={entry.game} className="transition group-hover:ring-2 group-hover:ring-accent/60" />
                      {ranked ? (
                        <span className="absolute top-2 left-2 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-semibold text-white tabular-nums backdrop-blur">
                          {group.section ? i + 1 : index + 1}
                        </span>
                      ) : null}
                      <CriticScore game={entry.game} className="absolute bottom-2 left-2" />
                    </div>
                    <h3 className="mt-2.5 truncate text-sm font-medium text-fg group-hover:text-accent">{entry.game.title}</h3>
                    <p className="mt-0.5 truncate text-xs text-muted">{entry.note ?? formatReleaseDate(entry.game.releaseDate, locale)}</p>
                  </button>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
      <ListCarouselDialog title={title} games={games} labels={labels} index={open} onClose={() => setOpen(null)} />
    </>
  );
}
