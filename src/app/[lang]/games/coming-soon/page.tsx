import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { GameGridSkeleton } from "@/components/games/game-card";
import { PagedGameList, parsePage } from "@/components/games/paged-game-list";
import { Container } from "@/components/ui/primitives";
import { getT } from "@/i18n/server";
import { getComingSoonPage } from "@/lib/catalog/server";

export async function generateMetadata({ params }: PageProps<"/[lang]/games/coming-soon">): Promise<Metadata> {
  const { t } = await getT(params);
  return { title: t.games.comingSoonTitle, description: t.games.comingSoonMeta };
}

async function Results({
  searchParams,
  params,
}: {
  searchParams: PageProps<"/[lang]/games/coming-soon">["searchParams"];
  params: PageProps<"/[lang]/games/coming-soon">["params"];
}) {
  const { t, locale } = await getT(params);
  const result = await getComingSoonPage(parsePage((await searchParams).page));
  // Past the last page (e.g. ?page=999 or an old link): go to the last real page.
  if (result.page > result.pages) redirect(`/games/coming-soon?page=${result.pages}`);
  return (
    <PagedGameList
      title={t.games.comingSoonTitle}
      description={t.games.comingSoonDescription}
      basePath="/games/coming-soon"
      result={result}
      locale={locale}
    />
  );
}

export default function ComingSoonPage({ searchParams, params }: PageProps<"/[lang]/games/coming-soon">) {
  return (
    <Suspense
      fallback={
        <Container className="pt-24">
          <GameGridSkeleton />
        </Container>
      }
    >
      <Results searchParams={searchParams} params={params} />
    </Suspense>
  );
}
