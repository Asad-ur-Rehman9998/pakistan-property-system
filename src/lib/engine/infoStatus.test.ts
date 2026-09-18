import { describe, expect, it } from "vitest";
import { emptyAnswers } from "@/types/check";
import { evaluate } from "./evaluate";
import { examples } from "./examples";
import { assessInfoStatus, coreAnsweredCount } from "./infoStatus";

function documented() {
  return {
    ...emptyAnswers(),
    intent: "buy" as const,
    settlement: "urban" as const,
    propertyKind: "house" as const,
    locationMethod: "search" as const,
    province: "punjab" as const,
    city: "Lahore",
    area: "Gulberg",
    plotNumber: "14",
    counterparty: "owner" as const,
    hasDocuments: "yes" as const,
    documents: {
      ownership: "have" as const,
      cnic_owner: "have" as const,
      mutation: "have" as const,
      society_noc: "have" as const,
      approved_plan: "have" as const,
      utility_bills: "have" as const,
      bayana_written: "have" as const,
    },
    flags: {
      seen_in_person: "yes" as const,
      occupied: "no" as const,
      pressure_today: "no" as const,
      name_match: "yes" as const,
      court_case: "no" as const,
      society_approved: "yes" as const,
      met_owner: "yes" as const,
    },
  };
}

describe("information and verification status", () => {
  it("is insufficient when too few core questions are answered", () => {
    expect(coreAnsweredCount(emptyAnswers())).toBe(0);
    const r = evaluate(emptyAnswers());
    expect(r.infoStatus.level).toBe("insufficient");
    expect(r.infoStatus.engine).toBe("rules");
    expect(r.infoStatus.label.en.toLowerCase()).toContain("insufficient");
    expect(r.infoStatus.reasons.length).toBeGreaterThan(0);
    expect(JSON.stringify(r.infoStatus).toLowerCase()).not.toMatch(/legally safe|safety score of/);
    expect(r.score).toBe(r.infoStatus.reasons.length);
  });

  it("is high attention when stop-level flags exist, and lists the rules", () => {
    const r = examples.token.report;
    expect(r.infoStatus.level).toBe("high");
    expect(r.infoStatus.emoji).toBe("🔴");
    expect(r.infoStatus.reasons.some((x) => x.en.toLowerCase().includes("stop-level"))).toBe(true);
    expect(r.infoStatus.reasons.some((x) => x.en.toLowerCase().includes("not a legal safety score"))).toBe(true);
    expect(r.infoStatus.engine).toBe("rules");
  });

  it("is needs verification when a non-critical paper is still unchecked, not fraud", () => {
    const r = evaluate({
      ...documented(),
      documents: { ...documented().documents, mutation: "unsure" },
    });
    expect(r.infoStatus.level).toBe("verify");
    expect(r.infoStatus.emoji).toBe("🟡");
    expect(JSON.stringify(r.infoStatus).toLowerCase()).not.toMatch(/fraud/);
  });

  it("is low attention only when rules find no stop or high-attention flags — still not verified", () => {
    const r = evaluate(documented());
    expect(["low", "verify"]).toContain(r.infoStatus.level);
    if (r.infoStatus.level === "low") {
      expect(r.infoStatus.emoji).toBe("🟢");
      expect(r.infoStatus.reasons.some((x) => x.en.toLowerCase().includes("not legally safe"))).toBe(true);
    }
    expect(r.hasOfficialVerification).toBe(false);
    expect(r.provenance.verified).toBe(0);
    expect(r.infoStatus.engine).toBe("rules");
  });

  it("never uses an unexplained 0–100 as the status", () => {
    for (const ex of Object.values(examples)) {
      expect(ex.report.infoStatus.level).toMatch(/^(low|verify|high|insufficient)$/);
      expect(ex.report.score).toBe(ex.report.infoStatus.reasons.length);
      expect(ex.report.score).toBeLessThan(20);
      expect(ex.report.infoStatus.engine).toBe("rules");
    }
  });

  it("keeps assessInfoStatus pure and listed", () => {
    const status = assessInfoStatus(
      emptyAnswers(),
      { known: [], missing: [], inconsistent: [], verify: [] },
      { seen: 0, missing: 0, unknown: 0, total: 0 },
      [],
    );
    expect(status.level).toBe("insufficient");
    expect(status.reasons[0]?.en).toContain("0 of 5");
  });
});
