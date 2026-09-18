import { classifyPaper } from "@/lib/docai/classify";
import { extractFields } from "@/lib/docai/extract";
import { comparePapers } from "@/lib/docai/compare";
import { evaluate } from "@/lib/engine/evaluate";
import { emptyAnswers, type CheckAnswers, type PaperRead } from "@/types/check";
import { AI_STAGES, type AiStage } from "./types";

export { AI_STAGES };

/**
 * OCR → parser → structured data → validation rules → risk engine → explanation.
 * A language model is not required. Photos stay on the phone; this path accepts OCR text.
 */
export function runFromOcrText(ocrText: string, partial?: Partial<CheckAnswers>) {
  const ran: AiStage[] = ["ocr"];
  const parsed = classifyPaper(ocrText);
  ran.push("parser");
  const fields = extractFields(ocrText);
  ran.push("structured");
  const read: PaperRead = {
    photoKey: "",
    kind: parsed.kind,
    kindConfidence: parsed.confidence,
    fields,
    ocrStatus: ocrText.trim() ? "done" : "skipped",
    encrypted: true,
    createdAt: new Date().toISOString(),
  };
  const answers: CheckAnswers = {
    ...emptyAnswers(),
    ...partial,
    paperReads: [read, ...(partial?.paperReads ?? [])],
  };
  const validation = comparePapers(answers);
  ran.push("validation");
  const report = evaluate(answers);
  ran.push("risk");
  ran.push("explain");
  return {
    stages: ran,
    expected: AI_STAGES,
    parser: parsed,
    fields,
    validation,
    report,
    explanation: report.aiExplanation,
    llmRequired: false as const,
  };
}
