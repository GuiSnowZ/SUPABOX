import { describe, expect, it } from "vitest";
import { releaseBuzz, sortByReleaseBuzz } from "./rows";

const today = "2026-11-12";

describe("releaseBuzz", () => {
  it("halves popularity every 21 days", () => {
    expect(releaseBuzz({ releaseDate: today, popularity: 100 }, today)).toBe(100);
    expect(releaseBuzz({ releaseDate: "2026-10-22", popularity: 100 }, today)).toBeCloseTo(50);
  });

  it("is zero without a release date", () => {
    expect(releaseBuzz({ releaseDate: null, popularity: 500 }, today)).toBe(0);
  });
});

describe("sortByReleaseBuzz", () => {
  it("puts a fresh big release above a bigger but older one", () => {
    // Real case: Zelda: Ocarina of Time remake (Nov 5, popularity 107) vs Marvel's Wolverine (Sep 15, 342).
    const zelda = { title: "Zelda", releaseDate: "2026-11-05", popularity: 107 };
    const wolverine = { title: "Wolverine", releaseDate: "2026-09-15", popularity: 342 };
    expect(sortByReleaseBuzz([wolverine, zelda], today).map((g) => g.title)).toEqual(["Zelda", "Wolverine"]);
  });

  it("does not let a tiny game released today beat last week's hit", () => {
    const tiny = { title: "Tiny", releaseDate: today, popularity: 5 };
    const hit = { title: "Hit", releaseDate: "2026-11-05", popularity: 300 };
    expect(sortByReleaseBuzz([tiny, hit], today).map((g) => g.title)).toEqual(["Hit", "Tiny"]);
  });

  it("breaks ties by newest first", () => {
    const a = { title: "A", releaseDate: "2026-11-01", popularity: 0 };
    const b = { title: "B", releaseDate: "2026-11-10", popularity: 0 };
    expect(sortByReleaseBuzz([a, b], today).map((g) => g.title)).toEqual(["B", "A"]);
  });
});
