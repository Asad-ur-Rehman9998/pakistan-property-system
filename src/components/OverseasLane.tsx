"use client";

import { OVERSEAS_POA_LIMIT, OVERSEAS_STAGES } from "@/lib/overseas/workflow";
import { useI18n } from "@/lib/i18n/LanguageProvider";

export function OverseasLane() {
  const { t, lang } = useI18n();
  return (
    <section id="overseas-path" className="mt-5 panel border border-[var(--amber)] p-4">
      <h2 className="text-sm font-semibold tracking-wide text-[var(--green)]">{t.overseasLaneTitle}</h2>
      <p className="mt-2 text-base font-semibold leading-snug">{t.overseasLead}</p>
      <ol className="mt-4 space-y-0">
        {OVERSEAS_STAGES.map((stage, i) => (
          <li key={stage.id}>
            {i > 0 ? (
              <p className="py-1 text-center text-sm text-[var(--muted)]" aria-hidden>
                ↓
              </p>
            ) : null}
            <p className="font-semibold leading-snug">{stage.title[lang]}</p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">{stage.hint[lang]}</p>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-sm font-semibold leading-relaxed">{OVERSEAS_POA_LIMIT[lang]}</p>
    </section>
  );
}
