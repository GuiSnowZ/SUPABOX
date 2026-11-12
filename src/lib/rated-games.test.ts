import { describe, expect, it } from "vitest";
import type { Game } from "@/types";
import { arrangeRatedGames, DEFAULT_RATED_OPTIONS, type RatedGame, ratedFacets } from "./rated-games";

function item(title: string, rating: number, ratedAt: string, extra: Partial<Game> = {}): RatedGame {
  const game = {
    id: title,
    slug: title.toLowerCase(),
    title,
    releaseDate: null,
    genres: [],
    platforms: [],
    criticScore: null,
    ...extra,
  } as unknown as Game;
  return {
    game,
    review: { id: `r-${title}`, userId: "u", gameId: title, rating, body: null, containsSpoilers: false, createdAt: ratedAt, updatedAt: ratedAt },
  };
}

const items = [
  item("Celeste", 5, "2026-11-01", { releaseDate: "2018-01-25", genres: ["Platform", "Indie"], platforms: ["PC", "Switch"], criticScore: 92 }),
  item("anthem", 2, "2026-11-10", { releaseDate: "2019-02-22", genres: ["Shooter"], platforms: ["PC"], criticScore: 59 }),
  item("Hades", 4.5, "2026-10-01", { releaseDate: "2020-09-17", genres: ["Indie", "RPG"], platforms: ["Switch"], criticScore: 93 }),
  item("Mystery", 3, "2026-09-01"),
];
const titles = (list: RatedGame[]) => list.map((i) => i.game.title);
const opts = (o: Partial<typeof DEFAULT_RATED_OPTIONS>) => ({ ...DEFAULT_RATED_OPTIONS, ...o });

describe("arrangeRatedGames", () => {
  it("sorts by most recently rated by default", () => {
    expect(titles(arrangeRatedGames(items, DEFAULT_RATED_OPTIONS))).toEqual(["anthem", "Celeste", "Hades", "Mystery"]);
  });
  it("sorts by release date, undated games last either way", () => {
    expect(titles(arrangeRatedGames(items, opts({ sort: "release_desc" })))).toEqual(["Hades", "anthem", "Celeste", "Mystery"]);
    expect(titles(arrangeRatedGames(items, opts({ sort: "release_asc" })))).toEqual(["Celeste", "anthem", "Hades", "Mystery"]);
  });
  it("sorts A–Z ignoring case", () => {
    expect(titles(arrangeRatedGames(items, opts({ sort: "title" })))).toEqual(["anthem", "Celeste", "Hades", "Mystery"]);
  });
  it("sorts by rating and by critic score", () => {
    expect(titles(arrangeRatedGames(items, opts({ sort: "rating_desc" })))).toEqual(["Celeste", "Hades", "Mystery", "anthem"]);
    expect(titles(arrangeRatedGames(items, opts({ sort: "rating_asc" })))).toEqual(["anthem", "Mystery", "Hades", "Celeste"]);
    expect(titles(arrangeRatedGames(items, opts({ sort: "critic_desc" })))).toEqual(["Hades", "Celeste", "anthem", "Mystery"]);
  });
  it("filters by rating, genre and platform", () => {
    expect(titles(arrangeRatedGames(items, opts({ rating: "4" })))).toEqual(["Celeste", "Hades"]);
    expect(titles(arrangeRatedGames(items, opts({ rating: "5" })))).toEqual(["Celeste"]);
    expect(titles(arrangeRatedGames(items, opts({ rating: "low" })))).toEqual(["anthem"]);
    expect(titles(arrangeRatedGames(items, opts({ genre: "Indie", platform: "Switch" })))).toEqual(["Celeste", "Hades"]);
  });
  it("does not mutate the input", () => {
    const before = titles(items);
    arrangeRatedGames(items, opts({ sort: "title" }));
    expect(titles(items)).toEqual(before);
  });
});

describe("ratedFacets", () => {
  it("lists genres and platforms, most common first", () => {
    const f = ratedFacets(items);
    expect(f.genres[0]).toBe("Indie");
    expect(f.platforms).toEqual(["PC", "Switch"]);
  });
});
