"use client";

import Link from "next/link";
import type { DuplicateMatch, DuplicateReport, DuplicateSignal, Lang } from "@/types/check";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/cn";

function statusClass(status: DuplicateSignal["status"]) {
  if (status === "match") return "border-[var(--amber)] text-[var(--amber)]";
  if (status === "differ") return "border-[var(--line)] text-[var(--ink)]";
  return "border-[var(--line)] text-[var(--muted)]";
}

export function DuplicateCard({
  report,
  lang,
}: {
  report: DuplicateReport;
  lang: Lang;
}) {
  const { t } = useI18n();
  const loc = (x: { en: string; ur: string; roman: string }) => x[lang];
  const n = report.matches.length;
  const hit = n > 0;

  const sigLabel: Record<DuplicateSignal["id"], string> = {
    location: t.dupSigLocation,
    plot: t.dupSigPlot,
    images: t.dupSigImages,
    characteristics: t.dupSigChars,
    description: t.dupSigDesc,
    price: t.dupSigPrice,
    contact: t.dupSigContact,
  };
  const sigStatus = (s: DuplicateSignal["status"]) =>
    s === "match" ? t.dupStatusMatch : s === "differ" ? t.dupStatusDiffer : t.dupStatusUnknown;

  return (
    <section
      id="duplicates"
      className={cn("mt-5 panel border p-4", hit ? "border-[var(--amber)]" : "")}
    >
      <h2 className="text-xl font-semibold">{t.dupTitle}</h2>
      <p className="mt-2 text-base leading-relaxed">{loc(report.summary)}</p>
      <p className="mt-2 text-sm leading-relaxed opacity-90">{t.dupDisclaimer}</p>

      {hit ? (
        <div className="mt-4">
          <p className="text-sm font-semibold">{t.dupCompare}</p>
          <ul className="mt-2 flex flex-col gap-3">
            {report.matches.map((m) => (
              <MatchRow key={m.id} match={m} lang={lang} sigLabel={sigLabel} sigStatus={sigStatus} statusClass={statusClass} />
            ))}
          </ul>
        </div>
      ) : report.comparedCount <= 0 ? (
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{t.dupNoneH}</p>
      ) : null}
    </section>
  );
}

function MatchRow({
  match,
  lang,
  sigLabel,
  sigStatus,
  statusClass,
}: {
  match: DuplicateMatch;
  lang: Lang;
  sigLabel: Record<DuplicateSignal["id"], string>;
  sigStatus: (s: DuplicateSignal["status"]) => string;
  statusClass: (s: DuplicateSignal["status"]) => string;
}) {
  return (
    <li className="panel p-3">
      <Link href={match.href} prefetch={false} className="text-base font-semibold text-[var(--green)]">
        {match.label[lang]}
      </Link>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {match.signals.map((s) => (
          <li key={s.id} className={cn("rounded-[var(--radius)] border px-2 py-1 text-xs font-semibold", statusClass(s.status))}>
            {sigLabel[s.id]}: {sigStatus(s.status)}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-sm leading-snug text-[var(--muted)]">{match.signals.find((s) => s.status === "match")?.detail[lang]}</p>
    </li>
  );
}
