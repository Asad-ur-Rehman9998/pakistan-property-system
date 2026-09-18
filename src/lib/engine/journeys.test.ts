import { describe, expect, it } from "vitest";
import { emptyAnswers, type CheckAnswers } from "@/types/check";
import { documentsFor } from "./documents";
import { evaluate } from "./evaluate";
import { examples } from "./examples";
import { scanNotes } from "./scanNotes";

function base(partial: Partial<CheckAnswers>): CheckAnswers {
  return {
    ...emptyAnswers(),
    intent: "buy",
    settlement: "urban",
    propertyKind: "house",
    province: "punjab",
    city: "Lahore",
    area: "Gulberg",
    plotNumber: "14",
    areaSize: "10",
    areaUnit: "marla",
    counterparty: "owner",
    documents: {
      ownership: "have",
      cnic_owner: "have",
      mutation: "have",
      society_noc: "have",
      approved_plan: "have",
      utility_bills: "have",
      bayana_written: "have",
    },
    flags: {
      seen_in_person: "yes",
      occupied: "no",
      pressure_today: "no",
      name_match: "yes",
      court_case: "no",
      society_approved: "yes",
    },
    price: "20000000",
    tokenAmount: "400000",
    notes: "",
    ...partial,
  };
}

describe("user journeys", () => {
  it("lets a well-documented urban owner deal continue with official verify, not a fake green light", () => {
    const r = evaluate(base({}));
    expect(r.verdict).toBe("careful");
    expect(r.headline.en.toLowerCase()).toContain("verification");
    expect(r.hasOfficialVerification).toBe(false);
    expect(r.provenance.verified).toBe(0);
    expect(r.known.every((f) => f.source === "user_provided")).toBe(true);
    expect(r.headline.en.toLowerCase()).not.toMatch(/legally safe|officially verified property/);
    expect(r.known.length).toBeGreaterThan(4);
    expect(r.questions.length).toBeGreaterThan(2);
    expect(r.nextOffices.length).toBeGreaterThan(0);
    expect(r.headline.ur.length).toBeGreaterThan(4);
    expect(r.headline.roman.length).toBeGreaterThan(4);
    expect(r.risks).toBeDefined();
    expect(r.risks.every((x) => x.source !== "verified")).toBe(true);
    expect(r.infoStatus.engine).toBe("rules");
    expect(["low", "verify"]).toContain(r.infoStatus.level);
    expect(r.infoStatus.label.en.toLowerCase()).not.toMatch(/safe|safety score/);
  });

  it("stops when seller name does not match papers", () => {
    const r = evaluate(base({ flags: { ...base({}).flags, name_match: "no" } }));
    expect(r.verdict).toBe("stop");
    expect(r.inconsistent.some((f) => f.id === "name_mismatch")).toBe(true);
    const seller = r.risks.find((x) => x.lane === "seller_mismatch");
    expect(seller?.attention).toBe("high");
    expect(seller?.title.en).toContain("could not be reconciled");
    expect(JSON.stringify(seller).toLowerCase()).not.toMatch(/fraud/);
  });

  it("stops unapproved societies", () => {
    const r = evaluate(base({ flags: { ...base({}).flags, society_approved: "no" } }));
    expect(r.verdict).toBe("stop");
    expect(r.inconsistent.some((f) => f.id === "unapproved")).toBe(true);
  });

  it("stops unknown counterparties asking for token", () => {
    const r = evaluate(base({ intent: "token", counterparty: "unknown" }));
    expect(r.verdict).toBe("stop");
    expect(r.inconsistent.some((f) => f.id === "unknown_party")).toBe(true);
  });

  it("reads crore and lakh the way Pakistani deals are spoken", () => {
    const r = evaluate(base({ price: "2 crore", tokenAmount: "40 lakh" }));
    expect(r.inconsistent.some((f) => f.id === "high_token")).toBe(true);
  });

  it("requires rent ownership proof", () => {
    const r = evaluate(
      base({
        intent: "rent",
        documents: { owner_proof: "missing", cnic_owner: "missing", utility_bills: "unsure" },
      }),
    );
    expect(r.verdict).toBe("stop");
    expect(r.missing.some((f) => f.id === "no_ownership_proof" || f.id.startsWith("miss_owner"))).toBe(true);
  });

  it("treats a paper file with no land as a stop", () => {
    const r = evaluate(
      base({
        propertyKind: "file",
        documents: {
          original_file: "have",
          payment_receipts: "have",
          transfer_rules: "have",
          cnic_owner: "have",
          bayana_written: "have",
        },
        flags: { ...base({}).flags, land_exists: "no" },
      }),
    );
    expect(r.verdict).toBe("stop");
    expect(r.inconsistent.some((f) => f.id === "paper_file")).toBe(true);
  });

  it("asks rural buyers about khasra on the field", () => {
    const r = evaluate(
      base({
        settlement: "rural",
        propertyKind: "agri",
        documents: {
          fard: "have",
          khasra: "have",
          aks_shajra: "have",
          mutation: "have",
          cnic_owner: "have",
          registry: "have",
          bayana_written: "have",
          warasat: "have",
        },
        flags: { ...base({}).flags, all_heirs: "yes" },
      }),
    );
    expect(r.questions.some((f) => f.id === "q_khasra")).toBe(true);
  });

  it("covers lawyer, informal WhatsApp lead, record-before-token, and no fake market price", () => {
    const r = examples.token.report;
    expect(r.lawyer.some((f) => f.id === "lawyer_needed")).toBe(true);
    expect(r.lawyer.some((f) => f.id === "informal_channel")).toBe(true);
    expect(r.recordBeforeMoney.length).toBeGreaterThan(4);
    expect(r.priceCheck.every((f) => f.source !== "verified")).toBe(true);
    expect(r.priceCheck[0]?.id).toBe("price_no_market_tape");
    expect(r.priceIntel?.asking?.kind).toBe("asking");
    expect(r.priceIntel?.transaction.available).toBe(false);
    expect(r.priceIntel?.comparables.available).toBe(false);
    expect(r.priceIntel?.comparables.message.en).toBe("Insufficient reliable data for a meaningful estimate.");
    expect(r.completeness.total).toBeGreaterThan(3);
    expect(r.completeness.missing + r.completeness.unknown).toBeGreaterThan(0);
    expect(r.tokenChecklist?.items).toHaveLength(12);
    expect(r.tokenChecklist?.counts.missing).toBeGreaterThan(3);
  });

  it("flags the city plot example as a possible duplicate of three dealer listings, not fraud", () => {
    const r = examples.urban.report;
    expect(r.duplicates?.matches).toHaveLength(3);
    expect(r.duplicates?.disclaimer.en.toLowerCase()).toContain("not a finding of fraud");
    expect(r.duplicates?.matches.every((m) => m.source === "system_detected")).toBe(true);
    expect(r.hasOfficialVerification).toBe(false);
  });

  it("treats a friend/family intro as trust, not as papers", () => {
    const r = examples.rural.report;
    expect(r.lawyer.some((f) => f.id === "known_person_channel")).toBe(true);
    expect(r.questions.length).toBeGreaterThan(2);
  });
});

describe("documents and notes", () => {
  it("shows rural papers for agri land", () => {
    const ids = documentsFor({ settlement: "rural", propertyKind: "agri" }).map((d) => d.id);
    expect(ids).toEqual(expect.arrayContaining(["fard", "khasra", "aks_shajra", "warasat"]));
  });

  it("shows industrial papers like other built commercial property", () => {
    const ids = documentsFor({ settlement: "urban", propertyKind: "industrial", intent: "buy" }).map((d) => d.id);
    expect(ids).toEqual(expect.arrayContaining(["ownership", "approved_plan", "society_noc"]));
  });

  it("picks court, qabza, and overseas from mixed-language notes", () => {
    const hits = scanNotes("Stay order hai, kirayedar qabza, owner UK mein hai, already sold kisi aur ko");
    expect(hits.map((h) => h.id)).toEqual(
      expect.arrayContaining(["court", "qabza", "overseas", "double"]),
    );
  });
});
