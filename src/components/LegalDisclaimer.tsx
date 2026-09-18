"use client";

import { LEGAL_DISCLAIMER, LEGAL_DISCLAIMER_DRAFT, LEGAL_DISCLAIMER_TITLE } from "@/lib/legal/disclaimer";
import { useI18n } from "@/lib/i18n/LanguageProvider";

export function LegalDisclaimer({ className = "mt-4" }: { className?: string }) {
  const { lang } = useI18n();
  return (
    <section id="legal-disclaimer" className={`panel border border-[var(--line)] p-4 ${className}`}>
      <h2 className="text-sm font-semibold tracking-wide text-[var(--green)]">{LEGAL_DISCLAIMER_TITLE[lang]}</h2>
      <p className="mt-2 text-sm font-medium leading-relaxed">{LEGAL_DISCLAIMER[lang]}</p>
      <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">{LEGAL_DISCLAIMER_DRAFT[lang]}</p>
    </section>
  );
}
