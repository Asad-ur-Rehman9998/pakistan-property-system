import { describe, expect, it } from "vitest";
import { emptyAnswers } from "@/types/check";
import { evaluate } from "./evaluate";
import { examples } from "./examples";
import { assessPriceIntel, isPriceUnavailable } from "./priceIntel";
import { formatPkr } from "@/lib/pakistan/money";

const INSUFFICIENT_EN = "Insufficient reliable data for a meaningful estimate.";

describe("price intelligence", () => {
  it("divides 2.5 crore by 10 marla into asking per-marla and per-kanal, never sq ft", () => {
    const intel = assessPriceIntel({
      ...emptyAnswers(),
      price: "2.5 crore",
      areaSize: "10",
      areaUnit: "marla",
    });
    expect(intel.asking?.pkr).toBe(25_000_000);
    expect(intel.asking?.kind).toBe("asking");
    expect(intel.asking?.source).toBe("user_provided");
    expect(isPriceUnavailable(intel.perMarla)).toBe(false);
    expect(isPriceUnavailable(intel.perKanal)).toBe(false);
    if (isPriceUnavailable(intel.perMarla) || isPriceUnavailable(intel.perKanal)) throw new Error("expected rates");
    expect(intel.perMarla.pkr).toBe(2_500_000);
    expect(intel.perMarla.kind).toBe("asking");
    expect(intel.perMarla.source).toBe("user_provided");
    expect(intel.perKanal.pkr).toBe(50_000_000);
    expect(intel.perKanal.kind).toBe("asking");
    expect(isPriceUnavailable(intel.perSqft)).toBe(true);
    if (!isPriceUnavailable(intel.perSqft)) throw new Error("marla must not invent sq ft");
    expect(intel.perSqft.message.en).toBe(INSUFFICIENT_EN);
  });

  it("uses the rushed-token example: 1.5 crore / 5 marla = 30 lakh asking per marla", () => {
    const intel = examples.token.report.priceIntel;
    expect(intel).toBeTruthy();
    expect(intel?.asking?.pkr).toBe(15_000_000);
    if (!intel || isPriceUnavailable(intel.perMarla) || isPriceUnavailable(intel.perKanal)) {
      throw new Error("token example should have asking unit rates");
    }
    expect(intel.perMarla.pkr).toBe(3_000_000);
    expect(formatPkr(intel.perMarla.pkr, "en")).toContain("30 lakh");
    expect(intel.perKanal.pkr).toBe(60_000_000);
    expect(intel.perMarla.kind).toBe("asking");
    expect(isPriceUnavailable(intel.perSqft)).toBe(true);
  });

  it("leaves asking empty and all rates unavailable when no price is typed", () => {
    const intel = assessPriceIntel({
      ...emptyAnswers(),
      areaSize: "10",
      areaUnit: "marla",
    });
    expect(intel.asking).toBeNull();
    expect(isPriceUnavailable(intel.perMarla)).toBe(true);
    expect(isPriceUnavailable(intel.perKanal)).toBe(true);
    expect(isPriceUnavailable(intel.perSqft)).toBe(true);
    expect(intel.transaction.message.en).toBe(INSUFFICIENT_EN);
    expect(intel.transaction.available).toBe(false);
  });

  it("keeps asking but does not invent unit rates when size is missing", () => {
    const intel = assessPriceIntel({ ...emptyAnswers(), price: "2.5 crore" });
    expect(intel.asking?.pkr).toBe(25_000_000);
    expect(isPriceUnavailable(intel.perMarla)).toBe(true);
    expect(isPriceUnavailable(intel.perKanal)).toBe(true);
    expect(isPriceUnavailable(intel.perSqft)).toBe(true);
  });

  it("computes per sq ft only when the user already used sq ft or gaz", () => {
    const sqft = assessPriceIntel({
      ...emptyAnswers(),
      price: "1.35 crore",
      areaSize: "1350",
      areaUnit: "sqft",
    });
    expect(isPriceUnavailable(sqft.perMarla)).toBe(true);
    expect(isPriceUnavailable(sqft.perKanal)).toBe(true);
    if (isPriceUnavailable(sqft.perSqft)) throw new Error("sqft should yield a rate");
    expect(sqft.perSqft.pkr).toBe(10_000);
    expect(sqft.perSqft.kind).toBe("asking");

    const gaz = assessPriceIntel({
      ...emptyAnswers(),
      price: "1.8 crore",
      areaSize: "200",
      areaUnit: "sqyd",
    });
    if (isPriceUnavailable(gaz.perSqft)) throw new Error("gaz should convert to sq ft");
    expect(gaz.perSqft.pkr).toBe(10_000);
    expect(isPriceUnavailable(gaz.perMarla)).toBe(true);
  });

  it("never invents comparables, history, rent, range, or a transaction price", () => {
    const intel = evaluate({
      ...emptyAnswers(),
      intent: "rent",
      price: "80,000",
      areaSize: "10",
      areaUnit: "marla",
    }).priceIntel;
    expect(intel).toBeTruthy();
    expect(intel?.asking?.kind).toBe("asking");
    expect(intel?.transaction.available).toBe(false);
    expect(intel?.comparables.available).toBe(false);
    expect(intel?.historicalAsking.available).toBe(false);
    expect(intel?.rentalEstimate.available).toBe(false);
    expect(intel?.priceRange.available).toBe(false);
    expect(intel?.comparables.message.en).toBe(INSUFFICIENT_EN);
    expect(intel?.rentalEstimate.message.en).toBe(INSUFFICIENT_EN);
    const blob = JSON.stringify(intel).toLowerCase();
    expect(blob).not.toMatch(/"kind":"transaction"/);
    expect(blob).not.toMatch(/sold for/);
    expect(blob).not.toMatch(/confirmed sale price of/);
    expect(intel?.disclaimer.en.toLowerCase()).toContain("not a confirmed sale");
  });

  it("keeps urban example rates as user-provided asking, not a sale tape", () => {
    const intel = examples.urban.report.priceIntel;
    expect(intel?.asking?.pkr).toBe(25_000_000);
    if (!intel || isPriceUnavailable(intel.perMarla)) throw new Error("urban rates");
    expect(intel.perMarla.pkr).toBe(2_500_000);
    expect(intel.perMarla.source).toBe("user_provided");
    expect(examples.urban.report.priceCheck[0]?.id).toBe("price_no_market_tape");
  });
});
