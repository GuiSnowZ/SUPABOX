import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { WelcomeView } from "@/components/onboarding/welcome-view";
import { getClassicGames } from "@/lib/official-lists/server";

export async function generateMetadata({ params }: PageProps<"/[lang]/welcome">): Promise<Metadata> {
  const { t } = await getT(params);
  return { title: t.welcome.pageTitle, robots: { index: false } };
}

export default async function WelcomePage() {
  return <WelcomeView classics={await getClassicGames(20)} />;
}
