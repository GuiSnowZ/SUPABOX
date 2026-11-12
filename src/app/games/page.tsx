import type { Metadata } from "next";
import { GamesBrowser } from "@/components/games/games-browser";
import { Container, PageHeader } from "@/components/ui/primitives";
import { getRecentlyReleased, getTodaysReleases, getUpcoming } from "@/lib/catalog/server";

export const metadata: Metadata = {
  title: "Games",
  description: "Discover recently released video games and save the ones you want to play.",
};

export default async function GamesPage() {
  const [recent, upcoming, today] = await Promise.all([getRecentlyReleased(18), getUpcoming(6), getTodaysReleases(12)]);
  return (
    <Container>
      <PageHeader
        title="Games"
        description="Discover what just came out and save anything that catches your eye to your wishlist."
      />
      <GamesBrowser recent={recent} upcoming={upcoming} today={today} />
    </Container>
  );
}
