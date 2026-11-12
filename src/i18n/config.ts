/**
 * Languages. URLs don't carry the language: the proxy picks it (saved choice →
 * browser language → English) and rewrites to the internal /[lang]/… route, so
 * each page is pre-rendered once per language.
 */
export const LOCALES = ["en", "pt-BR"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "supabox-locale";
export const LOCALE_NAMES: Record<Locale, string> = { en: "English", "pt-BR": "Português (Brasil)" };

export function isLocale(value: string | undefined | null): value is Locale {
  return (LOCALES as readonly string[]).includes(value ?? "");
}

/** Best match for an Accept-Language header (any Portuguese → pt-BR). */
export function localeFromAcceptLanguage(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;
  const langs = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of langs) {
    if (tag.startsWith("pt")) return "pt-BR";
    if (tag.startsWith("en")) return "en";
  }
  return DEFAULT_LOCALE;
}
