/** Public site settings (safe for the browser). */

/** Canonical address, e.g. https://supaboxd.com. Falls back to localhost in development. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

/**
 * Search engines may index the site only when NEXT_PUBLIC_ALLOW_INDEXING=true.
 * Default: hidden (pre-launch beta).
 */
export const ALLOW_INDEXING = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";
