"use client";

import type { CheckAnswers, Finding, Lang } from "@/types/check";
import { comparePapers } from "@/lib/docai/compare";
import { isConsistencyFinding } from "@/lib/docai/consistency";
import { useI18n } from "@/lib/i18n/LanguageProvider";

export function consistBadge(finding: Finding, t: { possibleInc: string; unableDetermine: string }) {
  return finding.kind === "verify" ? t.unableDetermine : t.possibleInc;
}

export function ConsistencyFlags({ answers }: { answers: CheckAnswers }) {
  const { t, lang } = useI18n();
  const items = comparePapers(answers).filter(isConsistencyFinding);
  if (!items.length) return null;
  return (
    <div className="flex flex-col gap-3">
      {items.map((f) => (
        <ConsistencyCard
          key={f.id}
          finding={f}
          lang={lang}
          badge={consistBadge(f, t)}
          verify={t.requiresVerify}
        />
      ))}
    </div>
  );
}

export function ConsistencyCard({
  finding,
  lang,
  badge,
  verify,
}: {
  finding: Finding;
  lang: Lang;
  badge: string;
  verify: string;
}) {
  return (
    <article className="panel border border-[var(--amber)] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--amber)]">🟠 {badge}</p>
      <h3 className="mt-2 text-lg font-semibold leading-snug">{finding.title[lang]}</h3>
      <p className="mt-2 whitespace-pre-line text-base leading-relaxed">{finding.why[lang]}</p>
      <p className="mt-3 text-sm font-semibold">{verify}</p>
      <p className="mt-1 text-sm leading-relaxed">{finding.doNow[lang]}</p>
    </article>
  );
}
