import { HomeView } from "@/components/home/home-view";
import { getRecentlyReleased } from "@/lib/catalog/server";

export default async function HomePage() {
  const recent = await getRecentlyReleased(12);
  return <HomeView recent={recent} />;
}
