import { HomeView } from "@/components/home/home-view";
import { getRecentlyReleased, getTodaysReleases } from "@/lib/catalog/server";

export default async function HomePage() {
  const [recent, today] = await Promise.all([getRecentlyReleased(12), getTodaysReleases(12)]);
  return <HomeView recent={recent} today={today} />;
}
