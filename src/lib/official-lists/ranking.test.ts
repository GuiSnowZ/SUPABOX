import { describe, expect, it } from "vitest";
import { type Candidate, pickBestPerGroup, rankByScore, weightedScore } from "./ranking";

const g = (id: number, name: string, rating: number, count: number, franchise?: string): Candidate => ({
  id,
  name,
  total_rating: rating,
  total_rating_count: count,
  franchises: franchise ? [{ id: id * 10, name: franchise }] : undefined,
});

describe("weightedScore", () => {
  it("pulls small samples towards the prior mean", () => {
    expect(weightedScore(g(1, "a", 100, 0))).toBe(70);
    expect(weightedScore(g(1, "a", 90, 100))).toBe(80);
  });
});

describe("rankByScore", () => {
  it("ranks a 92 from thousands above a 95 from a handful", () => {
    const niche = g(1, "Niche", 95, 30);
    const classic = g(2, "Classic", 92, 3000);
    expect(rankByScore([niche, classic]).map((c) => c.name)).toEqual(["Classic", "Niche"]);
  });
  it("breaks ties by rating count, then name, without mutating input", () => {
    const list = [g(1, "B", 80, 100), g(2, "A", 80, 100), g(3, "C", 75, 50)];
    const copy = [...list];
    expect(rankByScore(list).map((c) => c.name)).toEqual(["A", "B", "C"]);
    expect(list).toEqual(copy);
  });
});

describe("pickBestPerGroup", () => {
  it("ranks groups by total ratings and picks each group's best game", () => {
    const games = [
      g(1, "Mario 1", 85, 500, "Mario"),
      g(2, "Mario 2", 95, 900, "Mario"),
      g(3, "Zelda 1", 97, 1000, "Zelda"),
      g(4, "Solo", 99, 5000),
    ];
    const picked = pickBestPerGroup(games, (c) => c.franchises?.[0]?.name ?? null, 5);
    expect(picked.map((p) => [p.group, p.game.name])).toEqual([
      ["Mario", "Mario 2"],
      ["Zelda", "Zelda 1"],
    ]);
  });
});
