import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { GameGridSkeleton } from "@/components/games/game-card";
import { PagedGameList, parsePage } from "@/components/games/paged-game-list";
import { Container } from "@/components/ui/primitives";
import { getT } from "@/i18n/server";
import { getRecentReleasesPage } from "@/lib/catalog/discovery";
import { alternatesFor } from "@/lib/seo/meta";

type Props = PageProps<"/[lang]/games/recent">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { t, locale } = await getT(params);
  return { title: t.discover.recent.title, description: t.discover.recent.description, alternates: alternatesFor("/games/recent", locale) };
}

async function Results({ params, searchParams }: Props) {
  const { t, locale } = await getT(params);
  const result = await getRecentReleasesPage(parsePage((await searchParams).page));
  if (result.page > result.pages) redirect(`/games/recent?page=${result.pages}`);
  return (
    <PagedGameList
      title={t.discover.recent.title}
      description={t.discover.recent.pageDescription}
      basePath="/games/recent"
      result={result}
      locale={locale}
    />
  );
}

export default function RecentPage(props: Props) {
  return (
    <Suspense fallback={<Container className="pt-24"><GameGridSkeleton /></Container>}>
      <Results {...props} />
    </Suspense>
  );
}
