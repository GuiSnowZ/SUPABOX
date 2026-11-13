import type { Metadata } from "next";
import { Suspense } from "react";
import { CompletedView } from "@/components/profiles/profile-pages";
import { getT } from "@/i18n/server";

type Props = PageProps<"/[lang]/users/[username]/completed">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { t } = await getT(params);
  return { title: t.profilePages.completed.pageTitle((await params).username) };
}

export default function Page({ params }: Props) {
  return <Suspense fallback={null}>{params.then(({ username }) => <CompletedView username={username} />)}</Suspense>;
}
