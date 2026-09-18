import type { CheckAnswers, ClarityReport } from "@/types/check";
import { claimFromFinding, claimFromRisk, packTokens } from "./cite";
import { INSUFFICIENT, type EvidencePack, type GroundedClaim, type GroundedExplanation } from "./types";
import { AI_STAGES } from "./types";

function undetermined(id: string, pointer: string): GroundedClaim {
  return {
    id,
    text: INSUFFICIENT,
    evidence: [],
  };
}

export function collectPack(answers: CheckAnswers, report: ClarityReport): EvidencePack {
  const claims = [
    ...report.risks.slice(0, 8).map(claimFromRisk),
    ...[...report.inconsistent, ...report.missing, ...report.verify, ...report.known]
      .slice(0, 8)
      .map(claimFromFinding),
  ];
  return {
    tokens: packTokens(answers, report),
    pointers: claims.flatMap((c) => c.evidence.map((e) => e.pointer)),
    claims,
  };
}

export function explainReport(answers: CheckAnswers, report: ClarityReport): GroundedExplanation {
  const pack = collectPack(answers, report);
  const undeterminedClaims: GroundedClaim[] = [
    undetermined("undetermined_legal", "official"),
    undetermined("undetermined_fraud", "fraud"),
  ];
  if (!report.priceIntel?.transaction || report.priceIntel.transaction.available === false) {
    undeterminedClaims.push(undetermined("undetermined_sale_price", "price.transaction"));
  }

  return {
    engine: "rules",
    llmUsed: false,
    llmRequired: false,
    stages: AI_STAGES,
    claims: pack.claims.slice(0, 10),
    undetermined: undeterminedClaims,
  };
}

const NEEDS_OFFICIAL = /verified|legal(ly)?\s*(safe|clear)|title\s*clear|sarkari tasdeeq|qanooni/i;
const NEEDS_PRICE = /market|worth|valuation|sold for|farokht|qeemat ki had/i;
const NEEDS_FRAUD = /\bfraud\b|\bscam\b|dhoka|farz/i;

/** Answer a free-text question from the evidence pack only. Never invent. */
export function answerFromEvidence(question: string, pack: EvidencePack): string {
  const q = question.trim();
  if (!q) return INSUFFICIENT.en;
  if (NEEDS_FRAUD.test(q) || NEEDS_OFFICIAL.test(q)) return INSUFFICIENT.en;
  if (NEEDS_PRICE.test(q)) return INSUFFICIENT.en;
  const needle = q.toLowerCase();
  const hit = pack.claims.find((c) => `${c.text.en} ${c.id}`.toLowerCase().includes(needle.slice(0, 24)));
  if (hit?.evidence.length) return hit.text.en;
  return INSUFFICIENT.en;
}
