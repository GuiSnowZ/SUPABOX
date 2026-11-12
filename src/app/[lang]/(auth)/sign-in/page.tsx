import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { Suspense } from "react";
import { SignInForm } from "@/components/auth/auth-forms";

export async function generateMetadata({ params }: PageProps<"/[lang]/sign-in">): Promise<Metadata> {
  const { t } = await getT(params);
  return { title: t.auth.signInTitle };
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}
