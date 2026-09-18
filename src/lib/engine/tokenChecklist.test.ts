import { describe, expect, it } from "vitest";
import { emptyAnswers } from "@/types/check";
import { TOKEN_CHECKLIST_IDS } from "@/types/check";
import { evaluate } from "./evaluate";
import { examples } from "./examples";
import { TOKEN_CHECKLIST, tokenChecklistReport } from "./tokenChecklist";
import { wizardPath, stepRequired } from "./wizard";

describe("before you pay token checklist", () => {
  it("defines the twelve due-diligence points", () => {
    expect(TOKEN_CHECKLIST.map((d) => d.id)).toEqual([...TOKEN_CHECKLIST_IDS]);
    expect(TOKEN_CHECKLIST).toHaveLength(12);
  });

  it("inserts the twelve points only in token mode", () => {
    const token = wizardPath({ ...emptyAnswers(), intent: "token" });
    const rent = wizardPath({ ...emptyAnswers(), intent: "rent" });
    expect(token).toContain("tokenIntro");
    for (const id of TOKEN_CHECKLIST_IDS) {
      expect(token).toContain(`dd:${id}`);
      expect(rent).not.toContain(`dd:${id}`);
    }
    expect(rent).not.toContain("tokenIntro");
  });

  it("requires a mark before continue", () => {
    expect(stepRequired("dd:seller_identity", emptyAnswers())).toBe(false);
    expect(
      stepRequired("dd:seller_identity", {
        ...emptyAnswers(),
        tokenChecklist: { seller_identity: "confirmed" },
      }),
    ).toBe(true);
  });

  it("turns missing seller identity into a stop finding, never fraud or verified", () => {
    const r = evaluate({
      ...emptyAnswers(),
      intent: "token",
      tokenChecklist: { seller_identity: "missing", taxes_dues: "na" },
    });
    const seller = r.missing.find((f) => f.id === "dd_seller_identity");
    expect(seller?.severity).toBe("stop");
    expect(seller?.source).not.toBe("verified");
    expect(JSON.stringify(seller).toLowerCase()).not.toMatch(/fraud/);
    expect(r.tokenChecklist?.items).toHaveLength(12);
    expect(r.tokenChecklist?.counts.na).toBe(1);
    expect(r.tokenChecklist?.counts.missing).toBe(1);
    expect(r.hasOfficialVerification).toBe(false);
    expect(r.provenance.verified).toBe(0);
  });

  it("treats confirmed as user-provided, not official verification", () => {
    const r = evaluate({
      ...emptyAnswers(),
      intent: "token",
      tokenChecklist: { seller_identity: "confirmed" },
    });
    const seller = r.known.find((f) => f.id === "dd_seller_identity");
    expect(seller?.source).toBe("user_provided");
    expect(seller?.title.en.toLowerCase()).toContain("user-provided");
    expect(r.risks.some((x) => x.id === "risk_dd_seller_identity")).toBe(false);
  });

  it("puts the rushed token example on the generated checklist", () => {
    const sheet = examples.token.report.tokenChecklist;
    expect(sheet).toBeTruthy();
    expect(sheet?.items).toHaveLength(12);
    expect(sheet?.counts.missing).toBeGreaterThan(3);
    expect(sheet?.counts.na).toBe(1);
    expect(examples.token.report.missing.some((f) => f.id === "dd_sale_agreement")).toBe(true);
    expect(examples.token.report.risks.some((x) => x.id === "risk_dd_legal_review" && x.attention === "high")).toBe(
      true,
    );
  });

  it("does not attach a checklist sheet to buy or rent reports", () => {
    expect(tokenChecklistReport({ ...emptyAnswers(), intent: "buy" })).toBeNull();
    expect(examples.urban.report.tokenChecklist).toBeNull();
  });
});
