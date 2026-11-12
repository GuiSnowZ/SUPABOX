import type { Metadata } from "next";
import { ListsDiscover } from "@/components/lists/lists-views";
import { getClassicGames, getOfficialLists } from "@/lib/official-lists/server";

export const metadata: Metadata = {
  title: "Lists",
  description: "Official Supabox rankings and curated lists of video games made by the community.",
};

export default async function ListsPage() {
  const [official, classics] = await Promise.all([getOfficialLists(), getClassicGames(60)]);
  return <ListsDiscover official={official} classics={classics} />;
}
