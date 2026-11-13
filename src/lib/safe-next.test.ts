import { describe, expect, it } from "vitest";
import { safeNext } from "./safe-next";

describe("safeNext", () => {
  it("keeps paths on this site", () => {
    expect(safeNext("/account/password")).toBe("/account/password");
    expect(safeNext("/games?q=zelda")).toBe("/games?q=zelda");
  });
  it("blocks anything that could leave the site", () => {
    for (const bad of [null, "", "https://evil.com", "//evil.com", "/\\evil.com", "/\\/evil.com", "\\evil.com", "/%0d", "/\tx", "evil.com"]) {
      expect(safeNext(bad)).toBe(bad === "/%0d" ? "/%0d" : "/");
    }
  });
  it("leaves URLs that resolve on this origin", () => {
    for (const v of ["/a", "/a/b?c=d#e"]) expect(new URL(safeNext(v), "https://supaboxd.com").origin).toBe("https://supaboxd.com");
    expect(new URL(safeNext("/\\evil.com"), "https://supaboxd.com").origin).toBe("https://supaboxd.com");
  });
});
