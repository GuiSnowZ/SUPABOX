import { describe, expect, it } from "vitest";
import { profileSearchTerm } from "./use-profile-search";

describe("profile search term", () => {
  it("keeps names and usernames", () => {
    expect(profileSearchTerm("  Gui ")).toBe("Gui");
    expect(profileSearchTerm("@guisnowz")).toBe("guisnowz");
    expect(profileSearchTerm("João Silva")).toBe("João Silva");
  });
  it("escapes the LIKE wildcard _", () => {
    expect(profileSearchTerm("qa_c")).toBe("qa\\_c");
  });
  it("drops characters that could change the query", () => {
    expect(profileSearchTerm("a,username.eq.x)")).toBe("ausernameeqx");
    expect(profileSearchTerm("%*()")).toBe("");
  });
});
