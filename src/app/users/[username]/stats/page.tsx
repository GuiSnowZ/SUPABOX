import type { Metadata } from "next";
import { Suspense } from "react";
import { StatsView } from "@/components/profiles/stats-view";

export async function generateMetadata({ params }: PageProps<"/users/[username]/stats">): Promise<Metadata> {
  return { title: `@${(await params).username}'s stats` };
}

export default function StatsPage({ params }: PageProps<"/users/[username]/stats">) {
  // useSearchParams (the year) needs a Suspense boundary.
  return <Suspense fallback={null}>{params.then(({ username }) => <StatsView username={username} />)}</Suspense>;
}
