import { twMerge } from "tailwind-merge";

/**
 * Join class names, skipping falsy values. Conflicting Tailwind classes are
 * resolved in favour of the later one, so a caller's `w-8` overrides a
 * component's default `w-full` (plain joining left that to CSS order).
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return twMerge(classes.filter(Boolean).join(" "));
}

/** BCP 47 tag for Intl formatting ("en" UI → "en-US"). */
const intlTag = (locale: string) => (locale === "pt-BR" ? "pt-BR" : "en-US");
const fmtCache = new Map<string, Intl.DateTimeFormat>();
function dateFormatter(locale: string, opts: Intl.DateTimeFormatOptions, key: string, local = false): Intl.DateTimeFormat {
  const k = `${locale}:${key}:${local ? "local" : "utc"}`;
  let f = fmtCache.get(k);
  if (!f) {
    f = new Intl.DateTimeFormat(intlTag(locale), { ...opts, timeZone: local ? undefined : "UTC" });
    fmtCache.set(k, f);
  }
  return f;
}

/**
 * Calendar dates ("2026-11-12") are shown as-is (UTC). Moments in time
 * ("2026-11-13T00:30:00Z", e.g. when a review was written) are shown in the
 * viewer's own time zone in the browser, so a review written at 9:30 pm in
 * Brazil doesn't show the next day. On the server they fall back to UTC.
 */
const inLocalTime = (iso: string) => typeof window !== "undefined" && iso.includes("T");

/** "Oct 30, 2026" / "30 de out. de 2026". */
export function formatDate(iso: string, locale = "en"): string {
  return dateFormatter(locale, { year: "numeric", month: "short", day: "numeric" }, "date", inLocalTime(iso)).format(new Date(iso));
}

export function formatShortDate(iso: string, locale = "en"): string {
  return dateFormatter(locale, { month: "short", day: "numeric" }, "short", inLocalTime(iso)).format(new Date(iso));
}

export function formatReleaseDate(iso: string | null, locale = "en"): string {
  return iso ? formatDate(iso, locale) : locale === "pt-BR" ? "A definir" : "TBA";
}

export function releaseYear(iso: string | null, locale = "en"): string {
  return iso ? iso.slice(0, 4) : locale === "pt-BR" ? "A definir" : "TBA";
}

/** "3 days ago" style relative time, falling back to a date after ~4 weeks. */
export function timeAgo(iso: string, locale = "en", now: Date = new Date()): string {
  const pt = locale === "pt-BR";
  const diff = Math.max(0, now.getTime() - new Date(iso).getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return pt ? "agora mesmo" : "just now";
  if (minutes < 60) return pt ? `há ${minutes} min` : `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return pt ? `há ${hours} h` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 28) return pt ? `há ${days} d` : `${days}d ago`;
  return formatDate(iso, locale);
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/**
 * New row id. Rows are created with client-generated UUIDs so optimistic
 * updates and the database agree on the id.
 */
export function createId(): string {
  return crypto.randomUUID();
}
