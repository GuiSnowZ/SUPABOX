import type { MetadataRoute } from "next";
import { getSitemapData } from "@/lib/seo/sitemap-data";
import { SITE_URL } from "@/lib/site";

/**
 * /sitemap.xml — public pages in English (plain URLs) and Portuguese (/pt-BR/…),
 * each listing the other as an hreflang alternate so Google shows the right one.
 */
function entry(
  path: string,
  extra: Pick<MetadataRoute.Sitemap[number], "lastModified" | "changeFrequency" | "priority"> = {},
): MetadataRoute.Sitemap {
  const en = `${SITE_URL}${path === "/" ? "" : path}` || SITE_URL;
  const pt = `${SITE_URL}/pt-BR${path === "/" ? "" : path}`;
  const alternates = { languages: { en, "pt-BR": pt, "x-default": en } };
  return [
    { url: en, alternates, ...extra },
    { url: pt, alternates, ...extra },
  ];
}

/** Google reads at most 50,000 URLs per sitemap; games (most popular first) fill what's left. */
const MAX_URLS = 50_000;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await getSitemapData();
  const pages: MetadataRoute.Sitemap = [
    ...entry("/", { changeFrequency: "daily", priority: 1 }),
    ...entry("/games", { changeFrequency: "daily", priority: 0.9 }),
    ...entry("/games/new-releases", { changeFrequency: "daily", priority: 0.8 }),
    ...entry("/games/coming-soon", { changeFrequency: "daily", priority: 0.8 }),
    ...entry("/lists", { changeFrequency: "daily", priority: 0.8 }),
    ...entry("/medals", { changeFrequency: "monthly", priority: 0.3 }),
    ...entry("/privacy", { changeFrequency: "yearly", priority: 0.1 }),
    ...entry("/terms", { changeFrequency: "yearly", priority: 0.1 }),
    ...data.officialLists.flatMap((l) =>
      entry(`/lists/official/${l.slug}`, { lastModified: l.updatedAt, changeFrequency: "daily", priority: 0.7 }),
    ),
    ...data.lists.flatMap((l) => entry(`/lists/${l.id}`, { lastModified: l.updatedAt, changeFrequency: "weekly", priority: 0.5 })),
    ...data.users.flatMap((u) => entry(`/users/${u}`, { changeFrequency: "weekly", priority: 0.4 })),
  ];
  const room = Math.max(0, Math.floor((MAX_URLS - pages.length) / 2));
  return [
    ...pages,
    ...data.games.slice(0, room).flatMap((slug) => entry(`/games/${slug}`, { changeFrequency: "weekly", priority: 0.6 })),
  ];
}
