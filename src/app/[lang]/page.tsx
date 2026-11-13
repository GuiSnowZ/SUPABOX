import type { Metadata } from "next";
import { HomeView } from "@/components/home/home-view";
import { getRecentlyReleased, getTodaysReleases } from "@/lib/catalog/server";
import { getT } from "@/i18n/server";
import { JsonLd, siteJsonLd } from "@/lib/seo/json-ld";
import { alternatesFor } from "@/lib/seo/meta";

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { locale } = await getT(params);
  return { alternates: alternatesFor("/", locale) };
}

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { t, locale } = await getT(params);
  const [recent, today] = await Promise.all([getRecentlyReleased(12), getTodaysReleases(12)]);
  return (
    <>
      <JsonLd data={siteJsonLd(locale, t.meta.description)} />
      <HomeView recent={recent} today={today} />
    </>
  );
}
