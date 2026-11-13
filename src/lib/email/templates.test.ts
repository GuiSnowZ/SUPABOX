import { describe, expect, it } from "vitest";
import { escapeHtml, verificationEmail } from "./templates";

describe("verification email", () => {
  it("is in Portuguese by default and English on request", () => {
    expect(verificationEmail({ link: "https://supaboxd.com/auth/verify?token=abc", name: "Gui", locale: "pt-BR" }).subject).toContain("Confirme");
    expect(verificationEmail({ link: "https://supaboxd.com/auth/verify?token=abc", name: "Gui", locale: "en" }).subject).toContain("Confirm your email");
  });
  it("includes the link twice (button and fallback)", () => {
    const { html } = verificationEmail({ link: "https://supaboxd.com/auth/verify?token=abc", name: "", locale: "pt-BR" });
    expect(html.match(/auth\/verify\?token=abc/g)).toHaveLength(3);
  });
  it("escapes the display name so it can't inject HTML", () => {
    const { html } = verificationEmail({ link: "https://x/y", name: '<img src=x onerror="alert(1)">', locale: "pt-BR" });
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img");
    expect(escapeHtml(`"&'`)).toBe("&quot;&amp;&#39;");
  });
});
