import type { Metadata } from "next";
import { Suspense } from "react";
import { UserListsView } from "@/components/profiles/profile-pages";
import { getT } from "@/i18n/server";

type Props = PageProps<"/[lang]/users/[username]/lists">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { t } = await getT(params);
  return { title: t.profilePages.lists.pageTitle((await params).username) };
}

export default function Page({ params }: Props) {
  return <Suspense fallback={null}>{params.then(({ username }) => <UserListsView username={username} />)}</Suspense>;
}
