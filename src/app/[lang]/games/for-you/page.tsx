import type { Metadata } from "next";
import { ForYouView } from "@/components/home/personal-discovery";
import { getT } from "@/i18n/server";
import { getPopularPicks } from "@/lib/catalog/discovery";

export async function generateMetadata({ params }: PageProps<"/[lang]/games/for-you">): Promise<Metadata> {
  const { t } = await getT(params);
  // Personal page: different for every visitor, so not for search engines.
  return { title: t.discover.forYou.title, robots: { index: false, follow: true } };
}

export default async function ForYouPage() {
  return <ForYouView picks={await getPopularPicks()} />;
}
