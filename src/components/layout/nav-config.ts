import { Gamepad2, List, type LucideIcon, Star, User } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Path prefixes that mark this item as active. */
  match: string[];
}

/** The four primary destinations. Order matters: desktop left→right, mobile tab bar. */
export const PRIMARY_NAV: NavItem[] = [
  { href: "/games", label: "Games", icon: Gamepad2, match: ["/games"] },
  { href: "/lists", label: "Lists", icon: List, match: ["/lists"] },
  { href: "/reviews", label: "Reviews", icon: Star, match: ["/reviews"] },
  { href: "/profile", label: "Profile", icon: User, match: ["/profile", "/library", "/users"] },
];

export function isActive(item: NavItem, pathname: string | null): boolean {
  if (!pathname) return false;
  return item.match.some((m) => pathname === m || pathname.startsWith(`${m}/`));
}
