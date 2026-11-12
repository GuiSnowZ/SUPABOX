"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { CoverArt, CoverMotif, Game } from "@/types";
import { useT } from "@/i18n/client";

/**
 * Game cover in a fixed 3:4 frame.
 * Shows the licensed cover image from the catalog (IGDB) when available;
 * otherwise an original generated placeholder derived from the game's slug.
 */
const PALETTES: Array<Omit<CoverArt, "motif">> = [
  { from: "#1d2b45", to: "#e8a24a", ink: "#fff3df" },
  { from: "#0c0d10", to: "#4a1f2a", ink: "#e9d6d0" },
  { from: "#16301f", to: "#9bc46a", ink: "#effbe2" },
  { from: "#0d0b26", to: "#7a5cff", ink: "#ece8ff" },
  { from: "#2a1033", to: "#c3417a", ink: "#ffe3f0" },
  { from: "#0a1f3c", to: "#3ee8c9", ink: "#e9fffb" },
  { from: "#3a3f44", to: "#d65a31", ink: "#f4efe9" },
  { from: "#10263a", to: "#d9b45b", ink: "#fff6dc" },
];
const MOTIFS: CoverMotif[] = ["orb", "peaks", "grid", "waves", "shards", "rings", "stripes"];

function placeholderArt(slug: string): CoverArt {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return { ...PALETTES[h % PALETTES.length], motif: MOTIFS[(h >>> 8) % MOTIFS.length] };
}

function Motif({ motif, ink }: { motif: CoverMotif; ink: string }): ReactNode {
  switch (motif) {
    case "orb":
      return (
        <g fill={ink}>
          <circle cx="190" cy="140" r="78" opacity="0.9" />
          <circle cx="190" cy="140" r="110" fill="none" stroke={ink} strokeWidth="1.5" opacity="0.35" />
          <circle cx="82" cy="250" r="10" opacity="0.6" />
        </g>
      );
    case "peaks":
      return (
        <g fill={ink}>
          <path d="M0 300 L95 175 L150 235 L215 140 L300 260 L300 400 L0 400Z" opacity="0.35" />
          <path d="M0 340 L70 270 L135 320 L220 230 L300 300 L300 400 L0 400Z" opacity="0.6" />
          <circle cx="225" cy="85" r="26" opacity="0.85" />
        </g>
      );
    case "grid":
      return (
        <g stroke={ink} strokeWidth="1.5" opacity="0.55">
          {Array.from({ length: 9 }, (_, i) => (
            <line key={`v${i}`} x1={150} y1={150} x2={-150 + i * 75} y2={400} />
          ))}
          {[200, 235, 280, 340].map((y) => (
            <line key={`h${y}`} x1={0} y1={y} x2={300} y2={y} />
          ))}
          <rect x="105" y="60" width="90" height="90" fill={ink} stroke="none" opacity="0.9" />
        </g>
      );
    case "waves":
      return (
        <g fill="none" stroke={ink} strokeWidth="6" strokeLinecap="round">
          {[150, 190, 230, 270].map((y, i) => (
            <path
              key={y}
              d={`M-20 ${y} C 40 ${y - 30}, 90 ${y + 30}, 150 ${y} S 260 ${y - 30}, 320 ${y}`}
              opacity={0.9 - i * 0.18}
            />
          ))}
        </g>
      );
    case "shards":
      return (
        <g fill={ink}>
          <path d="M150 40 L230 210 L150 170 Z" opacity="0.9" />
          <path d="M150 40 L70 210 L150 170 Z" opacity="0.55" />
          <path d="M70 210 L150 170 L230 210 L150 280 Z" opacity="0.3" />
        </g>
      );
    case "rings":
      return (
        <g fill="none" stroke={ink}>
          {[30, 55, 80, 105, 130].map((r, i) => (
            <circle key={r} cx="150" cy="160" r={r} strokeWidth={i === 2 ? 5 : 1.5} opacity={0.85 - i * 0.12} />
          ))}
          <circle cx="150" cy="160" r="8" fill={ink} stroke="none" />
        </g>
      );
    case "stripes":
      return (
        <g fill={ink}>
          {Array.from({ length: 7 }, (_, i) => (
            <rect
              key={i}
              x={-200 + i * 70}
              y={0}
              width={i % 2 ? 10 : 24}
              height={600}
              transform="rotate(28 150 200)"
              opacity={0.15 + (i % 3) * 0.2}
            />
          ))}
        </g>
      );
  }
}

export function GameCover({
  game,
  className,
  showTitle = true,
}: {
  game: Pick<Game, "slug" | "title" | "cover" | "coverUrl">;
  className?: string;
  /** Hide the printed title when the cover is very small (placeholder art only). */
  showTitle?: boolean;
}) {
  const t = useT();
  if (game.coverUrl) {
    return (
      <div
        className={cn(
          "relative aspect-[3/4] w-full overflow-hidden rounded-[var(--radius-cover)] bg-surface ring-1 ring-white/8",
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- IGDB serves pre-sized, CDN-cached images */}
        <img
          src={game.coverUrl}
          alt={t.games.coverAlt(game.title)}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }
  const { from, to, ink, motif } = game.cover ?? placeholderArt(game.slug);
  const gid = `cover-${game.slug}`;
  const titleSize = game.title.length > 18 ? 24 : game.title.length > 11 ? 30 : 36;
  return (
    <div
      className={cn(
        "relative aspect-[3/4] w-full overflow-hidden rounded-[var(--radius-cover)] bg-surface ring-1 ring-white/8",
        className,
      )}
    >
      <svg viewBox="0 0 300 400" className="h-full w-full" role="img" aria-label={t.games.coverAlt(game.title)}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0" stopColor={from} />
            <stop offset="1" stopColor={to} />
          </linearGradient>
        </defs>
        <rect width="300" height="400" fill={`url(#${gid})`} />
        <Motif motif={motif} ink={ink} />
        {showTitle ? (
          <text
            x="22"
            y="372"
            fill={ink}
            fontFamily="var(--font-geist-sans), system-ui, sans-serif"
            fontWeight="700"
            fontSize={titleSize}
            letterSpacing="-0.5"
          >
            {game.title}
          </text>
        ) : null}
      </svg>
    </div>
  );
}
