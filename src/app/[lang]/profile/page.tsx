import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { MyProfile } from "@/components/profiles/profile-view";

export async function generateMetadata({ params }: PageProps<"/[lang]/profile">): Promise<Metadata> {
  const { t } = await getT(params);
  return { title: t.profile.pageTitle };
}

export default function ProfilePage() {
  return <MyProfile />;
}
