import { twMerge } from "tailwind-merge";

/**
 * Join class names, skipping falsy values. Conflicting Tailwind classes are
 * resolved in favour of the later one, so a caller's `w-8` overrides a
 * component's default `w-full` (plain joining left that to CSS order).
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return twMerge(classes.filter(Boolean).join(" "));
}

const dateFmt = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const shortDateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

/** "Oct 30, 2026". Dates are formatted in UTC so server and client output match. */
export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso));
}

export function formatShortDate(iso: string): string {
  return shortDateFmt.format(new Date(iso));
}

export function formatReleaseDate(iso: string | null): string {
  return iso ? formatDate(iso) : "TBA";
}

export function releaseYear(iso: string | null): string {
  return iso ? iso.slice(0, 4) : "TBA";
}

/** "3 days ago" style relative time, falling back to a date after ~4 weeks. */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const diff = Math.max(0, now.getTime() - new Date(iso).getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 28) return `${days}d ago`;
  return formatDate(iso);
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
