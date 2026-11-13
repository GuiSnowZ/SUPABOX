import type { Metadata } from "next";
import { alternatesFor } from "@/lib/seo/meta";
import { ListsDiscover } from "@/components/lists/lists-views";
import { getClassicGames, getOfficialLists } from "@/lib/official-lists/server";
import { getT } from "@/i18n/server";

export async function generateMetadata({ params }: PageProps<"/[lang]/lists">): Promise<Metadata> {
  const { t, locale } = await getT(params);
  return { alternates: alternatesFor("/lists", locale), title: t.lists.title, description: t.lists.metaDescription };
}

export default async function ListsPage() {
  const [official, classics] = await Promise.all([getOfficialLists(), getClassicGames(60)]);
  return <ListsDiscover official={official} classics={classics} />;
}
