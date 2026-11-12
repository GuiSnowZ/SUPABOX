"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/client";

/** Page numbers to show: all when few, otherwise first, last and a window around the current page. */
export function pageWindow(current: number, total: number): Array<number | "…"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (current >= total - 2) [total - 1, total - 2, total - 3].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: Array<number | "…"> = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("…");
    out.push(p);
  });
  return out;
}

const item =
  "inline-flex h-10 min-w-10 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors";

/** Numbered pagination as plain links (?page=N), so pages are shareable and work without JavaScript. */
export function Pagination({ basePath, page, pages }: { basePath: string; page: number; pages: number }) {
  const t = useT();
  if (pages <= 1) return null;
  const href = (p: number) => (p === 1 ? basePath : `${basePath}?page=${p}`);
  return (
    <nav aria-label={t.games.pagination} className="mt-12 flex flex-wrap items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={href(page - 1)} className={cn(item, "text-muted hover:bg-surface hover:text-fg")} rel="prev">
          <ChevronLeft className="h-4 w-4" /> <span className="max-sm:sr-only">{t.games.previous}</span>
        </Link>
      ) : null}
      {pageWindow(page, pages).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-faint" aria-hidden>
            …
          </span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            aria-current={p === page ? "page" : undefined}
            aria-label={t.games.pageLabel(p)}
            className={cn(
              item,
              p === page ? "bg-accent text-accent-fg" : "border border-border text-muted hover:border-border-strong hover:text-fg",
            )}
          >
            {p}
          </Link>
        ),
      )}
      {page < pages ? (
        <Link href={href(page + 1)} className={cn(item, "text-muted hover:bg-surface hover:text-fg")} rel="next">
          <span className="max-sm:sr-only">{t.games.next}</span> <ChevronRight className="h-4 w-4" />
        </Link>
      ) : null}
    </nav>
  );
}
