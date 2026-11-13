import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * The daily GitHub job runs scripts/*.mts with plain Node, outside Next.js.
 * Files they import must not use Next-only imports like "server-only"
 * (that broke the catalog sync once).
 */
const USED_BY_SCRIPTS = ["src/lib/igdb/client.ts", "src/lib/igdb/map.ts", "src/lib/official-lists/ranking.ts"];

describe("files shared with the sync scripts", () => {
  for (const file of USED_BY_SCRIPTS) {
    it(`${file} has no Next-only imports`, () => {
      const src = readFileSync(file, "utf8");
      expect(src).not.toMatch(/from "next\/|import "server-only"|from "@\//);
    });
  }
});
