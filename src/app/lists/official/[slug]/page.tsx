import { ChevronLeft, Info } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OfficialBadge } from "@/components/lists/official-list-card";
import { ListGameGrid } from "@/components/lists/list-game-grid";
import { RegisterGames } from "@/components/games/register-games";
import { Container } from "@/components/ui/primitives";
import { CATEGORY_TITLES, getOfficialList } from "@/lib/official-lists/server";
import { formatDate, pluralize } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/lists/official/[slug]">): Promise<Metadata> {
  const list = await getOfficialList((await params).slug);
  if (!list) return { title: "List not found" };
  return {
    title: list.title,
    description: list.description,
    openGraph: {
      title: `${list.title} · Supabox`,
      description: list.description,
      images: list.entries[0]?.game.coverUrl ? [{ url: list.entries[0].game.coverUrl }] : undefined,
    },
  };
}

export const instant = false;

export default async function OfficialListPage({ params }: PageProps<"/lists/official/[slug]">) {
  const list = await getOfficialList((await params).slug);
  if (!list) notFound();
  return (
    <Container>
      <RegisterGames games={list.entries.map((e) => e.game)} />
      <nav aria-label="Breadcrumb" className="pt-6 text-sm text-muted">
        <Link href="/lists" className="inline-flex items-center gap-1 hover:text-fg">
          <ChevronLeft className="h-4 w-4" /> Lists
        </Link>
      </nav>
      <header className="max-w-3xl pt-4 pb-8">
        <div className="flex flex-wrap items-center gap-2">
          <OfficialBadge />
          <span className="text-xs text-faint">{CATEGORY_TITLES[list.category]}</span>
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{list.title}</h1>
        <p className="mt-2 leading-relaxed text-muted">{list.description}</p>
        <p className="mt-2 text-sm text-faint">
          {pluralize(list.entries.length, "game")} · Curated by Supabox · Updated {formatDate(list.updatedAt)}
        </p>
        <details className="mt-4 rounded-lg border border-border bg-bg-subtle px-4 py-3 text-sm">
          <summary className="flex cursor-pointer items-center gap-2 font-medium text-fg">
            <Info className="h-4 w-4 text-accent" /> How this list is made
          </summary>
          <p className="mt-2 leading-relaxed text-muted">{list.criteria}</p>
          <p className="mt-2 text-xs text-faint">Game data and ratings from IGDB.com.</p>
        </details>
        <p className="mt-4 text-sm text-muted">Tap a game to browse the list one by one — rate it, review it or save it.</p>
      </header>
      <ListGameGrid title={list.title} entries={list.entries} />
    </Container>
  );
}
