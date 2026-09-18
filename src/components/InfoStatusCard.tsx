"use client";

import type { InfoStatus, Lang } from "@/types/check";
import { INFO_STATUS_META } from "@/lib/engine/infoStatus";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/cn";

export function InfoStatusCard({ status, lang }: { status: InfoStatus; lang: Lang }) {
  const { t } = useI18n();
  const loc = (x: { en: string; ur: string; roman: string }) => x[lang];
  const tone =
    status.level === "high"
      ? "border-[var(--red)]"
      : status.level === "verify"
        ? "border-[var(--amber)]"
        : "border-[var(--line)]";

  return (
    <section id="status" className={cn("panel border p-5", tone)}>
      <p className="text-xs font-semibold tracking-wide text-[var(--muted)]">{t.productKindShort}</p>
      <h2 className="mt-2 text-lg font-semibold leading-snug">{t.infoStatusTitle}</h2>
      <p className="mt-3 text-sm font-medium text-[var(--muted)]">{t.overallStatus}</p>
      <p className="mt-1 text-xl font-semibold leading-tight sm:text-[1.65rem]">
        {status.emoji} {loc(status.label)}
      </p>
      <p className="mt-3 text-sm leading-relaxed">{t.infoStatusNotSafety}</p>
      <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">{t.infoStatusNoAi}</p>

      <h3 className="mt-5 text-sm font-semibold">{t.infoStatusWhy}</h3>
      <ol className="mt-2 list-decimal space-y-2 ps-5 text-sm leading-relaxed">
        {status.reasons.map((reason) => (
          <li key={reason.en}>{loc(reason)}</li>
        ))}
      </ol>

      <ul className="mt-5 space-y-2 border-t border-[var(--line)] pt-4">
        {INFO_STATUS_META.map((row) => {
          const active = row.level === status.level;
          return (
            <li key={row.level} className={cn("text-sm leading-snug", active ? "font-semibold" : "text-[var(--muted)]")}>
              <span className="block">
                {row.emoji} {loc(row.label)}
              </span>
              {active ? <span className="mt-1 block text-xs font-normal text-[var(--muted)]">{loc(row.meaning)}</span> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
