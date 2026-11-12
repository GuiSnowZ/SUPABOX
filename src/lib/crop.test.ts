import { describe, expect, it } from "vitest";
import { clampPosition, cropRect, initialCrop, zoomTo } from "./crop";

const W = 1600, H = 900, V = 300; // landscape photo in a 300px viewport

describe("crop geometry", () => {
  it("starts centred, covering the viewport", () => {
    const s = initialCrop(W, H, V);
    expect(s.zoom).toBe(1);
    expect(s.y).toBe(0);
    expect(cropRect(W, H, V, s)).toEqual({ sx: 350, sy: 0, side: 900 });
  });

  it("never lets empty space show when dragging", () => {
    expect(clampPosition(W, H, V, { zoom: 1, x: 50, y: 20 })).toMatchObject({ x: 0, y: 0 });
    const far = clampPosition(W, H, V, { zoom: 1, x: -10_000, y: -10_000 });
    expect(cropRect(W, H, V, far)).toEqual({ sx: 700, sy: 0, side: 900 });
  });

  it("zooms around the centre and selects a smaller square", () => {
    const z = zoomTo(W, H, V, initialCrop(W, H, V), 2);
    expect(cropRect(W, H, V, z)).toEqual({ sx: 575, sy: 225, side: 450 });
  });

  it("limits zoom to 1–4×", () => {
    expect(zoomTo(W, H, V, initialCrop(W, H, V), 10).zoom).toBe(4);
    expect(zoomTo(W, H, V, initialCrop(W, H, V), 0.2).zoom).toBe(1);
  });
});
