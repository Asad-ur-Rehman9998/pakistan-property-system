import { describe, expect, it } from "vitest";
import { emptyAnswers, type PaperRead } from "@/types/check";
import { evaluate } from "./evaluate";
import { assessRisk, RISK_LANES } from "./risk";
import { comparePapers } from "@/lib/docai/compare";
import { scanNotes } from "./scanNotes";

function read(partial: Partial<PaperRead> & { photoKey: string }): PaperRead {
  return {
    kind: "unknown",
    kindConfidence: 0.5,
    fields: [],
    ocrStatus: "done",
    encrypted: true,
    createdAt: "2026-08-27T00:00:00.000Z",
    ...partial,
  };
}

function riskOf(answers: ReturnType<typeof emptyAnswers> & Record<string, unknown>) {
  const a = { ...emptyAnswers(), ...answers };
  return assessRisk(a, { paperHits: comparePapers(a), noteHits: scanNotes(a.notes) });
}

describe("rule-based risk engine", () => {
  it("keeps the pipeline in a fixed order and never uses a model", () => {
    expect(RISK_LANES.map((l) => l.id)).toEqual([
      "missing_info",
      "document_inconsistency",
      "location_inconsistency",
      "seller_mismatch",
      "unusual_pricing",
      "suspicious_listing",
      "unverified_claims",
      "risk_indicators",
    ]);
  });

  it("flags owner typed vs paper as high attention, not fraud", () => {
    const answers = {
      ...emptyAnswers(),
      intent: "buy" as const,
      ownerNameOnPaper: "Ahmed Ali Khan",
      paperReads: [
        read({
          photoKey: "a",
          kind: "fard",
          fields: [{ key: "ownerName", value: "Usman Raza", sensitive: false, confirmed: true }],
        }),
      ],
    };
    const hits = riskOf(answers);
    const seller = hits.find((r) => r.id === "risk_seller_mismatch");
    expect(seller?.lane).toBe("seller_mismatch");
    expect(seller?.attention).toBe("high");
    expect(seller?.title.en).toBe("Owner information could not be reconciled");
    expect(seller?.why.en).toContain("does not match the information extracted from the uploaded document");
    expect(seller?.evidence.en).toContain("Ahmed Ali Khan");
    expect(seller?.evidence.en).toContain("Usman Raza");
    expect(seller?.doNow.en).toContain("authoritative verification before paying token money");
    expect(JSON.stringify(seller).toLowerCase()).not.toMatch(/fraud/);
    const report = evaluate(answers);
    expect(report.risks.some((r) => r.id === "risk_seller_mismatch")).toBe(true);
    expect(report.hasOfficialVerification).toBe(false);
    const idx = report.risks.findIndex((r) => r.lane === "seller_mismatch");
    const firstDoc = report.risks.findIndex((r) => r.lane === "document_inconsistency");
    if (firstDoc >= 0 && idx >= 0) expect(firstDoc).toBeLessThan(idx);
  });

  it("puts 10 Marla vs 8 Marla in document inconsistency", () => {
    const answers = {
      ...emptyAnswers(),
      paperReads: [
        read({
          photoKey: "a",
          kind: "allotment",
          fields: [{ key: "areaSize", value: "10 Marla", sensitive: false, confirmed: true }],
        }),
        read({
          photoKey: "b",
          kind: "registry",
          fields: [{ key: "areaSize", value: "8 Marla", sensitive: false, confirmed: true }],
        }),
      ],
    };
    const hits = riskOf(answers);
    expect(hits.some((r) => r.lane === "document_inconsistency" && r.why.en.includes("10 Marla"))).toBe(true);
    expect(hits.every((r) => r.source !== "verified")).toBe(true);
  });

  it("flags society location that does not match a paper", () => {
    const hits = riskOf({
      ...emptyAnswers(),
      societyName: "Bahria Town",
      paperReads: [
        read({
          photoKey: "a",
          kind: "allotment",
          fields: [{ key: "societyName", value: "DHA Phase 6", sensitive: false, confirmed: true }],
        }),
      ],
    });
    const loc = hits.find((r) => r.id === "risk_location_society");
    expect(loc?.lane).toBe("location_inconsistency");
    expect(loc?.evidence.en).toContain("Bahria Town");
    expect(loc?.evidence.en).toContain("DHA Phase 6");
  });

  it("flags a large token as unusual pricing without a market feed", () => {
    const hits = riskOf({
      ...emptyAnswers(),
      intent: "buy",
      price: "2 crore",
      tokenAmount: "40 lakh",
    });
    expect(hits.some((r) => r.id === "risk_price_token" && r.lane === "unusual_pricing")).toBe(true);
  });

  it("treats a WhatsApp lead with no papers as a listing that needs verification", () => {
    const hits = riskOf({
      ...emptyAnswers(),
      foundVia: "whatsapp",
      hasDocuments: "no",
    });
    expect(hits.some((r) => r.lane === "suspicious_listing")).toBe(true);
  });
});
