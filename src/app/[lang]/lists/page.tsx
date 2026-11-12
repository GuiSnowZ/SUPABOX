import type { Metadata } from "next";
import { ListsDiscover } from "@/components/lists/lists-views";
import { getClassicGames, getOfficialLists } from "@/lib/official-lists/server";
import { getT } from "@/i18n/server";

export async function generateMetadata({ params }: PageProps<"/[lang]/lists">): Promise<Metadata> {
  const { t } = await getT(params);
  return { title: t.lists.title, description: t.lists.metaDescription };
}

export default async function ListsPage() {
  const [official, classics] = await Promise.all([getOfficialLists(), getClassicGames(60)]);
  return <ListsDiscover official={official} classics={classics} />;
}
