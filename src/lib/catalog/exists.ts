import { getIgdbClient } from "@/lib/igdb/client";
import { getPublicSupabase } from "@/lib/supabase/public";

/**
 * Cheap "does this game exist?" check for the proxy, so unknown game URLs get
 * a real HTTP 404 (streamed pages can't change their status code).
 * Answers are cached in memory; errors fail open (the page decides).
 */
const SLUG = /^[a-z0-9]+(-+[a-z0-9]+)*$/;
const POSITIVE_TTL = 6 * 60 * 60 * 1000;
const NEGATIVE_TTL = 5 * 60 * 1000;
const MAX_ENTRIES = 5000;
const cache = new Map<string, { exists: boolean; until: number }>();

function remember(slug: string, exists: boolean) {
  if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value as string);
  cache.set(slug, { exists, until: Date.now() + (exists ? POSITIVE_TTL : NEGATIVE_TTL) });
  return exists;
}

export async function gameMayExist(slug: string): Promise<boolean> {
  if (!SLUG.test(slug)) return false;
  const hit = cache.get(slug);
  if (hit && hit.until > Date.now()) return hit.exists;
  try {
    const db = getPublicSupabase();
    if (db) {
      const { data, error } = await db.from("games").select("id").eq("slug", slug).maybeSingle();
      if (error) return true;
      if (data) return remember(slug, true);
    }
    const igdb = getIgdbClient();
    if (!igdb) return remember(slug, false);
    const found = await igdb.query<{ id: number }>("games", `fields id; where slug = "${slug}"; limit 1;`);
    return remember(slug, found.length > 0);
  } catch {
    return true;
  }
}
