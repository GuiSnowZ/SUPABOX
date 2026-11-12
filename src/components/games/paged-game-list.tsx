import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { GameCard, GameGrid } from "@/components/games/game-card";
import { RegisterGames } from "@/components/games/register-games";
import { Pagination } from "@/components/ui/pagination";
import { Container, EmptyState, PageHeader } from "@/components/ui/primitives";
import type { GamePage } from "@/lib/catalog/server";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

/** Shared layout for the paginated game listings. */
export function PagedGameList({
  title,
  description,
  basePath,
  result,
  locale,
}: {
  title: string;
  description: string;
  basePath: string;
  result: GamePage;
  locale: Locale;
}) {
  const t = getDictionary(locale);
  const { games, page, pages, total } = result;
  return (
    <Container>
      <RegisterGames games={games} />
      <Link href="/games" className="mt-6 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
        <ChevronLeft className="h-4 w-4" /> {t.games.back}
      </Link>
      <PageHeader
        title={title}
        description={
          <>
            {description}{" "}
            <span className="text-faint">
              {t.common.games(total)} · {t.games.pageOf(page, pages)}
            </span>
          </>
        }
      />
      {games.length ? (
        <GameGrid>
          {games.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </GameGrid>
      ) : (
        <EmptyState title={t.games.emptyPage} description={t.games.emptyPageHint} />
      )}
      <Pagination basePath={basePath} page={page} pages={pages} />
    </Container>
  );
}

/** Parse ?page=N safely (anything invalid → 1). */
export function parsePage(value: string | string[] | undefined): number {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : 1;
}
