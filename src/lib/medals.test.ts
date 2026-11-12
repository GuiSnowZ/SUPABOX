import { describe, expect, it } from "vitest";
import { MEDAL_TIERS, medalProgress } from "./medals";

describe("medalProgress", () => {
  it("has nothing before the first milestone", () => {
    const p = medalProgress("reviews", 0);
    expect(p.earned).toBeNull();
    expect(p.next?.name).toBe("Brass");
    expect(p.progress).toBe(0);
  });
  it("earns a tier exactly at its threshold", () => {
    expect(medalProgress("completed", 10).earned?.name).toBe("Silver");
    expect(medalProgress("completed", 9).earned?.name).toBe("Bronze");
  });
  it("measures progress towards the next tier", () => {
    const p = medalProgress("reviews", 15); // Silver (10) → Gold (25)
    expect(p.earned?.name).toBe("Silver");
    expect(p.next?.name).toBe("Gold");
    expect(p.progress).toBeCloseTo(5 / 15);
  });
  it("tops out at the last tier", () => {
    const p = medalProgress("reviews", 5000);
    expect(p.earned?.level).toBe(MEDAL_TIERS.length);
    expect(p.next).toBeNull();
    expect(p.progress).toBe(1);
  });
  it("thresholds increase", () => {
    MEDAL_TIERS.slice(1).forEach((t, i) => expect(t.threshold).toBeGreaterThan(MEDAL_TIERS[i].threshold));
  });
});
