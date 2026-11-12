import { describe, expect, it } from "vitest";
import type { Game, PlaySession, Review, UserGame } from "@/types";
import { activeYears, computeStats, type StatsInput } from "./stats";

const game = (id: string, genres: string[]): Game => ({ id, slug: id, title: id.toUpperCase(), genres, platforms: [] }) as unknown as Game;
const ug = (gameId: string, status: UserGame["status"], updatedAt: string): UserGame => ({ userId: "u", gameId, status, addedAt: updatedAt, updatedAt });
const session = (gameId: string, startedOn: string, finishedOn: string | null, hours: number | null, platform: string | null): PlaySession =>
  ({ id: `${gameId}-${startedOn}`, userId: "u", gameId, kind: "first_playthrough", startedOn, finishedOn, note: "", hours, platform, createdAt: startedOn });
const review = (gameId: string, rating: number | null, body: string | null, createdAt: string): Review =>
  ({ id: `r-${gameId}`, userId: "u", gameId, rating, body, containsSpoilers: false, createdAt, updatedAt: createdAt });

const input: StatsInput = {
  games: { a: game("a", ["RPG"]), b: game("b", ["RPG", "Indie"]), c: game("c", ["Shooter"]) },
  userGames: [ug("a", "completed", "2026-03-10T00:00:00Z"), ug("b", "completed", "2025-12-01T00:00:00Z"), ug("c", "playing", "2026-05-01T00:00:00Z")],
  sessions: [
    session("a", "2026-01-05", "2026-02-20", 40, "PC"), // finished entry wins over the status date
    session("c", "2026-05-01", null, 6.5, "PlayStation 5"),
    session("b", "2025-11-01", "2025-12-01", 20, "PC"),
  ],
  reviews: [review("a", 5, "Loved it", "2026-02-21T00:00:00Z"), review("c", 3.5, null, "2026-06-01T00:00:00Z"), review("b", 4, "Great", "2025-12-02T00:00:00Z")],
};

describe("computeStats", () => {
  it("summarises a year", () => {
    const s = computeStats(input, 2026);
    expect(s.completed.map((c) => [c.game.id, c.date])).toEqual([["a", "2026-02-20"]]);
    expect(s.completedByMonth[1]).toBe(1);
    expect(s.hours).toBe(46.5);
    expect(s.reviewsWritten).toBe(1);
    expect(s.ratingsGiven).toBe(2);
    expect(s.averageRating).toBe(4.3);
    expect(s.ratingDistribution[9]).toBe(1); // one 5★
    expect(s.ratingDistribution[6]).toBe(1); // one 3.5★
    expect(s.topRated[0].game.id).toBe("a");
    expect(s.gamesPlayed).toBe(2);
    expect(s.topGenres[0]).toEqual({ name: "RPG", count: 1 });
    expect(s.topPlatforms.map((p) => p.name)).toEqual(["PC", "PlayStation 5"]);
  });

  it("covers everything for all time", () => {
    const s = computeStats(input, null);
    expect(s.completed).toHaveLength(2);
    expect(s.hours).toBe(66.5);
    expect(s.topGenres[0]).toEqual({ name: "RPG", count: 2 });
    expect(s.topPlatforms[0]).toEqual({ name: "PC", count: 2 });
  });
});

describe("activeYears", () => {
  it("lists years with activity, newest first", () => {
    expect(activeYears(input)).toEqual([2026, 2025]);
  });
});
