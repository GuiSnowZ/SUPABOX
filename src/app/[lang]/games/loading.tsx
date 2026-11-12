import { GameGridSkeleton } from "@/components/games/game-card";
import { Container, Skeleton } from "@/components/ui/primitives";

export default function Loading() {
  return (
    <Container className="pt-10" aria-busy="true" aria-label="Loading games">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      <Skeleton className="mt-8 mb-10 h-12 w-full max-w-xl rounded-xl" />
      <GameGridSkeleton />
    </Container>
  );
}
