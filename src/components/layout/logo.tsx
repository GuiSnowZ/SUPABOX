import Link from "next/link";
import { cn } from "@/lib/utils";

/** Supabox wordmark: a stacked "box" mark plus the name. Original artwork. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-7 w-7", className)} aria-hidden>
      <rect x="3" y="3" width="26" height="26" rx="7" fill="var(--color-accent)" />
      <rect x="9" y="9" width="14" height="5" rx="2" fill="var(--color-accent-fg)" />
      <rect x="9" y="18" width="9" height="5" rx="2" fill="var(--color-accent-fg)" opacity="0.55" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 rounded-md", className)} aria-label="Supabox home">
      <LogoMark />
      <span className="text-lg font-semibold tracking-tight text-fg">supabox</span>
    </Link>
  );
}
