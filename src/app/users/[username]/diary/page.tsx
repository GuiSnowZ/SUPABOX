import type { Metadata } from "next";
import { Suspense } from "react";
import { DiaryView } from "@/components/profiles/diary-view";

export async function generateMetadata({ params }: PageProps<"/users/[username]/diary">): Promise<Metadata> {
  return { title: `@${(await params).username}'s diary` };
}

export default function DiaryPage({ params }: PageProps<"/users/[username]/diary">) {
  return <Suspense fallback={null}>{params.then(({ username }) => <DiaryView username={username} />)}</Suspense>;
}
