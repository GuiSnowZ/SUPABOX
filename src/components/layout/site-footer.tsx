import Link from "next/link";
import { Container } from "@/components/ui/primitives";
import { LogoMark } from "./logo";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border pb-24 md:pb-0">
      <Container className="flex flex-col gap-3 py-8 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="flex items-center gap-2">
            <LogoMark className="h-5 w-5" />
            <span>Supabox — Your games. Your story.</span>
          </span>
          <Link href="/medals" className="hover:text-fg">
            Medals
          </Link>
          <Link href="/privacy" className="hover:text-fg">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-fg">
            Terms
          </Link>
        </div>
        <p>
          Game data and images provided by{" "}
          <a href="https://www.igdb.com" target="_blank" rel="noopener noreferrer" className="text-muted underline-offset-2 hover:text-fg hover:underline">
            IGDB.com
          </a>
          . Cover art and logos belong to their respective owners.
        </p>
      </Container>
    </footer>
  );
}
