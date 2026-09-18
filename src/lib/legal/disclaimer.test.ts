import { describe, expect, it } from "vitest";
import { LEGAL_DISCLAIMER, LEGAL_DISCLAIMER_DRAFT } from "./disclaimer";

describe("trust and legal disclaimer", () => {
  it("states the required English scope and limits on every language", () => {
    expect(LEGAL_DISCLAIMER.en).toContain("information organization");
    expect(LEGAL_DISCLAIMER.en).toContain("document analysis");
    expect(LEGAL_DISCLAIMER.en).toContain("consistency checks");
    expect(LEGAL_DISCLAIMER.en).toContain("decision-support");
    expect(LEGAL_DISCLAIMER.en).toContain("does not constitute legal advice");
    expect(LEGAL_DISCLAIMER.en).toContain("title certification");
    expect(LEGAL_DISCLAIMER.en).toContain("ownership certification");
    expect(LEGAL_DISCLAIMER.en).toMatch(/not.*guarantee that a transaction is safe/i);
    expect(LEGAL_DISCLAIMER.en).toContain("authoritative verification");
    expect(LEGAL_DISCLAIMER.en).toContain("qualified professional advice");
    expect(LEGAL_DISCLAIMER.en.toLowerCase()).not.toMatch(/legally safe|this property is verified/);

    expect(LEGAL_DISCLAIMER.roman).toContain("qanooni mashwara");
    expect(LEGAL_DISCLAIMER.roman).toContain("title certification");
    expect(LEGAL_DISCLAIMER.roman).toContain("ownership certification");
    expect(LEGAL_DISCLAIMER.roman).toContain("guarantee nahi");
    expect(LEGAL_DISCLAIMER.ur).toContain("قانونی مشورہ");
    expect(LEGAL_DISCLAIMER.ur).toContain("ٹائٹل سرٹیفیکیشن");
  });

  it("notes that a Pakistani legal professional may refine the wording", () => {
    expect(LEGAL_DISCLAIMER_DRAFT.en).toMatch(/qualified Pakistani legal professional/i);
    expect(LEGAL_DISCLAIMER_DRAFT.roman).toContain("ehl Pakistani qanooni pesha war");
  });
});
