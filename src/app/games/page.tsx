import type { Metadata } from "next";
import { GamesBrowser } from "@/components/games/games-browser";
import { Container, PageHeader } from "@/components/ui/primitives";
import { getRecentlyReleased, getUpcoming } from "@/lib/catalog/server";

export const metadata: Metadata = {
  title: "Games",
  description: "Discover recently released video games and save the ones you want to play.",
};

export default async function GamesPage() {
  const [recent, upcoming] = await Promise.all([getRecentlyReleased(18), getUpcoming(6)]);
  return (
    <Container>
      <PageHeader
        title="Games"
        description="Discover what just came out and save anything that catches your eye to your wishlist."
      />
      <GamesBrowser recent={recent} upcoming={upcoming} />
    </Container>
  );
}
