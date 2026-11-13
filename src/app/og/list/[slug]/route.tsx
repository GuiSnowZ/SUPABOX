import { getDictionary } from "@/i18n";
import { officialListText } from "@/i18n/official-lists";
import { getOfficialList } from "@/lib/official-lists/server";
import { ogImage, OgCover } from "@/lib/seo/og-card";
import { ogLocale } from "@/lib/seo/og-lang";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const locale = ogLocale(request);
  const t = getDictionary(locale);
  const list = await getOfficialList((await params).slug);
  if (!list) return new Response("Not found", { status: 404 });
  const text = officialListText(list, locale);
  const covers = list.entries.slice(0, 3).flatMap((e) => (e.game.coverUrl ? [e.game.coverUrl] : []));
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
    kicker: t.og.officialList,
    title: text.title,
    lines: [text.description, t.og.games(list.entries.length)],
  });
}
