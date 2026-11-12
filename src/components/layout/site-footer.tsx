"use client";

import Link from "next/link";
import { Container } from "@/components/ui/primitives";
import { useT } from "@/i18n/client";
import { LanguageSwitcher } from "./language-switcher";
import { LogoMark } from "./logo";

export function SiteFooter() {
  const t = useT();
  return (
    <footer className="mt-20 border-t border-border pb-24 md:pb-0">
      <Container className="flex flex-col gap-3 py-8 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="flex items-center gap-2">
            <LogoMark className="h-5 w-5" />
            <span>Supabox — {t.common.tagline}</span>
          </span>
          <Link href="/medals" className="hover:text-fg">
            {t.footer.medals}
          </Link>
          <Link href="/privacy" className="hover:text-fg">
            {t.footer.privacy}
          </Link>
          <Link href="/terms" className="hover:text-fg">
            {t.footer.terms}
          </Link>
          <LanguageSwitcher />
        </div>
        <p>
          {t.footer.igdbBefore}{" "}
          <a href="https://www.igdb.com" target="_blank" rel="noopener noreferrer" className="text-muted underline-offset-2 hover:text-fg hover:underline">
            IGDB.com
          </a>
          {t.footer.igdbAfter}
        </p>
      </Container>
    </footer>
  );
}
