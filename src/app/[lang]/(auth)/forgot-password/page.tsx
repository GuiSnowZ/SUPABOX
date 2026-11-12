import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";

export async function generateMetadata({ params }: PageProps<"/[lang]/forgot-password">): Promise<Metadata> {
  const { t } = await getT(params);
  return { title: t.auth.resetTitle };
}

export default function Page() {
  return <ForgotPasswordForm />;
}
