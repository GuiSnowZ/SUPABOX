import type { Locale } from "./config";
import { en } from "./dictionaries/en";
import { ptBR } from "./dictionaries/pt-BR";

export type Dictionary = typeof en;

const DICTIONARIES: Record<Locale, Dictionary> = { en, "pt-BR": ptBR };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? en;
}
