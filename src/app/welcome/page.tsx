import type { Metadata } from "next";
import { WelcomeView } from "@/components/onboarding/welcome-view";
import { getClassicGames } from "@/lib/official-lists/server";

export const metadata: Metadata = {
  title: "Welcome",
  robots: { index: false },
};

export default async function WelcomePage() {
  return <WelcomeView classics={await getClassicGames(20)} />;
}
