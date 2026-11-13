import type { Metadata } from "next";
import { FriendsView } from "@/components/home/personal-discovery";
import { getT } from "@/i18n/server";

export async function generateMetadata({ params }: PageProps<"/[lang]/games/friends">): Promise<Metadata> {
  const { t } = await getT(params);
  return { title: t.discover.friends.title, robots: { index: false, follow: true } };
}

export default function FriendsPage() {
  return <FriendsView />;
}
