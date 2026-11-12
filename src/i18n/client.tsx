"use client";

import { createContext, type ReactNode, useContext } from "react";
import { DEFAULT_LOCALE, type Locale } from "./config";
import { type Dictionary, getDictionary } from "./index";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

/** Set once in the root layout from the [lang] segment. */
export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** The dictionary for the current language. */
export function useT(): Dictionary {
  return getDictionary(useContext(LocaleContext));
}
