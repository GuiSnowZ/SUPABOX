import type { Metadata } from "next";
import { alternatesFor } from "@/lib/seo/meta";
import { type ExploreLink, GamesBrowser } from "@/components/games/games-browser";
import { Container, PageHeader } from "@/components/ui/primitives";
import { getT } from "@/i18n/server";
import { officialListText } from "@/i18n/official-lists";
import { getUpcoming } from "@/lib/catalog/server";
import { getOfficialLists } from "@/lib/official-lists/server";

export async function generateMetadata({ params }: PageProps<"/[lang]/games">): Promise<Metadata> {
  const { t, locale } = await getT(params);
  return { alternates: alternatesFor("/games", locale), title: t.games.searchTitle, description: t.games.metaDescription };
}

/**
 * Short chip label from an official list title: "Os Melhores Jogos de Terror"
 * → "Terror", "Best Horror Games" → "Horror", "Best Nintendo Games" → "Nintendo".
 */
function shortListLabel(title: string): string {
  const short = title
    .replace(/^Os Melhores (Jogos )?(de |da |do |dos |das |com |para )?/i, "")
    .replace(/^(The )?Best (Games )?(of |from |with |to )?/i, "")
    .replace(/ Games$/i, "")
    .trim();
  return short ? short[0].toUpperCase() + short.slice(1) : title;
}

/** Official list categories offered as "explore" links, in this order. */
const EXPLORE_GROUPS = ["genres", "platforms", "companies"] as const;

/**
 * Search (the "Buscar" tab): find any game by name; below the search box,
 * ways to explore the catalog. Personal discovery lives on the Home.
 */
export default async function GamesPage({ params }: PageProps<"/[lang]/games">) {
  const { t, locale } = await getT(params);
  const [upcoming, lists] = await Promise.all([getUpcoming(6), getOfficialLists()]);
  const explore: Array<{ group: string; links: ExploreLink[] }> = [
    {
      group: t.games.exploreGroups.shortcuts,
      links: [
        { href: "/games/trending", label: t.discover.trending.title },
        { href: "/games/recent", label: t.discover.recent.title },
        { href: "/games/coming-soon", label: t.games.comingSoon },
        { href: "/games/hidden-gems", label: t.discover.gems.title },
        { href: "/lists", label: t.nav.lists },
      ],
    },
    ...EXPLORE_GROUPS.map((category) => ({
      group: t.games.exploreGroups[category],
      links: lists
        .filter((l) => l.category === category)
        .map((l) => ({ href: `/lists/official/${l.slug}`, label: shortListLabel(officialListText(l, locale).title) })),
    })).filter((g) => g.links.length),
  ];
  return (
    <Container>
      <PageHeader title={t.games.searchTitle} description={t.games.searchDescription} />
      <GamesBrowser upcoming={upcoming} explore={explore} />
    </Container>
  );
}
