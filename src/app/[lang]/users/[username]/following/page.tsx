import type { Metadata } from "next";
import { Suspense } from "react";
import { PeopleView } from "@/components/profiles/profile-pages";
import { getT } from "@/i18n/server";

type Props = PageProps<"/[lang]/users/[username]/following">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { t } = await getT(params);
  return { title: t.profilePages.following.pageTitle((await params).username), robots: { index: false, follow: true } };
}

export default function Page({ params }: Props) {
  return <Suspense fallback={null}>{params.then(({ username }) => <PeopleView username={username} kind="following" />)}</Suspense>;
}
