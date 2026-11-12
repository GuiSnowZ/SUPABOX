import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { UpdatePasswordForm } from "@/components/auth/auth-forms";

export async function generateMetadata({ params }: PageProps<"/[lang]/account/password">): Promise<Metadata> {
  const { t } = await getT(params);
  return { title: t.auth.newPasswordTitle };
}

export default function Page() {
  return <UpdatePasswordForm />;
}
