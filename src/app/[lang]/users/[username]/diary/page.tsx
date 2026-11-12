import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { Suspense } from "react";
import { DiaryView } from "@/components/profiles/diary-view";

export async function generateMetadata({ params }: PageProps<"/[lang]/users/[username]/diary">): Promise<Metadata> {
  const { t } = await getT(params);
  return { title: t.diaryPage.pageTitle((await params).username) };
}

export default function DiaryPage({ params }: PageProps<"/[lang]/users/[username]/diary">) {
  return <Suspense fallback={null}>{params.then(({ username }) => <DiaryView username={username} />)}</Suspense>;
}
