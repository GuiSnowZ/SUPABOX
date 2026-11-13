import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/config";

/** Share images take their language from ?lang= (set by the page's metadata). */
export function ogLocale(request: Request): Locale {
  const lang = new URL(request.url).searchParams.get("lang");
  return isLocale(lang) ? lang : DEFAULT_LOCALE;
}

/** Path for a share image in a given language. */
export function ogPath(path: string, locale: Locale): string {
  return locale === DEFAULT_LOCALE ? path : `${path}?lang=${locale}`;
}
