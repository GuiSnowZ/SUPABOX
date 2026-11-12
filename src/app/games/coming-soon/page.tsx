import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { GameGridSkeleton } from "@/components/games/game-card";
import { PagedGameList, parsePage } from "@/components/games/paged-game-list";
import { Container } from "@/components/ui/primitives";
import { getComingSoonPage } from "@/lib/catalog/server";

export const metadata: Metadata = {
  title: "Coming Soon",
  description: "Video games releasing in the next twelve months.",
};

async function Results({ searchParams }: { searchParams: PageProps<"/games/coming-soon">["searchParams"] }) {
  const result = await getComingSoonPage(parsePage((await searchParams).page));
  // Past the last page (e.g. ?page=999 or an old link): go to the last real page.
  if (result.page > result.pages) redirect(`/games/coming-soon?page=${result.pages}`);
  return (
    <PagedGameList
      title="Coming Soon"
      description="Releasing in the next twelve months, most anticipated first."
      basePath="/games/coming-soon"
      result={result}
    />
  );
}

export default function ComingSoonPage({ searchParams }: PageProps<"/games/coming-soon">) {
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
