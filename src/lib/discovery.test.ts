import { describe, expect, it } from "vitest";
import type { Game } from "@/types";
import {
  bayesianRating,
  buildTaste,
  hasEnoughTaste,
  hiddenGems,
  recommend,
  scoreActivity,
  topGenres,
  trendingFromActivity,
} from "./discovery";

const now = new Date("2026-11-13T12:00:00Z");
const ago = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString();
const game = (id: string, genres: string[], extra: Partial<Game> = {}): Game =>
  ({
    id,
    slug: id,
    title: id,
    releaseDate: "2020-01-01",
    summary: "",
    description: "",
    developer: "",
    publisher: "",
    platforms: [],
    genres,
    coverUrl: null,
    logoUrl: null,
    backgroundUrl: null,
    popularity: 100,
    criticScore: 80,
    criticCount: 5,
    externalRef: { provider: "igdb", id },
    ...extra,
  }) as Game;

describe("activity scoring", () => {
  it("counts each person once per game, using their strongest action", () => {
    const s = scoreActivity(
      [
        { userId: "a", gameId: "g", type: "added_to_library", createdAt: ago(0) },
        { userId: "a", gameId: "g", type: "started_playing", createdAt: ago(0) },
        { userId: "a", gameId: "g", type: "published_review", createdAt: ago(0) },
      ],
      now,
      7,
    );
    expect(s).toHaveLength(1);
    expect(s[0].people).toBe(1);
    expect(s[0].score).toBe(3);
  });
  it("more people beat one very active person", () => {
    const s = scoreActivity(
      [
        { userId: "a", gameId: "solo", type: "published_review", createdAt: ago(0) },
        { userId: "b", gameId: "group", type: "added_to_library", createdAt: ago(0) },
        { userId: "c", gameId: "group", type: "started_playing", createdAt: ago(0) },
        { userId: "d", gameId: "group", type: "added_to_library", createdAt: ago(0) },
      ],
      now,
      7,
    );
    expect(s[0].gameId).toBe("group");
  });
  it("recent activity counts more and old activity is ignored", () => {
    const s = scoreActivity(
      [
        { userId: "a", gameId: "fresh", type: "completed", createdAt: ago(0) },
        { userId: "a", gameId: "stale", type: "completed", createdAt: ago(6) },
        { userId: "a", gameId: "gone", type: "completed", createdAt: ago(8) },
      ],
      now,
      7,
    );
    expect(s.map((x) => x.gameId)).toEqual(["fresh", "stale"]);
    expect(s[0].score).toBeGreaterThan(s[1].score);
  });
  it("trending needs at least two different people", () => {
    const t = trendingFromActivity(
      [
        { userId: "a", gameId: "x", type: "published_review", createdAt: ago(1) },
        { userId: "a", gameId: "y", type: "added_to_library", createdAt: ago(1) },
        { userId: "b", gameId: "y", type: "added_to_library", createdAt: ago(2) },
      ],
      now,
    );
    expect(t.map((x) => x.gameId)).toEqual(["y"]);
  });
  it("lists the people behind a game, most recent first", () => {
    const [g] = scoreActivity(
      [
        { userId: "old", gameId: "g", type: "completed", createdAt: ago(5) },
        { userId: "new", gameId: "g", type: "completed", createdAt: ago(1) },
      ],
      now,
      30,
    );
    expect(g.userIds).toEqual(["new", "old"]);
  });
});

describe("hidden gems", () => {
  it("a single 5-star rating isn't enough", () => {
    expect(hiddenGems([{ gameId: "g", rating: 5 }], new Map([["g", 10]]))).toEqual([]);
    expect(bayesianRating(5, 1)).toBeLessThan(3.8);
  });
  it("well-rated, lesser-known games qualify; mainstream ones don't", () => {
    const ratings = ["a", "b", "c", "d"].flatMap(() => [
      { gameId: "gem", rating: 5 },
      { gameId: "famous", rating: 5 },
    ]);
    const res = hiddenGems(ratings, new Map([["gem", 40], ["famous", 900]]));
    expect(res.map((g) => g.gameId)).toEqual(["gem"]);
    expect(res[0].count).toBe(4);
  });
  it("mediocre ratings don't qualify even with many votes", () => {
    const ratings = Array.from({ length: 20 }, () => ({ gameId: "meh", rating: 3 }));
    expect(hiddenGems(ratings, new Map([["meh", 10]]))).toEqual([]);
  });
});

describe("you might like", () => {
  const rpg1 = game("rpg1", ["Role-playing (RPG)"]);
  const rpg2 = game("rpg2", ["Role-playing (RPG)", "Adventure"]);
  const shooter = game("shooter", ["Shooter"]);

  it("doesn't claim to know a new user's taste", () => {
    expect(hasEnoughTaste(buildTaste({ favorites: [], ratings: [], library: [] }))).toBe(false);
    expect(hasEnoughTaste(buildTaste({ favorites: [], ratings: [], library: [{ game: rpg1, status: "want_to_play" }] }))).toBe(false);
  });
  it("loves RPGs → recommends RPGs, not shooters, and never games already played", () => {
    const taste = buildTaste({
      favorites: [rpg1],
      ratings: [{ game: rpg1, rating: 5 }, { game: shooter, rating: 1.5 }],
      library: [{ game: rpg1, status: "completed" }],
    });
    expect(hasEnoughTaste(taste)).toBe(true);
    expect(topGenres(taste)[0]).toBe("Role-playing (RPG)");
    const recs = recommend(taste, [rpg1, shooter, game("rpg3", ["Role-playing (RPG)"]), game("shooter2", ["Shooter"]), rpg2]);
    const ids = recs.map((r) => r.game.id);
    expect(ids).not.toContain("rpg1");
    expect(ids).not.toContain("shooter");
    expect(ids).not.toContain("shooter2");
    expect(ids).toEqual(expect.arrayContaining(["rpg3", "rpg2"]));
    expect(recs[0].because).toBe("Role-playing (RPG)");
  });
  it("quality breaks ties between equally matching games", () => {
    const taste = buildTaste({ favorites: [rpg1, rpg2], ratings: [], library: [] });
    const recs = recommend(taste, [
      game("ok", ["Role-playing (RPG)"], { criticScore: 70 }),
      game("great", ["Role-playing (RPG)"], { criticScore: 95 }),
    ]);
    expect(recs.map((r) => r.game.id)).toEqual(["great", "ok"]);
  });
});
