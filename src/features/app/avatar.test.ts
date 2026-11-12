import { describe, expect, it } from "vitest";
import { centeredSquare } from "./avatar";

describe("centeredSquare", () => {
  it("crops landscape images from the middle", () => {
    expect(centeredSquare(1600, 900)).toEqual([350, 0, 900]);
  });
  it("crops portrait images from the middle", () => {
    expect(centeredSquare(900, 1601)).toEqual([0, 350, 900]);
  });
  it("keeps square images whole", () => {
    expect(centeredSquare(512, 512)).toEqual([0, 0, 512]);
  });
});
