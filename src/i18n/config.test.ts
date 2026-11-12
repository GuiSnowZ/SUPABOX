import { describe, expect, it } from "vitest";
import { isLocale, localeFromAcceptLanguage } from "./config";

describe("localeFromAcceptLanguage", () => {
  it("picks Portuguese for any pt variant", () => {
    expect(localeFromAcceptLanguage("pt-BR,pt;q=0.9,en;q=0.8")).toBe("pt-BR");
    expect(localeFromAcceptLanguage("pt-PT")).toBe("pt-BR");
  });
  it("respects quality order", () => {
    expect(localeFromAcceptLanguage("en;q=0.5,pt;q=0.9")).toBe("pt-BR");
    expect(localeFromAcceptLanguage("fr,en;q=0.8,pt;q=0.2")).toBe("en");
  });
  it("defaults to English", () => {
    expect(localeFromAcceptLanguage(null)).toBe("en");
    expect(localeFromAcceptLanguage("de,fr")).toBe("en");
  });
  it("validates locales", () => {
    expect(isLocale("pt-BR")).toBe(true);
    expect(isLocale("es")).toBe(false);
  });
});
