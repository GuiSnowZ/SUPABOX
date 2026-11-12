import { ChevronLeft, Info } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OfficialBadge } from "@/components/lists/official-list-card";
import { ListGameGrid } from "@/components/lists/list-game-grid";
import { RegisterGames } from "@/components/games/register-games";
import { Container } from "@/components/ui/primitives";
import { officialListText } from "@/i18n/official-lists";
import { getT } from "@/i18n/server";
import { getOfficialList } from "@/lib/official-lists/server";
import { formatDate } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/[lang]/lists/official/[slug]">): Promise<Metadata> {
  const { t, locale } = await getT(params);
  const list = await getOfficialList((await params).slug);
  if (!list) return { title: t.lists.notFoundTitle };
  const text = officialListText(list, locale);
  return {
    title: text.title,
    description: text.description,
    openGraph: {
      title: `${text.title} · Supabox`,
      description: text.description,
      images: list.entries[0]?.game.coverUrl ? [{ url: list.entries[0].game.coverUrl }] : undefined,
    },
  };
}

export const instant = false;

export default async function OfficialListPage({ params }: PageProps<"/[lang]/lists/official/[slug]">) {
  const { t, locale } = await getT(params);
  const list = await getOfficialList((await params).slug);
  if (!list) notFound();
  const text = officialListText(list, locale);
  return (
    <Container>
      <RegisterGames games={list.entries.map((e) => e.game)} />
      <nav aria-label="Breadcrumb" className="pt-6 text-sm text-muted">
        <Link href="/lists" className="inline-flex items-center gap-1 hover:text-fg">
          <ChevronLeft className="h-4 w-4" /> {t.lists.title}
        </Link>
      </nav>
      <header className="max-w-3xl pt-4 pb-8">
        <div className="flex flex-wrap items-center gap-2">
          <OfficialBadge />
          <span className="text-xs text-faint">{t.lists.categories[list.category]}</span>
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{text.title}</h1>
        <p className="mt-2 leading-relaxed text-muted">{text.description}</p>
        <p className="mt-2 text-sm text-faint">
          {t.common.games(list.entries.length)} · {t.lists.curatedBy(formatDate(list.updatedAt, locale))}
        </p>
        <details className="mt-4 rounded-lg border border-border bg-bg-subtle px-4 py-3 text-sm">
          <summary className="flex cursor-pointer items-center gap-2 font-medium text-fg">
            <Info className="h-4 w-4 text-accent" /> {t.lists.howMade}
          </summary>
          <p className="mt-2 leading-relaxed text-muted">{text.criteria}</p>
          <p className="mt-2 text-xs text-faint">{t.lists.igdbCredit}</p>
        </details>
        <p className="mt-4 text-sm text-muted">{t.lists.tapHint}</p>
      </header>
      <ListGameGrid title={text.title} entries={list.entries} />
    </Container>
  );
}
