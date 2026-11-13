import type { Metadata } from "next";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { ogPath } from "./og-lang";

/** A page's URL in a language: English is the plain path, others get a prefix. */
export function localizedPath(path: string, locale: Locale): string {
  if (locale === DEFAULT_LOCALE) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/** Canonical URL plus hreflang links to every language version. */
export function alternatesFor(path: string, locale: Locale): Metadata["alternates"] {
  return {
    canonical: localizedPath(path, locale),
    languages: { en: path, "pt-BR": localizedPath(path, "pt-BR"), "x-default": path },
  };
}

/**
 * Metadata for a shareable page: canonical/hreflang, plus the generated share
 * image for link previews (WhatsApp, Discord, X, iMessage...).
 */
export function shareMetadata({
  path,
  locale,
  title,
  description,
  image,
  type = "website",
}: {
  path: string;
  locale: Locale;
  title: string;
  description?: string | null;
  image: string;
  type?: "website" | "article" | "profile";
}): Metadata {
  const url = ogPath(image, locale);
  const desc = description?.trim() ? description.trim().slice(0, 300) : undefined;
  return {
    alternates: alternatesFor(path, locale),
    openGraph: {
      type,
      siteName: "Supabox",
      locale: locale === "pt-BR" ? "pt_BR" : "en_US",
      url: localizedPath(path, locale),
      title,
      description: desc,
      images: [{ url, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description: desc, images: [url] },
  };
}
