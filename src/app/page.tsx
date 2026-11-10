import { HomeView } from "@/components/home/home-view";
import { catalog } from "@/lib/catalog";

export default async function HomePage() {
  const recent = await catalog.getRecentlyReleased(12);
  return <HomeView recent={recent} />;
}
