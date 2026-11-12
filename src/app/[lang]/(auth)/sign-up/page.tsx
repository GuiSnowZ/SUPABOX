import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { SignUpForm } from "@/components/auth/auth-forms";

export async function generateMetadata({ params }: PageProps<"/[lang]/sign-up">): Promise<Metadata> {
  const { t } = await getT(params);
  return { title: t.auth.create };
}

export default function Page() {
  return <SignUpForm />;
}
