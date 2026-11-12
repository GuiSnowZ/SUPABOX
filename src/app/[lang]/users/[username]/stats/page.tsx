import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { Suspense } from "react";
import { StatsView } from "@/components/profiles/stats-view";

export async function generateMetadata({ params }: PageProps<"/[lang]/users/[username]/stats">): Promise<Metadata> {
  const { t } = await getT(params);
  return { title: t.stats.pageTitle((await params).username) };
}

export default function StatsPage({ params }: PageProps<"/[lang]/users/[username]/stats">) {
  // useSearchParams (the year) needs a Suspense boundary.
  return <Suspense fallback={null}>{params.then(({ username }) => <StatsView username={username} />)}</Suspense>;
}
