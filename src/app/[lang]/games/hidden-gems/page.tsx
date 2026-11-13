import type { Metadata } from "next";
import { Suspense } from "react";
import { GameGridSkeleton } from "@/components/games/game-card";
import { parsePage } from "@/components/games/paged-game-list";
import { DiscoveryPage } from "@/components/home/discovery-page";
import { Container } from "@/components/ui/primitives";
import { getT } from "@/i18n/server";
import { getHiddenGems } from "@/lib/catalog/discovery";
import { alternatesFor } from "@/lib/seo/meta";

type Props = PageProps<"/[lang]/games/hidden-gems">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { t, locale } = await getT(params);
  return { title: t.discover.gems.title, description: t.discover.gems.description, alternates: alternatesFor("/games/hidden-gems", locale) };
}

async function Results({ params, searchParams }: Props) {
  const { t, locale } = await getT(params);
  const gems = await getHiddenGems();
  const d = t.discover.gems;
  return (
    <DiscoveryPage
      locale={locale}
      title={d.title}
      description={d.description}
      note={d[gems.source]}
      how={d.how}
      items={gems.items}
      page={parsePage((await searchParams).page)}
      basePath="/games/hidden-gems"
    />
  );
}

export default function HiddenGemsPage(props: Props) {
  return (
    <Suspense fallback={<Container className="pt-24"><GameGridSkeleton /></Container>}>
      <Results {...props} />
    </Suspense>
  );
}
