import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { GameGridSkeleton } from "@/components/games/game-card";
import { PagedGameList, parsePage } from "@/components/games/paged-game-list";
import { Container } from "@/components/ui/primitives";
import { getT } from "@/i18n/server";
import { getNewReleasesPage } from "@/lib/catalog/server";

export async function generateMetadata({ params }: PageProps<"/[lang]/games/new-releases">): Promise<Metadata> {
  const { t } = await getT(params);
  return { title: t.games.newReleasesTitle, description: t.games.newReleasesMeta };
}

async function Results({
  searchParams,
  params,
}: {
  searchParams: PageProps<"/[lang]/games/new-releases">["searchParams"];
  params: PageProps<"/[lang]/games/new-releases">["params"];
}) {
  const { t, locale } = await getT(params);
  const result = await getNewReleasesPage(parsePage((await searchParams).page));
  // Past the last page (e.g. ?page=999 or an old link): go to the last real page.
  if (result.page > result.pages) redirect(`/games/new-releases?page=${result.pages}`);
  return (
    <PagedGameList
      title={t.games.newReleasesTitle}
      description={t.games.newReleasesDescription}
      basePath="/games/new-releases"
      result={result}
      locale={locale}
    />
  );
}

export default function NewReleasesPage({ searchParams, params }: PageProps<"/[lang]/games/new-releases">) {
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
