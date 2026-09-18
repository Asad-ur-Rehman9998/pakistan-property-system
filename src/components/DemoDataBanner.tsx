"use client";

import { DEMO_DATA_LABEL, isDemoCheckId } from "@/lib/demo/data";
import { useI18n } from "@/lib/i18n/LanguageProvider";

export function DemoDataBanner({ checkId }: { checkId?: string | null }) {
  const { t } = useI18n();
  if (!isDemoCheckId(checkId)) return null;
  return (
    <div className="mb-3 rounded-[var(--radius)] border border-[var(--amber)] px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--amber)]">{DEMO_DATA_LABEL}</p>
      <p className="mt-1 text-sm leading-snug text-[var(--muted)]">{t.demoDataH}</p>
    </div>
  );
}
