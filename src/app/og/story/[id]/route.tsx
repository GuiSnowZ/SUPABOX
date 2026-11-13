import { ImageResponse } from "next/og";
import { getDictionary } from "@/i18n";
import { ACCENT, OG_BG, OgStars } from "@/lib/seo/og-card";
import { ogFonts } from "@/lib/seo/og-fonts";
import { ogLocale } from "@/lib/seo/og-lang";
import { SITE_URL } from "@/lib/site";
import { createPublicSupabase } from "@/lib/supabase/public";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A 1080×1920 image of a review for Instagram/WhatsApp Stories: the cover,
 * the stars, and Supabox branding at the bottom so people know where it's from.
 * Content stays inside the Stories safe zone (clear of the top/bottom ~250px).
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const locale = ogLocale(request);
  const t = getDictionary(locale);
  const db = createPublicSupabase();
  const id = (await params).id;
  if (!db || !UUID.test(id)) return new Response("Not found", { status: 404 });
  const { data: r } = await db
    .from("reviews")
    .select("rating, body, contains_spoilers, profiles!reviews_user_id_fkey(username), games(title, cover_url, background_url, release_date)")
    .eq("id", id)
    .maybeSingle();
  if (!r) return new Response("Not found", { status: 404 });
  const game = r.games as unknown as { title: string; cover_url: string | null; background_url: string | null; release_date: string | null };
  const author = r.profiles as unknown as { username: string };
  const body = r.contains_spoilers || !r.body ? null : String(r.body).replace(/\s+/g, " ").trim();
  const excerpt = body ? (body.length > 120 ? `“${body.slice(0, 117).replace(/\s+\S*$/, "")}…”` : `“${body}”`) : null;
  const titleSize = game.title.length > 40 ? 58 : game.title.length > 22 ? 70 : 84;
  const art = game.background_url ?? game.cover_url;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", background: OG_BG, color: "#f2f4f5", position: "relative" }}>
        {art ? (
          // eslint-disable-next-line @next/next/no-img-element -- rendered by Satori
          <img src={art} alt="" width={1080} height={1920} style={{ position: "absolute", inset: 0, objectFit: "cover", opacity: 0.28 }} />
        ) : null}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background: `linear-gradient(180deg, rgba(16,18,20,0.55) 0%, rgba(16,18,20,0.82) 40%, ${OG_BG} 72%)`,
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", height: "100%", padding: "260px 90px 230px", position: "relative" }}>
          {game.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- rendered by Satori
            <img
              src={game.cover_url}
              alt=""
              width={560}
              height={747}
              style={{ borderRadius: 28, objectFit: "cover", boxShadow: "0 40px 120px rgba(0,0,0,0.7)", border: "2px solid rgba(255,255,255,0.08)" }}
            />
          ) : null}
          <span style={{ marginTop: 56, fontSize: titleSize, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2, textAlign: "center", display: "flex", justifyContent: "center" }}>
            {game.title}
          </span>
          {game.release_date ? <span style={{ marginTop: 14, fontSize: 36, color: "#a9b0b6" }}>{game.release_date.slice(0, 4)}</span> : null}
          {r.rating !== null ? (
            <div style={{ display: "flex", marginTop: 44 }}>
              <OgStars rating={Number(r.rating)} size={104} gap={14} />
            </div>
          ) : null}
          {excerpt ? (
            <span style={{ marginTop: 40, fontSize: 36, lineHeight: 1.35, color: "#c9ced2", textAlign: "center", display: "flex", justifyContent: "center", maxWidth: 860 }}>
              {excerpt}
            </span>
          ) : null}
          <span style={{ marginTop: 28, fontSize: 32, color: ACCENT, fontWeight: 600 }}>{t.og.reviewBy(`@${author.username}`)}</span>

          <div style={{ display: "flex", flex: 1 }} />
          <div style={{ display: "flex", width: 140, height: 4, borderRadius: 4, background: ACCENT, opacity: 0.8, marginBottom: 40 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- rendered by Satori */}
            <img src={`${SITE_URL}/brand/supabox-mark-128.png`} alt="" width={84} height={84} />
            <span style={{ fontSize: 76, fontWeight: 700, letterSpacing: -2.5 }}>supabox</span>
          </div>
          <span style={{ marginTop: 14, fontSize: 30, color: "#8a9298", letterSpacing: 1 }}>{t.common.tagline} · supaboxd.com</span>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      fonts: await ogFonts(),
      headers: { "Cache-Control": "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400" },
    },
  );
}
