import "server-only";
import { DEFAULT_LOCALE, isLocale, type Locale } from "./config";
import { type Dictionary, getDictionary } from "./index";

/** Dictionary for a page/layout from its `[lang]` param. */
export async function getT(params: Promise<{ lang: string }>): Promise<{ t: Dictionary; locale: Locale }> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  return { t: getDictionary(locale), locale };
}
