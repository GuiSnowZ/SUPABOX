import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { GameGridSkeleton } from "@/components/games/game-card";
import { PagedGameList, parsePage } from "@/components/games/paged-game-list";
import { Container } from "@/components/ui/primitives";
import { getNewReleasesPage } from "@/lib/catalog/server";

export const metadata: Metadata = {
  title: "New Releases",
  description: "The biggest video game releases of the last three months.",
};

async function Results({ searchParams }: { searchParams: PageProps<"/games/new-releases">["searchParams"] }) {
  const result = await getNewReleasesPage(parsePage((await searchParams).page));
  // Past the last page (e.g. ?page=999 or an old link): go to the last real page.
  if (result.page > result.pages) redirect(`/games/new-releases?page=${result.pages}`);
  return (
    <PagedGameList
      title="New Releases"
      description="Released in the last three months. The biggest new launches come first."
      basePath="/games/new-releases"
      result={result}
    />
  );
}

export default function NewReleasesPage({ searchParams }: PageProps<"/games/new-releases">) {
  return (
    <Suspense
      fallback={
        <Container className="pt-24">
          <GameGridSkeleton />
        </Container>
      }
    >
      <Results searchParams={searchParams} />
    </Suspense>
  );
}
