"use client";

import { OFFICIAL_REQUIRED_EN, OFFICIAL_SLOT_LABEL, officialSnapshot } from "@/lib/official/registry";
import { useI18n } from "@/lib/i18n/LanguageProvider";

export function OfficialRequired({ className = "mt-4" }: { className?: string }) {
  const { t, lang } = useI18n();
  const snap = officialSnapshot();
  return (
    <section id="official-verification" className={`panel border border-[var(--amber)] p-4 ${className}`}>
      <h2 className="text-sm font-semibold tracking-wide text-[var(--green)]">{t.officialTitle}</h2>
      <p className="mt-2 text-base font-semibold">{OFFICIAL_REQUIRED_EN}</p>
      <p className="mt-2 text-sm leading-relaxed">{t.officialH}</p>
      <ul className="mt-3 space-y-1.5 text-sm">
        {snap.slots.map((slot) => (
          <li key={slot.id} className="flex flex-wrap items-baseline justify-between gap-2">
            <span>{OFFICIAL_SLOT_LABEL[slot.id][lang]}</span>
            <span className="text-[var(--muted)]">{OFFICIAL_REQUIRED_EN}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
