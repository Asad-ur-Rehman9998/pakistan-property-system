import { INSUFFICIENT } from "./types";
import type { EvidencePack, GroundedClaim, GroundedExplanation } from "./types";

const INVENTED = [
  /\bfraud\b/i,
  /\bscam\b/i,
  /legally\s+(safe|verified|clear|approved)/i,
  /officially\s+verified/i,
  /market\s+average/i,
  /sold\s+for/i,
  /confirmed\s+sale/i,
  /this\s+property\s+is\s+verified/i,
];

const STOP = new Set(["the", "and", "for", "this", "that", "with", "from", "have", "not", "are", "was", "you"]);

function words(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9\u0600-\u06ff]+/i)
    .filter((w) => w.length >= 3 && !STOP.has(w));
}

export function isInsufficientPhrase(text: string): boolean {
  return text.trim() === INSUFFICIENT.en || text.trim() === INSUFFICIENT.ur || text.trim() === INSUFFICIENT.roman;
}

export function inventsEvidence(text: string): boolean {
  return INVENTED.some((re) => re.test(text));
}

/** A sentence is grounded if it is the insufficient phrase, or its content words appear in the pack. */
export function isGroundedSentence(text: string, pack: EvidencePack): boolean {
  if (isInsufficientPhrase(text)) return true;
  if (inventsEvidence(text)) return false;
  const used = words(text);
  if (!used.length) return false;
  const allowed = new Set(pack.tokens);
  const hit = used.filter((w) => allowed.has(w)).length;
  return hit / used.length >= 0.45;
}

export function stripUngrounded(text: string, pack: EvidencePack): string {
  const parts = text
    .split(/(?<=[.!?۔])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => isGroundedSentence(s, pack));
  return parts.join(" ").trim();
}

export function explanationFromLlm(
  raw: string,
  local: GroundedExplanation,
  pack: EvidencePack,
): GroundedExplanation {
  const cleaned = stripUngrounded(raw, pack);
  if (!cleaned || inventsEvidence(cleaned)) {
    return { ...local, engine: "rules", llmUsed: false };
  }
  const claim: GroundedClaim = {
    id: "llm_restatement",
    text: { en: cleaned, ur: cleaned, roman: cleaned },
    evidence: local.claims.flatMap((c) => c.evidence).slice(0, 6),
  };
  if (!claim.evidence.length) {
    return { ...local, engine: "rules", llmUsed: false };
  }
  return {
    ...local,
    engine: "llm",
    llmUsed: true,
    claims: [claim, ...local.claims.slice(0, 6)],
  };
}
