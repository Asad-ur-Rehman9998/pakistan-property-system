import { describe, expect, it } from "vitest";
import { emptyAnswers } from "@/types/check";
import { examples } from "@/lib/engine/examples";
import { makeSavedCheck } from "@/lib/engine/evaluate";
import { qrSvg } from "./qr";
import { buildShareableSheet, formatShareableWhatsApp } from "./sheet";

describe("shareable property report", () => {
  it("summarises the city plot without inventing a market range", () => {
    const sheet = buildShareableSheet(examples.urban);
    expect(sheet.property.en).toMatch(/10\s+Marla/i);
    expect(sheet.property.en).toMatch(/Plot/i);
    expect(sheet.location.en).toContain("DHA Phase 6");
    expect(sheet.location.en).toContain("Lahore");
    expect(sheet.asking.en.toLowerCase()).toContain("2.5");
    expect(sheet.asking.en.toLowerCase()).toContain("crore");
    expect(sheet.statusLabel.en.toLowerCase()).not.toMatch(/legally safe|verified listing/);
    expect(sheet.documents.some((d) => /missing/i.test(d.text.en) && d.mark === "warn")).toBe(true);
    expect(sheet.documents.some((d) => /uploaded/i.test(d.text.en) && d.mark === "ok")).toBe(true);
    const prices = sheet.priceLines.map((p) => p.en).join(" ");
    expect(prices.toLowerCase()).toContain("asking");
    expect(prices.toLowerCase()).toMatch(/not invented|insufficient/);
    expect(prices).not.toMatch(/Rs\.\s*X|market average|sold for/i);
  });

  it("flags area clarification on clashing papers, not fraud", () => {
    const sheet = buildShareableSheet(examples.papers);
    const consist = sheet.consistency.map((c) => `${c.mark} ${c.text.en}`).join(" ");
    expect(consist.toLowerCase()).toMatch(/area requires clarification/);
    expect(consist.toLowerCase()).toMatch(/not a finding of fraud/);
    expect(sheet.consistency.some((c) => c.mark === "warn")).toBe(true);
  });

  it("leaves a blank asking price blank instead of inventing one", () => {
    const check = makeSavedCheck("sheetprice01", {
      ...emptyAnswers(),
      intent: "buy",
      propertyKind: "house",
      city: "Lahore",
      area: "Gulberg",
      price: "",
    });
    const sheet = buildShareableSheet(check);
    expect(sheet.asking.en.toLowerCase()).toMatch(/not given|not invented/);
    expect(sheet.asking.en).not.toMatch(/\d/);
  });

  it("WhatsApp summary is a one-screen report and not a legal certificate", () => {
    const sheet = buildShareableSheet(examples.urban);
    const text = formatShareableWhatsApp(sheet, "en", "http://localhost:3000/r/ex-urban/sheet", { checkId: "ex-urban" });
    expect(text).toContain("DEMO DATA — NOT A REAL PROPERTY");
    expect(text).toContain("PropertyCheck report");
    expect(text).toContain("DHA Phase 6");
    expect(text.toLowerCase()).toContain("not a legal certificate");
    expect(text.toLowerCase()).toContain("independent verification");
    expect(text).toContain("does not constitute legal advice");
    expect(text).toContain("Official verification required.");
    expect(text).toContain("title certification");
    expect(text).toContain("ownership certification");
    expect(text).toContain("/r/ex-urban/sheet");
    expect(text.toLowerCase()).not.toContain("this is a verified listing");
    expect(text).not.toMatch(/sold for|confirmed sale price/i);
    const roman = formatShareableWhatsApp(sheet, "roman", "http://localhost:3000/r/ex-urban/sheet", { checkId: "ex-urban" });
    expect(roman).toContain("DEMO DATA — NOT A REAL PROPERTY");
    expect(roman.toLowerCase()).toContain("qanooni certificate nahi");
    expect(roman).toContain("qanooni mashwara");
    expect(roman).toContain("title certification");
  });

  it("encodes the report URL as a local QR SVG", () => {
    const svg = qrSvg("http://localhost:3000/r/ex-urban/sheet");
    expect(svg).toContain("<svg");
    expect(svg).toContain("viewBox");
    expect(svg.length).toBeGreaterThan(200);
  });
});
