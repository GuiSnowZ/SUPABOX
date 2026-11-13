import type { Metadata } from "next";
import { HomeView } from "@/components/home/home-view";
import { getHiddenGems, getPopularPicks, getRecentReleasesPage, getTrending } from "@/lib/catalog/discovery";
import { getTodaysReleases } from "@/lib/catalog/server";
import { getT } from "@/i18n/server";
import { JsonLd, siteJsonLd } from "@/lib/seo/json-ld";
import { alternatesFor } from "@/lib/seo/meta";

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { locale } = await getT(params);
  return { alternates: alternatesFor("/", locale) };
}

/** Home rows for the Home page (the full lists live on each row's "View all" page). */
const ROW = 12;

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { t, locale } = await getT(params);
  // All cached on the server; the personal rows load in the browser.
  const [trending, recent, gems, picks, today] = await Promise.all([
    getTrending(),
    getRecentReleasesPage(1),
    getHiddenGems(),
    getPopularPicks(),
    getTodaysReleases(12),
  ]);
  return (
    <>
      <JsonLd data={siteJsonLd(locale, t.meta.description)} />
      <HomeView
        trending={{ ...trending, items: trending.items.slice(0, ROW) }}
        recent={recent.games.slice(0, ROW)}
        gems={{ ...gems, items: gems.items.slice(0, ROW) }}
        picks={picks}
        today={today}
      />
    </>
  );
}
