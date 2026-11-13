import { ImageResponse } from "next/og";
import type { ReactNode } from "react";
import { SITE_URL } from "@/lib/site";
import { ogFonts } from "./og-fonts";

/**
 * Share images (Open Graph / Twitter cards), 1200×630, rendered on demand.
 * One layout for every page type: artwork on the left, text on the right,
 * Supabox branding at the top.
 */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_BG = "#101214";
export const ACCENT = "#7dd59a";
const BG = OG_BG;

export function ogTierColor(score: number): string {
  return score >= 75 ? "#2fbf71" : score >= 50 ? "#e8b931" : "#e5484d";
}

export async function ogImage({
  art,
  kicker,
  title,
  lines = [],
  badge,
  background,
}: {
  /** Left column: a cover <img>, an avatar, or a stack of covers. */
  art?: ReactNode;
  kicker: string;
  title: string;
  lines?: string[];
  badge?: ReactNode;
  /** Optional wide artwork behind everything, heavily dimmed. */
  background?: string | null;
}): Promise<ImageResponse> {
  const fontSize = title.length > 60 ? 50 : title.length > 34 ? 60 : 72;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: BG, color: "#f2f4f5", position: "relative" }}>
        {background ? (
          // eslint-disable-next-line @next/next/no-img-element -- rendered by Satori, not the browser
          <img src={background} alt="" width={1200} height={630} style={{ position: "absolute", inset: 0, objectFit: "cover", opacity: 0.18 }} />
        ) : null}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background: `linear-gradient(90deg, ${BG} 0%, rgba(16,18,20,0.85) 55%, rgba(16,18,20,0.6) 100%)`,
          }}
        />
        <div style={{ display: "flex", width: "100%", height: "100%", padding: 60, gap: 56, alignItems: "center", position: "relative" }}>
          {art ? <div style={{ display: "flex", flexShrink: 0 }}>{art}</div> : null}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, height: "100%", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- rendered by Satori */}
              <img src={`${SITE_URL}/brand/supabox-mark-128.png`} alt="" width={44} height={44} />
              <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: -1 }}>supabox</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <span style={{ fontSize: 26, color: ACCENT, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2 }}>{kicker}</span>
              <span style={{ fontSize, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1.5, display: "flex" }}>{title}</span>
              {lines.map((l) => (
                <span key={l} style={{ fontSize: 30, color: "#a9b0b6", display: "flex" }}>
                  {l}
                </span>
              ))}
              {badge ? <div style={{ display: "flex", marginTop: 6 }}>{badge}</div> : null}
            </div>
            <span style={{ fontSize: 24, color: "#6f777e" }}>supaboxd.com</span>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await ogFonts(), headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" } },
  );
}

/** A game cover, rounded, for the left column. */
export function OgCover({ src, width = 330 }: { src: string; width?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- rendered by Satori
    <img
      src={src}
      alt=""
      width={width}
      height={Math.round((width * 4) / 3)}
      style={{ borderRadius: 18, objectFit: "cover", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}
    />
  );
}

export function OgScore({ score, label }: { score: number; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div
        style={{
          display: "flex",
          width: 76,
          height: 76,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
          background: ogTierColor(score),
          color: "#0c0d10",
          fontSize: 38,
          fontWeight: 800,
        }}
      >
        {score}
      </div>
      <span style={{ fontSize: 26, color: "#a9b0b6" }}>{label}</span>
    </div>
  );
}

const STAR =
  "M12 2.5l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.52l-5.88 3.09 1.12-6.55L2.48 9.42l6.58-.96z";

/** A 0.5–5 rating as five drawn stars (fonts can't be trusted to have ★). */
export function OgStars({ rating, size = 48, color = ACCENT, gap = 6 }: { rating: number; size?: number; color?: string; gap?: number }) {
  return (
    <div style={{ display: "flex", gap }}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, rating - i));
        return (
          <div key={i} style={{ display: "flex", position: "relative", width: size, height: size }}>
            <svg width={size} height={size} viewBox="0 0 24 24" style={{ position: "absolute", top: 0, left: 0 }}>
              <path d={STAR} fill="rgba(255,255,255,0.14)" />
            </svg>
            {fill > 0 ? (
              <div style={{ display: "flex", position: "absolute", top: 0, left: 0, width: size * (fill >= 1 ? 1 : 0.5), height: size, overflow: "hidden" }}>
                <svg width={size} height={size} viewBox="0 0 24 24">
                  <path d={STAR} fill={color} />
                </svg>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/** "★★★★½" as text, for alt text and plain descriptions. */
export function starsText(rating: number): string {
  const full = Math.floor(rating);
  return "★".repeat(full) + (rating - full >= 0.5 ? "½" : "");
}
