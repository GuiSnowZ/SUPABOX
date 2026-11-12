"use client";

import Link from "next/link";
import { SectionHeader } from "@/components/ui/primitives";
import type { Game } from "@/types";
import { useT } from "@/i18n/client";
import { GameCover } from "./game-cover";
import { PlatformBadges } from "./platform-badges";

/** "Out today": cover, title and platforms of games released today. Hidden on days with none. */
export function TodaysReleases({ games }: { games: Game[] }) {
  const t = useT();
  if (!games.length) return null;
  return (
    <section aria-labelledby="today-heading">
      <SectionHeader id="today-heading" title={t.games.outToday} count={games.length} />
      <ul className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 lg:grid-cols-6">
        {games.map((g) => (
          <li key={g.id} className="w-32 shrink-0 snap-start sm:w-auto">
            <Link href={`/games/${g.slug}`} className="group block">
              <GameCover game={g} className="transition group-hover:ring-2 group-hover:ring-accent/60" />
              <h3 className="mt-2 line-clamp-2 text-sm leading-snug font-medium text-fg group-hover:text-accent">{g.title}</h3>
            </Link>
            <PlatformBadges platforms={g.platforms} className="mt-1.5" max={3} />
          </li>
        ))}
      </ul>
    </section>
  );
}
