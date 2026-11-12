import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GameCover } from "@/components/games/game-cover";
import {
  CommunityRating,
  GameActions,
  GameDiary,
  GameReviews,
} from "@/components/games/game-user-panel";
import { Badge, Container } from "@/components/ui/primitives";
import { CriticScore } from "@/components/games/critic-score";
import { RegisterGames } from "@/components/games/register-games";
import { isReleasedOn, todayIso } from "@/lib/catalog/rows";
import { resolveGameBySlug } from "@/lib/catalog/server";
import type { Game } from "@/types";
import { formatReleaseDate } from "@/lib/utils";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { genreName } from "@/i18n/genres";
import { getT } from "@/i18n/server";

export async function generateMetadata({ params }: PageProps<"/[lang]/games/[slug]">): Promise<Metadata> {
  const { t } = await getT(params);
  const game = await resolveGameBySlug((await params).slug);
  if (!game) return { title: t.games.notFoundTitle };
  return {
    title: game.title,
    description: game.summary,
    openGraph: {
      title: t.games.onSupabox(game.title),
      description: game.summary,
      type: "website",
      images: game.coverUrl ? [{ url: game.coverUrl }] : undefined,
    },
  };
}

/**
 * Game pages render on request (any of IGDB's games can be opened, and new ones
 * are imported on the fly). Unknown slugs get their 404 status from the proxy.
 */
export const instant = false;

export default async function GamePage({ params }: PageProps<"/[lang]/games/[slug]">) {
  const { locale } = await getT(params);
  const game = await resolveGameBySlug((await params).slug);
  if (!game) notFound();
  return <GameDetails game={game} locale={locale} />;
}

function GameDetails({ game, locale }: { game: Game; locale: Locale }) {
  const t = getDictionary(locale);
  const developer = game.developer === "Unknown developer" ? t.games.unknownDeveloper : game.developer;
  const publisher = game.publisher === "Unknown publisher" ? t.games.unknownPublisher : game.publisher;
  const released = isReleasedOn(game, todayIso());

  return (
    <div className="relative">
      <RegisterGames games={[game]} />
      {/* Hero artwork, faded into the page background */}
      {game.backgroundUrl ? (
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[440px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element -- IGDB serves pre-sized images */}
          <img src={game.backgroundUrl} alt="" className="h-full w-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-bg/40 via-bg/70 to-bg" />
        </div>
      ) : null}
      <Container className="relative pt-6">
        <Link href="/games" className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
          <ChevronLeft className="h-4 w-4" /> {t.games.back}
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
              {!released ? <Badge tone="info">{t.games.badgeComingSoon}</Badge> : null}
              {game.genres.map((g) => (
                <Badge key={g}>{genreName(g, locale)}</Badge>
              ))}
            </div>
            {game.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- IGDB serves pre-sized images
              <img src={game.logoUrl} alt="" aria-hidden className="mt-4 max-h-20 max-w-[280px] object-contain object-left [filter:drop-shadow(0_0_1px_rgba(255,255,255,0.85))_drop-shadow(0_0_10px_rgba(255,255,255,0.18))]" />
            ) : null}
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{game.title}</h1>
            <p className="mt-2 text-muted">
              <time dateTime={game.releaseDate ?? undefined}>{formatReleaseDate(game.releaseDate, locale)}</time>
              <span className="text-faint"> · </span>
              {t.games.by} <span className="text-fg">{developer}</span>
            </p>
            {game.criticScore !== null ? <CriticScore game={game} variant="full" className="mt-5" /> : null}
            {game.description && game.description !== game.summary ? (
              <p className="mt-6 leading-relaxed whitespace-pre-line text-fg/85">{game.description}</p>
            ) : game.summary ? (
              <p className="mt-6 text-lg leading-relaxed text-fg/90">{game.summary}</p>
            ) : (
              <p className="mt-6 text-muted">{t.games.noDescription}</p>
            )}

            <dl className="mt-8 grid grid-cols-1 gap-x-8 gap-y-4 border-t border-border pt-6 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-faint">{t.games.developer}</dt>
                <dd className="mt-0.5">{developer}</dd>
              </div>
              <div>
                <dt className="text-faint">{t.games.publisher}</dt>
                <dd className="mt-0.5">{publisher}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-faint">{t.games.platformsLabel}</dt>
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
