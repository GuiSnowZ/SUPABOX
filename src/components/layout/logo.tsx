"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/client";

/**
 * Supabox brand mark: the S-shaped box (raster artwork with transparency).
 * Source files: public/brand. Keep proportions; never place it on an added background.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- tiny static asset; srcSet covers retina screens
    <img
      src="/brand/supabox-mark-64.png"
      srcSet="/brand/supabox-mark-64.png 1x, /brand/supabox-mark-128.png 2x, /brand/supabox-mark-256.png 4x"
      alt=""
      aria-hidden
      width={28}
      height={28}
      className={cn("h-7 w-7 shrink-0 object-contain", className)}
    />
  );
}

export function Logo({ className }: { className?: string }) {
  const t = useT();
  return (
    <Link href="/" className={cn("flex items-center gap-2 rounded-md", className)} aria-label={t.common.homeLabel}>
      <LogoMark />
      <span className="text-lg font-semibold tracking-tight text-fg">supabox</span>
    </Link>
  );
}
