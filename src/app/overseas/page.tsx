"use client";

import Link from "next/link";
import { OVERSEAS_POA_LIMIT, OVERSEAS_STAGES } from "@/lib/overseas/workflow";
import { useI18n } from "@/lib/i18n/LanguageProvider";

export default function OverseasPage() {
  const { t, lang } = useI18n();
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--green)]">{t.overseasLaneTitle}</p>
      <h1 className="mt-1 text-3xl font-semibold leading-tight">{t.overseasTitle}</h1>
      <p className="mt-4 text-lg font-medium leading-snug">{t.overseasLead}</p>
      <p className="mt-3 text-base leading-relaxed text-[var(--muted)]">{t.overseasH}</p>
      <ol className="mt-6 space-y-0">
        {OVERSEAS_STAGES.map((stage, i) => (
          <li key={stage.id} className="panel p-4">
            {i > 0 ? (
              <p className="mb-2 text-center text-sm text-[var(--muted)]" aria-hidden>
                ↓
              </p>
            ) : null}
            <p className="text-sm font-semibold text-[var(--green)]">{i + 1}</p>
            <h2 className="mt-1 text-lg font-semibold leading-snug">{stage.title[lang]}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{stage.hint[lang]}</p>
          </li>
        ))}
      </ol>
      <p className="mt-6 text-sm font-semibold leading-relaxed">{OVERSEAS_POA_LIMIT[lang]}</p>
      <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">{t.guestOk}</p>
      <Link href="/check?intent=buy&abroad=1" prefetch={false} className="btn-primary mt-6 inline-flex w-full">
        {t.overseasStart}
      </Link>
      <Link href="/r/ex-overseas" prefetch={false} className="btn-ghost mt-3 inline-flex w-full">
        {t.overseasEx}
      </Link>
    </div>
  );
}
