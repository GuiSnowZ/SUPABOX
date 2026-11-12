import { describe, expect, it } from "vitest";
import { pageWindow } from "./pagination";

describe("pageWindow", () => {
  it("shows every page when there are few", () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
  it("collapses the middle with ellipses", () => {
    expect(pageWindow(10, 20)).toEqual([1, "…", 9, 10, 11, "…", 20]);
  });
  it("keeps the first pages visible near the start", () => {
    expect(pageWindow(1, 20)).toEqual([1, 2, 3, 4, "…", 20]);
    expect(pageWindow(3, 20)).toEqual([1, 2, 3, 4, "…", 20]);
  });
  it("keeps the last pages visible near the end", () => {
    expect(pageWindow(20, 20)).toEqual([1, "…", 17, 18, 19, 20]);
    expect(pageWindow(18, 20)).toEqual([1, "…", 17, 18, 19, 20]);
  });
});
