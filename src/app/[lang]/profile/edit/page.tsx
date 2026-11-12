import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { EditProfile } from "@/components/profiles/edit-profile";

export async function generateMetadata({ params }: PageProps<"/[lang]/profile/edit">): Promise<Metadata> {
  const { t } = await getT(params);
  return { title: t.editProfile.title };
}

export default function EditProfilePage() {
  return <EditProfile />;
}
