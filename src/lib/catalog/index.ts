import { games } from "@/data/games";
import type { Game } from "@/types";
import {
  type CatalogProvider,
  getReleaseStatus,
  matchesQuery,
  sortByReleaseDesc,
} from "./provider";

/**
 * Reference "today" for the mock catalog. Fixed so the prototype's
 * released/upcoming split stays consistent with the mock data. A real
 * provider would use the current date.
 */
export const CATALOG_TODAY = "2026-11-10";

const bySlug = new Map(games.map((g) => [g.slug, g]));
const byId = new Map(games.map((g) => [g.id, g]));

class MockCatalogProvider implements CatalogProvider {
  readonly name = "mock";

  async listGames() {
    return games;
  }

  async getGameBySlug(slug: string) {
    return bySlug.get(slug) ?? null;
  }

  async searchGames(query: string) {
    return games.filter((g) => matchesQuery(g, query)).sort(sortByReleaseDesc);
  }

  async getRecentlyReleased(limit = 24) {
    return games
      .filter((g) => getReleaseStatus(g, CATALOG_TODAY) === "released")
      .sort(sortByReleaseDesc)
      .slice(0, limit);
  }

  async getUpcoming(limit = 12) {
    return games
      .filter((g) => getReleaseStatus(g, CATALOG_TODAY) === "upcoming")
      .sort((a, b) => (a.releaseDate ?? "9999").localeCompare(b.releaseDate ?? "9999"))
      .slice(0, limit);
  }
}

export const catalog: CatalogProvider = new MockCatalogProvider();

/**
 * Synchronous lookups for client components in the prototype, where the
 * full catalog ships with the bundle. Phase 3 replaces these with fetches.
 */
export function getGameById(id: string): Game | undefined {
  return byId.get(id);
}

export function getAllGames(): Game[] {
  return games;
}

export function isReleased(game: Game): boolean {
  return getReleaseStatus(game, CATALOG_TODAY) === "released";
}
