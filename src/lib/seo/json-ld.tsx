import type { Game } from "@/types";
import type { Locale } from "@/i18n/config";
import { SITE_URL } from "@/lib/site";
import { getPublicSupabase } from "@/lib/supabase/public";
import { localizedPath } from "./meta";

/** Structured data (schema.org) for search engines. `<` is escaped so text can't close the tag. */
export function JsonLd({ data }: { data: object }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />
  );
}

const abs = (path: string, locale: Locale) => `${SITE_URL}${localizedPath(path, locale)}`;

/** Home: the site itself and who runs it. */
export function siteJsonLd(locale: Locale, description: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: "Supabox",
        alternateName: "supaboxd",
        url: abs("/", locale),
        description,
        inLanguage: locale,
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Supabox",
        url: SITE_URL,
        logo: `${SITE_URL}/brand/supabox-icon-1024.png`,
      },
    ],
  };
}

/**
 * A game, with the Supabox community's average rating when there is one
 * (ratings are 0.5–5 stars). Queried on its own so it can stream in.
 */
export async function GameJsonLd({ game, locale }: { game: Game; locale: Locale }) {
  const db = getPublicSupabase();
  let rating: { avg: number; count: number } | null = null;
  if (db) {
    const { data } = await db.from("reviews").select("rating").eq("game_id", game.id).not("rating", "is", null).limit(5000);
    const values = (data ?? []).map((r) => Number(r.rating));
    if (values.length) rating = { avg: values.reduce((a, b) => a + b, 0) / values.length, count: values.length };
  }
  const known = (s: string) => (s.startsWith("Unknown") ? undefined : { "@type": "Organization", name: s });
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "VideoGame",
        name: game.title,
        url: abs(`/games/${game.slug}`, locale),
        description: game.summary || undefined,
        image: game.coverUrl ?? undefined,
        datePublished: game.releaseDate ?? undefined,
        genre: game.genres.length ? game.genres : undefined,
        gamePlatform: game.platforms.length ? game.platforms : undefined,
        author: known(game.developer),
        publisher: known(game.publisher),
        aggregateRating: rating
          ? {
              "@type": "AggregateRating",
              ratingValue: Math.round(rating.avg * 10) / 10,
              ratingCount: rating.count,
              bestRating: 5,
              worstRating: 0.5,
            }
          : undefined,
      }}
    />
  );
}

/** An official list as an ordered list of games. */
export function listJsonLd({ name, description, path, locale, games }: {
  name: string;
  description: string;
  path: string;
  locale: Locale;
  games: Array<{ slug: string; title: string }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    description,
    url: abs(path, locale),
    numberOfItems: games.length,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    itemListElement: games.map((g, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: g.title,
      url: abs(`/games/${g.slug}`, locale),
    })),
  };
}
