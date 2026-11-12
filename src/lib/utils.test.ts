import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("lets a caller's width override a component default", () => {
    // GameCover defaults to w-full; small covers in search results pass w-8.
    expect(cn("aspect-[3/4] w-full", "w-8 shrink-0")).toBe("aspect-[3/4] w-8 shrink-0");
  });

  it("keeps theme colours next to font sizes", () => {
    expect(cn("text-sm text-muted", false, null)).toBe("text-sm text-muted");
  });
});
