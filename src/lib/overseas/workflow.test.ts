import { describe, expect, it } from "vitest";
import { emptyAnswers } from "@/types/check";
import { evaluate } from "@/lib/engine/evaluate";
import { wizardPath, stepRequired } from "@/lib/engine/wizard";
import { OVERSEAS_POA_LIMIT, OVERSEAS_STAGE_IDS } from "./workflow";

describe("overseas Pakistani mode", () => {
  it("lists a future-ready path without inventing legal validity", () => {
    expect([...OVERSEAS_STAGE_IDS]).toEqual([
      "buyer_abroad",
      "property_location",
      "documents",
      "remote_verification",
      "professional_review",
      "report",
      "representative",
      "decision",
    ]);
    expect(OVERSEAS_POA_LIMIT.en.toLowerCase()).toContain("does not certify a power of attorney");
    expect(OVERSEAS_POA_LIMIT.en).toContain("Official verification required");
    expect(OVERSEAS_POA_LIMIT.roman).toContain("mukhtarnama ya shanakht ki tasdeeq nahi");
  });

  it("inserts overseas wizard steps only when the buyer is abroad", () => {
    const buy = { ...emptyAnswers(), intent: "buy" as const };
    expect(wizardPath(buy)).toContain("whereYouAre");
    expect(wizardPath(buy)).not.toContain("remoteVerify");
    const abroad = { ...buy, buyerLocation: "abroad" as const };
    const path = wizardPath(abroad);
    expect(path.indexOf("locateHow")).toBeLessThan(path.indexOf("hasDocs"));
    expect(path.indexOf("hasDocs")).toBeLessThan(path.indexOf("remoteVerify"));
    expect(path.indexOf("remoteVerify")).toBeLessThan(path.indexOf("overseasReview"));
    expect(path.indexOf("overseasReview")).toBeLessThan(path.indexOf("representative"));
    expect(path.indexOf("representative")).toBeLessThan(path.indexOf("notes"));
    expect(stepRequired("whereYouAre", buy)).toBe(false);
    expect(stepRequired("whereYouAre", abroad)).toBe(true);
  });

  it("never marks a named representative or mukhtarnama as verified", () => {
    const r = evaluate({
      ...emptyAnswers(),
      intent: "buy",
      buyerLocation: "abroad",
      representativeName: "Ali Khan",
      representativeRelation: "brother",
      representativePoa: "yes",
    });
    expect(r.hasOfficialVerification).toBe(false);
    expect(r.provenance.verified).toBe(0);
    const rep = [...r.known, ...r.verify, ...r.questions].find((f) => f.id === "overseas_representative");
    expect(rep).toBeTruthy();
    expect(rep?.source).not.toBe("verified");
    expect(JSON.stringify(rep).toLowerCase()).not.toMatch(/legally valid|qanooni mukhtarnama tasdeeq/);
    const poa = [...r.verify, ...r.missing].find((f) => f.id === "overseas_poa");
    expect(poa?.source).toBe("needs_verification");
    expect(poa?.why.en.toLowerCase()).toContain("not");
  });
});
