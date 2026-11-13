import { getDictionary } from "@/i18n";
import { createPublicSupabase } from "@/lib/supabase/public";
import { ogImage, OgCover, OgStars } from "@/lib/seo/og-card";
import { ogLocale } from "@/lib/seo/og-lang";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const locale = ogLocale(request);
  const t = getDictionary(locale);
  const db = createPublicSupabase();
  const id = (await params).id;
  if (!db || !UUID.test(id)) return new Response("Not found", { status: 404 });
  const { data: r } = await db
    .from("reviews")
    .select("rating, body, contains_spoilers, profiles!reviews_user_id_fkey(display_name), games(title, cover_url, background_url)")
    .eq("id", id)
    .maybeSingle();
  if (!r) return new Response("Not found", { status: 404 });
  const game = r.games as unknown as { title: string; cover_url: string | null; background_url: string | null };
  const author = r.profiles as unknown as { display_name: string };
  const body = r.contains_spoilers || !r.body ? null : String(r.body).replace(/\s+/g, " ");
  const excerpt = body && body.length > 140 ? `“${body.slice(0, 137).replace(/\s+\S*$/, "")}…”` : body ? `“${body}”` : null;
  return ogImage({
    art: game.cover_url ? <OgCover src={game.cover_url} /> : undefined,
    background: game.background_url,
    kicker: t.og.reviewBy(author.display_name),
    title: game.title,
    lines: excerpt ? [excerpt] : [],
    badge: r.rating !== null ? <OgStars rating={Number(r.rating)} size={54} /> : undefined,
  });
}
