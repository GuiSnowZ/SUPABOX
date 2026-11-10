import type { Metadata } from "next";
import { ListsDiscover } from "@/components/lists/lists-views";

export const metadata: Metadata = {
  title: "Lists",
  description: "Discover curated lists of video games made by the Supabox community.",
};

export default function ListsPage() {
  return <ListsDiscover />;
}
