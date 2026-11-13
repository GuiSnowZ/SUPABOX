import { describe, expect, it } from "vitest";
import { clampIndex, swipeStep } from "./carousel";

describe("carousel index", () => {
  it("opens exactly on the clicked position (first, second, third, twelfth, last)", () => {
    for (const i of [0, 1, 2, 11, 24]) expect(clampIndex(i, 25)).toBe(i);
  });
  it("arrows stop at both ends", () => {
    expect(clampIndex(-1, 25)).toBe(0);
    expect(clampIndex(25, 25)).toBe(24);
    expect(clampIndex(12 + 1, 25)).toBe(13);
    expect(clampIndex(12 - 1, 25)).toBe(11);
  });
  it("handles empty and odd input", () => {
    expect(clampIndex(3, 0)).toBe(0);
    expect(clampIndex(Number.NaN, 5)).toBe(0);
    expect(clampIndex(2.7, 5)).toBe(2);
  });
  it("walking forward then back visits every game in order", () => {
    const n = 7;
    const seen: number[] = [];
    let i = 0;
    for (let k = 0; k < n + 2; k++) { seen.push(i); i = clampIndex(i + 1, n); }
    expect([...new Set(seen)]).toEqual([0, 1, 2, 3, 4, 5, 6]);
    for (let k = 0; k < n + 2; k++) i = clampIndex(i - 1, n);
    expect(i).toBe(0);
  });
});

describe("swipes", () => {
  it("left swipe → next, right swipe → previous", () => {
    expect(swipeStep(-80, 5)).toBe(1);
    expect(swipeStep(80, 5)).toBe(-1);
  });
  it("taps and vertical scrolls don't move the carousel", () => {
    expect(swipeStep(10, 0)).toBe(0);
    expect(swipeStep(-60, 200)).toBe(0);
  });
});
