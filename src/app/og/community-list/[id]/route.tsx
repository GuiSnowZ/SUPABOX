import { getDictionary } from "@/i18n";
import { createPublicSupabase } from "@/lib/supabase/public";
import { ogImage, OgCover } from "@/lib/seo/og-card";
import { ogLocale } from "@/lib/seo/og-lang";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const locale = ogLocale(request);
  const t = getDictionary(locale);
  const db = createPublicSupabase();
  const id = (await params).id;
  if (!db || !UUID.test(id)) return new Response("Not found", { status: 404 });
  // Anonymous read: private lists are invisible here, so they never get a card.
  const { data: l } = await db
    .from("lists")
    .select("title, description, profiles!lists_user_id_fkey(display_name), list_items(position, games(cover_url))")
    .eq("id", id)
    .order("position", { referencedTable: "list_items" })
    .maybeSingle();
  if (!l) return new Response("Not found", { status: 404 });
  const items = (l.list_items ?? []) as unknown as Array<{ games: { cover_url: string | null } | null }>;
  const covers = items.flatMap((i) => (i.games?.cover_url ? [i.games.cover_url] : [])).slice(0, 3);
  const author = l.profiles as unknown as { display_name: string } | null;
  return ogImage({
    art: covers.length ? (
      <div style={{ display: "flex", position: "relative", width: 400, height: 440 }}>
        {covers.map((src, i) => (
          <div key={src} style={{ display: "flex", position: "absolute", left: i * 70, top: i * 20 }}>
            <OgCover src={src} width={250} />
          </div>
        ))}
      </div>
    ) : undefined,
    kicker: author ? t.og.listBy(author.display_name) : t.og.list,
    title: l.title,
    lines: [l.description, t.og.games(items.length)].filter(Boolean),
  });
}
