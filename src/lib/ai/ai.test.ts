import { describe, expect, it } from "vitest";
import { emptyAnswers } from "@/types/check";
import { AI_STAGES } from "@/types/check";
import { evaluate } from "@/lib/engine/evaluate";
import { examples } from "@/lib/engine/examples";
import { runFromOcrText } from "./pipeline";
import { INSUFFICIENT } from "./types";
import { answerFromEvidence, collectPack, explainReport } from "./explain";
import { explanationFromLlm, inventsEvidence, isGroundedSentence } from "./ground";
import { llmExplainConfigured } from "./llm";

describe("AI pipeline", () => {
  it("runs OCR → parser → structured → validation → risk → explain without an LLM", () => {
    const out = runFromOcrText(
      "PUNJAB LAND RECORD FARD JAMABANDI owner Ahmed Ali plot 412 10 Marla DHA Phase 6",
      { city: "Lahore", area: "DHA Phase 6", plotNumber: "412", intent: "buy" },
    );
    expect(out.stages).toEqual([...AI_STAGES]);
    expect(out.llmRequired).toBe(false);
    expect(out.parser.kind).toBe("fard");
    expect(out.fields.some((f) => f.key === "plotNumber" || f.key === "ownerName" || f.key === "areaSize")).toBe(true);
    expect(out.report.aiExplanation?.llmUsed).toBe(false);
    expect(out.report.aiExplanation?.llmRequired).toBe(false);
    expect(out.report.hasOfficialVerification).toBe(false);
  });

  it("does not make evaluate wait on a language model", () => {
    expect(llmExplainConfigured()).toBe(false);
    const r = evaluate(emptyAnswers());
    expect(r.aiExplanation?.engine).toBe("rules");
    expect(r.aiExplanation?.llmUsed).toBe(false);
    expect(r.aiExplanation?.undetermined.some((u) => u.text.en === INSUFFICIENT.en)).toBe(true);
  });

  it("answers missing legal or fraud questions with the insufficient phrase", () => {
    const pack = collectPack(examples.urban.answers, examples.urban.report);
    expect(answerFromEvidence("Is this legally verified?", pack)).toBe(INSUFFICIENT.en);
    expect(answerFromEvidence("Is this fraud?", pack)).toBe(INSUFFICIENT.en);
    expect(answerFromEvidence("What is the market average?", pack)).toBe(INSUFFICIENT.en);
  });

  it("drops LLM text that invents evidence", () => {
    const report = examples.urban.report;
    const local = explainReport(examples.urban.answers, report);
    const pack = collectPack(examples.urban.answers, report);
    expect(inventsEvidence("This plot is legally verified and a fraud.")).toBe(true);
    const next = explanationFromLlm(
      "Plot 999999 is legally verified. Sold for a market average. This is fraud.",
      local,
      pack,
    );
    expect(next.llmUsed).toBe(false);
    expect(next.engine).toBe("rules");
  });

  it("keeps a restatement that only uses pack tokens", () => {
    const report = examples.urban.report;
    const local = explainReport(examples.urban.answers, report);
    const pack = collectPack(examples.urban.answers, report);
    const sample = local.claims[0]?.text.en || report.headline.en;
    expect(isGroundedSentence(sample, pack)).toBe(true);
    const next = explanationFromLlm(sample, local, pack);
    expect(next.claims.length).toBeGreaterThan(0);
    expect(next.claims.every((c) => c.evidence.length > 0 || local.undetermined.includes(c))).toBe(true);
  });

  it("labels every claim with an evidence kind", () => {
    const explanation = examples.token.report.aiExplanation;
    expect(explanation).toBeTruthy();
    for (const c of explanation!.claims) {
      expect(c.evidence.length).toBeGreaterThan(0);
      for (const e of c.evidence) {
        expect(["uploaded_document", "user_provided", "authoritative_source", "internal_database", "estimate"]).toContain(
          e.kind,
        );
      }
    }
  });
});
