"use client";

import { termById } from "@/lib/pakistan/glossary";
import { useI18n } from "@/lib/i18n/LanguageProvider";

export function TermHint({ id }: { id?: string }) {
  const { lang, t } = useI18n();
  if (!id) return null;
  const g = termById(id);
  if (!g) return null;
  return (
    <p className="mt-1 text-sm leading-snug text-[var(--muted)]">
      <span className="font-medium text-[var(--ink)]">{t.plainWords}:</span> {g.plain[lang]}
    </p>
  );
}
