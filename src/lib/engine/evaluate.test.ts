import { describe, expect, it } from "vitest";
import { evaluate } from "./evaluate";
import { emptyAnswers } from "@/types/check";
import { examples } from "./examples";
import { scanNotes } from "./scanNotes";

describe("evaluate", () => {
  it("stops a rushed token deal with no papers", () => {
    const r = examples.token.report;
    expect(r.verdict).toBe("stop");
    expect(r.inconsistent.some((f) => f.id === "pressure")).toBe(true);
    expect(r.missing.some((f) => f.id === "no_ownership_proof" || f.id.startsWith("miss_ownership"))).toBe(true);
  });

  it("flags incomplete rural warasat as stop", () => {
    const r = examples.rural.report;
    expect(r.verdict).toBe("stop");
    expect(r.inconsistent.some((f) => f.id === "heirs")).toBe(true);
    expect(r.inconsistent.some((f) => f.id === "occupied")).toBe(true);
    expect(r.questions.length).toBeGreaterThan(2);
  });

  it("asks an urban buyer to verify mutation and owner", () => {
    const r = examples.urban.report;
    expect(["wait", "stop", "careful"]).toContain(r.verdict);
    expect(r.verify.some((f) => f.id === "no_owner_contact" || f.id === "mutation_gap" || f.id === "name_unverified")).toBe(
      true,
    );
  });

  it("does not invent ownership when answers are empty", () => {
    const r = evaluate(emptyAnswers());
    expect(r.verdict).toBe("stop");
    expect(r.headline.en.toLowerCase()).toContain("token");
  });

  it("never labels a finding as verified without an official source", () => {
    for (const ex of Object.values(examples)) {
      const all = [
        ...ex.report.known,
        ...ex.report.missing,
        ...ex.report.inconsistent,
        ...ex.report.verify,
        ...ex.report.questions,
        ...(ex.report.lawyer ?? []),
        ...(ex.report.recordBeforeMoney ?? []),
        ...(ex.report.priceCheck ?? []),
        ...(ex.report.risks ?? []).map((r) => ({ source: r.source })),
      ];
      expect(all.every((f) => f.source !== "verified")).toBe(true);
      expect(ex.report.hasOfficialVerification).toBe(false);
      expect(ex.report.provenance.verified).toBe(0);
      expect(ex.report.officialIntegrations?.anyLive).toBe(false);
      expect(ex.report.officialIntegrations?.slots.every((s) => s.message === "Official verification required.")).toBe(
        true,
      );
    }
  });

  it("flags 10 Marla vs 8 Marla as a possible inconsistency that needs verification, not fraud", () => {
    const r = examples.papers.report;
    const area = r.inconsistent.find((f) => f.id.startsWith("consist_area:"));
    expect(area).toBeTruthy();
    expect(area?.severity).toBe("watch");
    expect(area?.source).toBe("needs_verification");
    expect(area?.title.en.toLowerCase()).toContain("possible inconsistency");
    expect(area?.why.en).toContain("10 Marla");
    expect(area?.why.en).toContain("8 Marla");
    expect(JSON.stringify(area).toLowerCase()).not.toMatch(/fraud/);
    expect(r.hasOfficialVerification).toBe(false);
    expect(r.provenance.verified).toBe(0);
    expect(r.risks.some((x) => x.lane === "document_inconsistency")).toBe(true);
  });

  it("treats seen papers as user-provided and note-scan risks as system-detected", () => {
    const urban = examples.urban.report;
    expect(urban.known.some((f) => f.source === "user_provided")).toBe(true);
    const token = examples.token.report;
    expect(token.inconsistent.find((f) => f.id === "pressure")?.source).toBe("system_detected");
  });
});

describe("scanNotes", () => {
  it("reads Roman Urdu pressure language", () => {
    const hits = scanNotes("Dealer keh raha hai aaj hi token do, sirf cash");
    expect(hits.map((h) => h.id)).toEqual(expect.arrayContaining(["token_pressure", "cash"]));
  });

  it("reads cheap-talk in Roman Urdu", () => {
    expect(scanNotes("bohat sasti, aaj hi token").map((h) => h.id)).toEqual(
      expect.arrayContaining(["cheap", "token_pressure"]),
    );
  });
});
