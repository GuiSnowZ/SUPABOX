import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { NotificationsView } from "@/components/social/notifications-view";

export async function generateMetadata({ params }: PageProps<"/[lang]/notifications">): Promise<Metadata> {
  const { t } = await getT(params);
  return { title: t.notifications.title, robots: { index: false } };
}

export default function NotificationsPage() {
  return <NotificationsView />;
}
