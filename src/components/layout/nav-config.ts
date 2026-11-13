import { Home, List, type LucideIcon, Search, Star, User } from "lucide-react";
import { LOCALES } from "@/i18n/config";

export interface NavItem {
  href: string;
  /** Key in the dictionary's `nav` section. */
  label: "home" | "search" | "lists" | "reviews" | "profile";
  icon: LucideIcon;
  /** Path prefixes that mark this item as active ("/" only matches the Home itself). */
  match: string[];
}

const HOME: NavItem = { href: "/", label: "home", icon: Home, match: ["/"] };
/** The catalog: search first, then ways to explore. */
const GAMES: NavItem = { href: "/games", label: "search", icon: Search, match: ["/games"] };
const LISTS: NavItem = { href: "/lists", label: "lists", icon: List, match: ["/lists"] };
const REVIEWS: NavItem = { href: "/reviews", label: "reviews", icon: Star, match: ["/reviews"] };
const PROFILE: NavItem = { href: "/profile", label: "profile", icon: User, match: ["/profile", "/library", "/users"] };

/** Desktop header, left → right. */
export const PRIMARY_NAV: NavItem[] = [HOME, GAMES, LISTS, REVIEWS, PROFILE];

/**
 * Phone tab bar: four destinations around the quick-add "+" (a fifth would
 * push the "+" off centre and squeeze the labels). Reviews lives in the
 * account menu and on the Home there.
 */
export const MOBILE_NAV: NavItem[] = [HOME, GAMES, LISTS, PROFILE];

/** The path without a language prefix ("/pt-BR/games" → "/games"). */
function withoutLocale(pathname: string): string {
  for (const l of LOCALES) {
    if (pathname === `/${l}`) return "/";
    if (pathname.startsWith(`/${l}/`)) return pathname.slice(l.length + 1);
  }
  return pathname;
}

export function isActive(item: NavItem, pathname: string | null): boolean {
  if (!pathname) return false;
  const path = withoutLocale(pathname);
  return item.match.some((m) => (m === "/" ? path === "/" : path === m || path.startsWith(`${m}/`)));
}
