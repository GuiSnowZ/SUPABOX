import { describe, expect, it } from "vitest";
import { igdbSearchTerm, mapGenres, mapPlatforms, normalizeSlug, shortSummary, toGameRow, toIsoDate } from "./map";

describe("IGDB mapping", () => {
  const sample = {
    id: 250618,
    name: "Phantom Blade Zero",
    slug: "phantom-blade-zero",
    first_release_date: 1793232000,
    summary: "Framed for the death of his master, Soul has sixty-six days to live. Alone and hunted, he fights on.",
    cover: { image_id: "cococe" },
    artworks: [{ image_id: "ar6eyx" }],
    platforms: [{ name: "PlayStation 5" }, { name: "PC (Microsoft Windows)" }],
    genres: [{ name: "Role-playing (RPG)" }, { name: "Hack and slash/Beat 'em up" }],
    themes: [{ name: "Action" }, { name: "Open world" }],
    involved_companies: [{ company: { name: "S-Game" }, developer: true, publisher: true }],
    total_rating_count: 8,
    hypes: 227,
    game_type: 0,
  };

  it("maps a full IGDB game to a games row", () => {
    const row = toGameRow(sample, { game: 250618, image_id: "logo1" }, "2026-11-10T00:00:00Z");
    expect(row).toMatchObject({
      slug: "phantom-blade-zero",
      title: "Phantom Blade Zero",
      release_date: "2026-10-29",
      developer: "S-Game",
      publisher: "S-Game",
      platforms: ["PC", "PlayStation 5"],
      genres: ["RPG", "Hack and Slash", "Open World"],
      cover_url: "https://images.igdb.com/igdb/image/upload/t_cover_big_2x/cococe.jpg",
      logo_url: "https://images.igdb.com/igdb/image/upload/t_logo_med/logo1.png",
      background_url: "https://images.igdb.com/igdb/image/upload/t_1080p/ar6eyx.jpg",
      popularity: 235,
      provider: "igdb",
      provider_id: "250618",
    });
    expect(row.summary).toBe("Framed for the death of his master, Soul has sixty-six days to live.");
  });

  it("handles missing optional data", () => {
    const row = toGameRow({ id: 1, name: " Tiny ", slug: "tiny" });
    expect(row.title).toBe("Tiny");
    expect(row.release_date).toBeNull();
    expect(row.cover_url).toBeNull();
    expect(row.developer).toBeNull();
    expect(row.platforms).toEqual([]);
    expect(row.popularity).toBe(0);
  });

  it("orders platforms by importance and de-duplicates", () => {
    expect(mapPlatforms([{ name: "Android" }, { name: "Mac" }, { name: "PC (Microsoft Windows)" }, { name: "Mac" }])).toEqual([
      "PC",
      "macOS",
      "Android",
    ]);
  });

  it("keeps only useful theme tags", () => {
    expect(mapGenres({ genres: [{ name: "Shooter" }], themes: [{ name: "Horror" }, { name: "Action" }] })).toEqual([
      "Shooter",
      "Horror",
    ]);
  });

  it("normalises slugs but keeps IGDB double dashes", () => {
    expect(normalizeSlug("andy-capp--1", 1)).toBe("andy-capp--1");
    expect(normalizeSlug("Pokémon Légendes!", 2)).toBe("pokemon-legendes");
    expect(normalizeSlug("!!!", 3)).toBe("game-3");
  });

  it("shortens summaries at a sentence or word boundary", () => {
    expect(shortSummary("Short.")).toBe("Short.");
    const long = "word ".repeat(80);
    const out = shortSummary(long, 50);
    expect(out.length).toBeLessThanOrEqual(51);
    expect(out.endsWith("…")).toBe(true);
  });

  it("converts unix seconds to UTC dates", () => {
    expect(toIsoDate(0)).toBe("1970-01-01");
    expect(toIsoDate(undefined)).toBeNull();
  });

  it("sanitises search terms for IGDB queries", () => {
    expect(igdbSearchTerm('zel"da\\  ')).toBe("zel da");
  });
});
