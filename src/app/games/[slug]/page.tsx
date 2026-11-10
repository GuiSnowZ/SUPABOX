import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GameCover } from "@/components/games/game-cover";
import {
  CommunityRating,
  GameActions,
  GameDiary,
  GameReviews,
} from "@/components/games/game-user-panel";
import { Badge, Container, Skeleton } from "@/components/ui/primitives";
import { catalog, isReleased } from "@/lib/catalog";
import { formatReleaseDate } from "@/lib/utils";

export async function generateStaticParams() {
  const games = await catalog.listGames();
  return games.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: PageProps<"/games/[slug]">): Promise<Metadata> {
  const game = await catalog.getGameBySlug((await params).slug);
  if (!game) return { title: "Game not found" };
  return {
    title: game.title,
    description: game.summary,
    openGraph: { title: `${game.title} on Supabox`, description: game.summary, type: "website" },
  };
}

export default function GamePage({ params }: PageProps<"/games/[slug]">) {
  return (
    <Suspense fallback={<GameSkeleton />}>
      <GameDetails params={params} />
    </Suspense>
  );
}

function GameSkeleton() {
  return (
    <Container className="grid gap-8 pt-16 md:grid-cols-[220px_1fr] lg:grid-cols-[260px_1fr_260px]">
      <Skeleton className="mx-auto aspect-[3/4] w-48 md:w-full" />
      <div className="space-y-3">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="mt-6 h-24 w-full" />
      </div>
    </Container>
  );
}

async function GameDetails({ params }: { params: PageProps<"/games/[slug]">["params"] }) {
  const game = await catalog.getGameBySlug((await params).slug);
  if (!game) notFound();
  const released = isReleased(game);

  return (
    <div className="relative">
      {/* Soft colour wash from the cover palette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[420px] opacity-35"
        style={{
          background: `radial-gradient(80% 100% at 50% 0%, ${game.cover.to}55, transparent 70%)`,
        }}
      />
      <Container className="relative pt-6">
        <Link href="/games" className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
          <ChevronLeft className="h-4 w-4" /> Games
        </Link>

        <div className="mt-6 grid gap-8 md:grid-cols-[220px_1fr] lg:grid-cols-[260px_1fr_260px] lg:gap-10">
          <aside className="space-y-4">
            <div className="mx-auto w-48 md:w-full">
              <GameCover game={game} className="shadow-2xl shadow-black/50" />
            </div>
            <GameActions game={game} released={released} />
          </aside>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {!released ? <Badge tone="info">Coming soon</Badge> : null}
              {game.genres.map((g) => (
                <Badge key={g}>{g}</Badge>
              ))}
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{game.title}</h1>
            <p className="mt-2 text-muted">
              <time dateTime={game.releaseDate ?? undefined}>{formatReleaseDate(game.releaseDate)}</time>
              <span className="text-faint"> · </span>
              by <span className="text-fg">{game.developer}</span>
            </p>
            <p className="mt-6 text-lg leading-relaxed text-fg/90">{game.summary}</p>
            <p className="mt-4 leading-relaxed text-muted">{game.description}</p>

            <dl className="mt-8 grid grid-cols-1 gap-x-8 gap-y-4 border-t border-border pt-6 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-faint">Developer</dt>
                <dd className="mt-0.5">{game.developer}</dd>
              </div>
              <div>
                <dt className="text-faint">Publisher</dt>
                <dd className="mt-0.5">{game.publisher}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-faint">Platforms</dt>
                <dd className="mt-1.5 flex flex-wrap gap-1.5">
                  {game.platforms.map((p) => (
                    <Badge key={p}>{p}</Badge>
                  ))}
                </dd>
              </div>
            </dl>

            <div className="mt-10 lg:hidden">
              <CommunityRating game={game} />
            </div>

            <div className="mt-12 space-y-12">
              <GameDiary game={game} released={released} />
              <GameReviews game={game} released={released} />
            </div>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <CommunityRating game={game} />
            </div>
          </aside>
        </div>
      </Container>
    </div>
  );
}
