import type { Metadata } from "next";
import { GamesBrowser } from "@/components/games/games-browser";
import { Container, PageHeader } from "@/components/ui/primitives";
import { getT } from "@/i18n/server";
import { getRecentlyReleased, getTodaysReleases, getUpcoming } from "@/lib/catalog/server";

export async function generateMetadata({ params }: PageProps<"/[lang]/games">): Promise<Metadata> {
  const { t } = await getT(params);
  return { title: t.games.title, description: t.games.metaDescription };
}

export default async function GamesPage({ params }: PageProps<"/[lang]/games">) {
  const { t } = await getT(params);
  const [recent, upcoming, today] = await Promise.all([getRecentlyReleased(18), getUpcoming(6), getTodaysReleases(12)]);
  return (
    <Container>
      <PageHeader
        title={t.games.title}
        description={t.games.description}
      />
      <GamesBrowser recent={recent} upcoming={upcoming} today={today} />
    </Container>
  );
}
