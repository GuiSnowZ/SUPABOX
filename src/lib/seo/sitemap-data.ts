import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicSupabase } from "@/lib/supabase/public";

export interface SitemapData {
  games: string[];
  officialLists: Array<{ slug: string; updatedAt: string }>;
  lists: Array<{ id: string; updatedAt: string }>;
  users: string[];
}

type Page<T> = PromiseLike<{ data: T[] | null; error: unknown }>;

/** Every row of a query, 1,000 at a time (PostgREST's page limit). */
async function all<T>(query: (from: number, to: number) => Page<T>, max = 40_000): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; out.length < max; from += 1000) {
    const { data, error } = await query(from, from + 999);
    if (error || !data) break;
    out.push(...data);
    if (data.length < 1000) break;
  }
  return out;
}

/** Everything public worth indexing (read anonymously, so private lists never appear). Cached for a day. */
export async function getSitemapData(): Promise<SitemapData> {
  "use cache";
  cacheLife("days");
  cacheTag("games", "official-lists");
  const db = createPublicSupabase();
  if (!db) return { games: [], officialLists: [], lists: [], users: [] };

  const [games, official, lists, users] = await Promise.all([
    all<{ slug: string }>((a, b) =>
      db.from("games").select("slug").not("cover_url", "is", null).order("popularity", { ascending: false }).order("id").range(a, b),
    ),
    all<{ slug: string; updated_at: string }>((a, b) => db.from("official_lists").select("slug, updated_at").order("slug").range(a, b)),
    all<{ id: string; updated_at: string }>((a, b) =>
      db.from("lists").select("id, updated_at").eq("visibility", "public").order("id").range(a, b),
    ),
    all<{ username: string }>((a, b) => db.from("profiles").select("username").order("username").range(a, b)),
  ]);
  return {
    games: games.map((g) => g.slug),
    officialLists: official.map((l) => ({ slug: l.slug, updatedAt: l.updated_at })),
    lists: lists.map((l) => ({ id: l.id, updatedAt: l.updated_at })),
    users: users.map((u) => u.username),
  };
}
