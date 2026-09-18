"use client";

import type { Lang, RiskAttention, RiskItem } from "@/types/check";
import { RISK_LANES } from "@/lib/engine/risk";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/cn";

const ATTENTION_STYLE: Record<RiskAttention, string> = {
  high: "border-[var(--red)]",
  medium: "border-[var(--amber)]",
  low: "border-[var(--line)]",
};

export function RiskEngine({ items, lang }: { items: RiskItem[]; lang: Lang }) {
  const { t } = useI18n();
  const loc = (x: { en: string; ur: string; roman: string }) => x[lang];
  const counts = Object.fromEntries(RISK_LANES.map((l) => [l.id, items.filter((i) => i.lane === l.id).length]));

  return (
    <section id="risk" className="mt-8">
      <h2 className="text-xl font-semibold">{t.riskEngine}</h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{t.riskEngineH}</p>

      <ol className="mt-4 space-y-1 text-sm">
        {RISK_LANES.map((lane, i) => {
          const n = counts[lane.id] ?? 0;
          return (
            <li key={lane.id} className="flex items-baseline justify-between gap-3">
              <span className={cn(n ? "font-medium" : "text-[var(--muted)]")}>
                {i + 1}. {loc(lane.title)}
              </span>
              <span className={cn("tabular-nums", n ? "font-semibold" : "text-[var(--muted)]")}>{n}</span>
            </li>
          );
        })}
      </ol>

      {items.length ? (
        <div className="mt-4 flex flex-col gap-3">
          {items.map((risk) => (
            <RiskCard key={risk.id} risk={risk} lang={lang} />
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-[var(--muted)]">{t.riskNone}</p>
      )}
    </section>
  );
}

export function RiskCard({ risk, lang }: { risk: RiskItem; lang: Lang }) {
  const { t } = useI18n();
  const badge =
    risk.attention === "high" ? t.riskHigh : risk.attention === "medium" ? t.riskMed : t.riskLow;
  const mark = risk.attention === "high" ? "🔴" : risk.attention === "medium" ? "🟠" : "🟡";
  return (
    <article className={cn("panel border p-4", ATTENTION_STYLE[risk.attention])}>
      <p className="text-xs font-semibold uppercase tracking-wide">
        {mark} {badge}
      </p>
      <h3 className="mt-2 text-lg font-semibold leading-snug">{risk.title[lang]}</h3>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide opacity-80">{t.riskWhy}</p>
      <p className="mt-1 whitespace-pre-line text-base leading-relaxed">{risk.why[lang]}</p>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide opacity-80">{t.riskEvidence}</p>
      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{risk.evidence[lang]}</p>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide opacity-80">{t.riskDo}</p>
      <p className="mt-1 text-base leading-relaxed">{risk.doNow[lang]}</p>
    </article>
  );
}
