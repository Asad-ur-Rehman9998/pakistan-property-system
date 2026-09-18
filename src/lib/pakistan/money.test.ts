import { describe, expect, it } from "vitest";
import { croreLakhPhrase, formatIndian, formatPkr, parsePkr, rupeesGrouped } from "./money";

describe("parsePkr", () => {
  it("reads crore and lakh in English and Urdu", () => {
    expect(parsePkr("2.5 crore")).toBe(25_000_000);
    expect(parsePkr("80 lakh")).toBe(8_000_000);
    expect(parsePkr("1 crore 20 lakh")).toBe(12_000_000);
    expect(parsePkr("2.5 کروڑ")).toBe(25_000_000);
    expect(parsePkr("80 لاکھ")).toBe(8_000_000);
  });

  it("reads Pakistani grouped rupees and plain numbers", () => {
    expect(parsePkr("Rs. 2,50,00,000")).toBe(25_000_000);
    expect(parsePkr("2.5 Crore")).toBe(25_000_000);
    expect(parsePkr("25000000")).toBe(25_000_000);
    expect(parsePkr("PKR 400000")).toBe(400_000);
  });

  it("does not treat empty or zero as a price", () => {
    expect(parsePkr("")).toBeNull();
    expect(parsePkr("0")).toBeNull();
  });
});

describe("formatPkr", () => {
  it("speaks crore and lakh, not millions", () => {
    expect(formatPkr(25_000_000, "en")).toContain("crore");
    expect(formatPkr(25_000_000, "en")).not.toMatch(/million/i);
    expect(formatPkr(800_000, "roman")).toContain("lakh");
    expect(formatPkr(25_000_000, "ur")).toContain("کروڑ");
    expect(formatIndian(25_000_000)).toBe("2,50,00,000");
    expect(rupeesGrouped(25_000_000, "en")).toBe("Rs. 2,50,00,000");
    expect(croreLakhPhrase(25_000_000, "en")).toBe("2.5 Crore");
  });
});
