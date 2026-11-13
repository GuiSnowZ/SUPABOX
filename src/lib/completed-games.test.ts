import { describe, expect, it } from "vitest";
import type { Game } from "@/types";
import { arrangeCompleted, type CompletedGame, completedGenres, DEFAULT_COMPLETED_OPTIONS } from "./completed-games";

const g = (title: string, releaseDate: string | null, genres: string[] = []): Game =>
  ({ id: title, slug: title, title, releaseDate, genres, platforms: [] }) as unknown as Game;
const items: CompletedGame[] = [
  { game: g("Bravo", "2020-01-01", ["RPG"]), completedOn: "2026-03-01", rating: 4 },
  { game: g("Alpha", null, ["Shooter"]), completedOn: "2026-05-01", rating: null },
  { game: g("Charlie", "2010-01-01", ["RPG"]), completedOn: "2025-12-01", rating: 5 },
];
const titles = (x: CompletedGame[]) => x.map((i) => i.game.title);

describe("completed games", () => {
  it("defaults to most recently completed and keeps every game", () => {
    const out = arrangeCompleted(items, DEFAULT_COMPLETED_OPTIONS);
    expect(titles(out)).toEqual(["Alpha", "Bravo", "Charlie"]);
    expect(out).toHaveLength(items.length);
  });
  it("sorts by rating with unrated games last", () => {
    expect(titles(arrangeCompleted(items, { ...DEFAULT_COMPLETED_OPTIONS, sort: "rating_desc" }))).toEqual(["Charlie", "Bravo", "Alpha"]);
    expect(titles(arrangeCompleted(items, { ...DEFAULT_COMPLETED_OPTIONS, sort: "rating_asc" }))).toEqual(["Bravo", "Charlie", "Alpha"]);
  });
  it("sorts by release with undated games last", () => {
    expect(titles(arrangeCompleted(items, { ...DEFAULT_COMPLETED_OPTIONS, sort: "release_desc" }))).toEqual(["Bravo", "Charlie", "Alpha"]);
  });
  it("filters by rating and genre", () => {
    expect(titles(arrangeCompleted(items, { ...DEFAULT_COMPLETED_OPTIONS, filter: "unrated" }))).toEqual(["Alpha"]);
    expect(titles(arrangeCompleted(items, { ...DEFAULT_COMPLETED_OPTIONS, filter: "rated", genre: "RPG" }))).toEqual(["Bravo", "Charlie"]);
  });
  it("lists genres most common first", () => {
    expect(completedGenres(items)).toEqual(["RPG", "Shooter"]);
  });
});
