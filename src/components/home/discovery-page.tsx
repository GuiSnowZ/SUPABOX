import { ChevronLeft, Info } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Pagination } from "@/components/ui/pagination";
import { Container, EmptyState, PageHeader } from "@/components/ui/primitives";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import type { DiscoveryItem } from "@/lib/discovery";
import { DiscoveryGrid } from "./discovery-row";

export const DISCOVERY_PAGE_SIZE = 24;

/** Shared layout of the "View all" pages behind the Home rows. */
export function DiscoveryPage({
  locale,
  title,
  description,
  note,
  how,
  items,
  page = 1,
  basePath,
  ranked = false,
  children,
}: {
  locale: Locale;
  title: string;
  description: string;
  note?: string | null;
  how?: string;
  /** All items; this page's slice is taken here. */
  items: DiscoveryItem[];
  page?: number;
  basePath: string;
  ranked?: boolean;
  children?: ReactNode;
}) {
  const t = getDictionary(locale);
  const pages = Math.max(1, Math.ceil(items.length / DISCOVERY_PAGE_SIZE));
  const current = Math.min(Math.max(1, page), pages);
  const from = (current - 1) * DISCOVERY_PAGE_SIZE;
  return (
    <Container>
      <Link href="/" className="mt-6 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
        <ChevronLeft className="h-4 w-4" /> {t.nav.home}
      </Link>
      <PageHeader title={title} description={description} />
      {note || how ? (
        <div className="-mt-4 mb-8 max-w-3xl space-y-1.5 text-xs text-faint">
          {note ? (
            <p className="flex items-start gap-1.5">
              <Info className="mt-px h-3.5 w-3.5 shrink-0" /> <span>{note}</span>
            </p>
          ) : null}
          {how ? <p>{how}</p> : null}
        </div>
      ) : null}
      {children}
      {items.length ? (
        <DiscoveryGrid items={items.slice(from, from + DISCOVERY_PAGE_SIZE)} startRank={ranked ? from + 1 : undefined} />
      ) : (
        <EmptyState title={t.games.emptyPage} description={t.games.emptyPageHint} />
      )}
      {pages > 1 ? <Pagination basePath={basePath} page={current} pages={pages} /> : null}
    </Container>
  );
}
