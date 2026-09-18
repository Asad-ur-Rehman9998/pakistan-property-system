"use client";

import type { GroundedExplanation, Lang } from "@/types/check";
import { useI18n } from "@/lib/i18n/LanguageProvider";

export function EvidenceExplain({
  explanation,
  lang,
}: {
  explanation?: GroundedExplanation;
  lang: Lang;
}) {
  const { t } = useI18n();
  if (!explanation) return null;
  const loc = (x: { en: string; ur: string; roman: string }) => x[lang];

  return (
    <section id="ai-explain" className="panel mt-8 p-4">
      <h2 className="text-xl font-semibold">{t.aiExplain}</h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{t.aiExplainH}</p>
      <p className="mt-2 text-xs text-[var(--muted)]">
        {explanation.stages.join(" → ")} · LLM {explanation.llmUsed ? t.aiLlmOn : t.aiLlmOff}
      </p>
      <ol className="mt-4 space-y-3">
        {explanation.claims.map((c) => (
          <li key={c.id}>
            <p className="leading-relaxed">{loc(c.text)}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {c.evidence.map((e) => loc(e.label)).join(" · ")}
            </p>
          </li>
        ))}
      </ol>
      <div className="mt-4 panel border border-[var(--amber)] p-3">
        <p className="text-sm font-semibold">{t.aiNotEnough}</p>
        <p className="mt-2 text-sm leading-relaxed">{explanation.undetermined[0] ? loc(explanation.undetermined[0].text) : t.aiInsufficient}</p>
      </div>
    </section>
  );
}
