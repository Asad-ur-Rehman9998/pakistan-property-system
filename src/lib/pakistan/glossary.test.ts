import { describe, expect, it } from "vitest";
import { glossary } from "./glossary";

describe("glossary", () => {
  it("explains every term in simple Urdu and Roman Urdu", () => {
    expect(glossary.some((g) => g.id === "marla")).toBe(true);
    expect(glossary.some((g) => g.id === "crore")).toBe(true);
    expect(glossary.some((g) => g.id === "khasra")).toBe(true);
    expect(glossary.some((g) => g.id === "mouza")).toBe(true);
    for (const g of glossary) {
      expect(g.plain.ur.length, g.id).toBeGreaterThan(8);
      expect(g.plain.roman.length, g.id).toBeGreaterThan(8);
      expect(g.plain.en.toLowerCase()).not.toMatch(/\bmillion\b/);
    }
  });
});
