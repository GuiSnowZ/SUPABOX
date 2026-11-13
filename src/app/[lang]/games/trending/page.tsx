import type { Metadata } from "next";
import { Suspense } from "react";
import { GameGridSkeleton } from "@/components/games/game-card";
import { parsePage } from "@/components/games/paged-game-list";
import { DiscoveryPage } from "@/components/home/discovery-page";
import { Container } from "@/components/ui/primitives";
import { getT } from "@/i18n/server";
import { getTrending } from "@/lib/catalog/discovery";
import { alternatesFor } from "@/lib/seo/meta";

type Props = PageProps<"/[lang]/games/trending">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { t, locale } = await getT(params);
  return { title: t.discover.trending.title, description: t.discover.trending.description, alternates: alternatesFor("/games/trending", locale) };
}

async function Results({ params, searchParams }: Props) {
  const { t, locale } = await getT(params);
  const trending = await getTrending();
  const d = t.discover.trending;
  return (
    <DiscoveryPage
      locale={locale}
      title={d.title}
      description={d.description}
      note={trending.source === "community" ? d.community : d[trending.source]}
      how={d.how}
      items={trending.items}
      page={parsePage((await searchParams).page)}
      basePath="/games/trending"
      ranked
    />
  );
}

export default function TrendingPage(props: Props) {
  return (
    <Suspense fallback={<Container className="pt-24"><GameGridSkeleton /></Container>}>
      <Results {...props} />
    </Suspense>
  );
}
