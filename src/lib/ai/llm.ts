import type { GroundedExplanation } from "./types";
import type { EvidencePack } from "./types";
import { explanationFromLlm } from "./ground";
import { llmExplainKey, llmExplainUrl } from "@/lib/server/env";

export function llmExplainConfigured(): boolean {
  return Boolean(llmExplainUrl());
}

/**
 * Optional rewrite. The app never waits on this during a guest check.
 * Output is dropped if it invents facts that are not in the evidence pack.
 */
export async function maybeLlmRewrite(
  local: GroundedExplanation,
  pack: EvidencePack,
): Promise<GroundedExplanation> {
  const url = llmExplainUrl();
  const key = llmExplainKey();
  if (!url) return { ...local, engine: "rules", llmUsed: false, llmRequired: false };

  const body = {
    task: "restate_only",
    instruction:
      "Explain the cited evidence in simple words. Do not add facts. Do not call anything verified, fraud, or a market price. If a fact is missing, say: I don't have enough information to determine this.",
    claims: local.claims.map((c) => ({
      id: c.id,
      text: c.text.en,
      evidence: c.evidence.map((e) => e.kind),
    })),
    undetermined: local.undetermined.map((u) => u.text.en),
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(key ? { authorization: `Bearer ${key}` } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { ...local, llmUsed: false };
    const json = (await res.json()) as { text?: string };
    const text = String(json.text || "").slice(0, 2000);
    return explanationFromLlm(text, local, pack);
  } catch {
    return { ...local, engine: "rules", llmUsed: false };
  }
}
