import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { GAME_COLUMNS, type GameDbRow, toGame } from "@/lib/catalog/rows";
import { createPublicSupabase } from "@/lib/supabase/public";
import type { Game } from "@/types";
import type { ListCategory } from "./ranking";

/** Official Supabox lists, read anonymously (only published lists are visible). */

export interface OfficialListSummary {
  slug: string;
  title: string;
  description: string;
  category: ListCategory;
  count: number;
  covers: Game[];
}

export interface OfficialListEntry {
  game: Game;
  section: string | null;
  note: string | null;
}

export interface OfficialList {
  slug: string;
  title: string;
  description: string;
  category: ListCategory;
  criteria: string;
  updatedAt: string;
  entries: OfficialListEntry[];
}

export { CATEGORY_TITLES } from "./categories";

/** The list the onboarding carousel and the roulette draw "classics" from. */
export const CLASSICS_LIST_SLUG = "100-greatest-games-of-all-time";

function db() {
  const client = createPublicSupabase();
  if (!client) throw new Error("Supabase is not configured.");
  return client;
}

interface ItemRow {
  position: number;
  section: string | null;
  note: string | null;
  games: GameDbRow | null;
}

export async function getOfficialLists(): Promise<OfficialListSummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("official-lists");
  const { data, error } = await db()
    .from("official_lists")
    .select(`slug, title, description, category, position, official_list_items(position, games(${GAME_COLUMNS}))`)
    .order("position")
    .order("position", { referencedTable: "official_list_items" });
  if (error) {
    // Before the official-lists migration runs, the table doesn't exist yet.
    if (error.code === "42P01" || error.code === "PGRST205") return [];
    throw new Error(error.message);
  }
  return (data ?? []).map((l) => {
    const items = (l.official_list_items ?? []) as unknown as ItemRow[];
    return {
      slug: l.slug,
      title: l.title,
      description: l.description,
      category: l.category as ListCategory,
      count: items.length,
      covers: items.slice(0, 5).flatMap((i) => (i.games ? [toGame(i.games)] : [])),
    };
  });
}

export async function getOfficialList(slug: string): Promise<OfficialList | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("official-lists");
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return null;
  const { data, error } = await db()
    .from("official_lists")
    .select(`slug, title, description, category, criteria, updated_at, official_list_items(position, section, note, games(${GAME_COLUMNS}))`)
    .eq("slug", slug)
    .order("position", { referencedTable: "official_list_items" })
    .maybeSingle();
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return null;
    throw new Error(error.message);
  }
  if (!data) return null;
  const items = (data.official_list_items ?? []) as unknown as ItemRow[];
  return {
    slug: data.slug,
    title: data.title,
    description: data.description,
    category: data.category as ListCategory,
    criteria: data.criteria,
    updatedAt: data.updated_at,
    entries: items.flatMap((i) => (i.games ? [{ game: toGame(i.games), section: i.section, note: i.note }] : [])),
  };
}

/** Classic games: the all-time greatest list, minus anything from the last ten years. */
export async function getClassicGames(limit = 30): Promise<Game[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("official-lists");
  const list = await getOfficialList(CLASSICS_LIST_SLUG);
  if (!list) return [];
  const cutoff = `${new Date().getUTCFullYear() - 10}-01-01`;
  return list.entries
    .map((e) => e.game)
    .filter((g) => g.releaseDate !== null && g.releaseDate < cutoff)
    .slice(0, limit);
}
