import { getDictionary } from "@/i18n";
import { genreName } from "@/i18n/genres";
import { isReleasedOn, todayIso } from "@/lib/catalog/rows";
import { resolveGameBySlug } from "@/lib/catalog/server";
import { ogImage, OgCover, OgScore } from "@/lib/seo/og-card";
import { ogLocale } from "@/lib/seo/og-lang";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const locale = ogLocale(request);
  const t = getDictionary(locale);
  const game = await resolveGameBySlug((await params).slug);
  if (!game) return new Response("Not found", { status: 404 });
  const year = game.releaseDate?.slice(0, 4) ?? t.common.tba;
  const genres = game.genres.slice(0, 3).map((g) => genreName(g, locale)).join(" · ");
  const developer = game.developer.startsWith("Unknown") ? null : game.developer;
  return ogImage({
    art: game.coverUrl ? <OgCover src={game.coverUrl} /> : undefined,
    background: game.backgroundUrl,
    kicker: isReleasedOn(game, todayIso()) ? genres || t.og.game : t.og.comingSoon,
    title: game.title,
    lines: [[year, developer].filter(Boolean).join(" · ")],
    badge: game.criticScore !== null ? <OgScore score={game.criticScore} label={t.og.criticScore(game.criticCount)} /> : undefined,
  });
}
