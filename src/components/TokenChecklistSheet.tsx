"use client";

import type { Lang, TokenChecklistReport } from "@/types/check";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/cn";
import { formatChecklistWhatsApp, formatSmsFallback } from "@/lib/share/messages";
import { WhatsAppShare } from "./WhatsAppShare";
import { SmsShare } from "./SmsShare";

const MARK_STYLE: Record<string, string> = {
  confirmed: "border-[var(--green)] text-[var(--green)]",
  verify: "border-[var(--amber)] text-[var(--amber)]",
  missing: "border-[var(--red)] text-[var(--red)]",
  na: "border-[var(--line)] text-[var(--muted)]",
  unanswered: "border-[var(--line)] text-[var(--muted)]",
};

export function TokenChecklistSheet({
  sheet,
  lang,
  shareUrl,
}: {
  sheet: TokenChecklistReport;
  lang: Lang;
  shareUrl?: string;
}) {
  const { t } = useI18n();
  const label = (mark: TokenChecklistReport["items"][number]["mark"]) => {
    if (mark === "confirmed") return t.ddMarkConfirmed;
    if (mark === "verify") return t.ddMarkVerify;
    if (mark === "missing") return t.ddMarkMissing;
    if (mark === "na") return t.ddMarkNa;
    return t.ddUnansweredN;
  };

  return (
    <section id="checklist" className="mt-5 panel p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--green)]">{t.tokenMode}</p>
      <h2 className="mt-1 text-xl font-semibold leading-snug">{t.ddChecklistTitle}</h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{t.ddChecklistH}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Count n={sheet.counts.confirmed} label={t.ddConfirmedN} tone="green" />
        <Count n={sheet.counts.verify} label={t.ddVerifyN} tone="amber" />
        <Count n={sheet.counts.missing} label={t.ddMissingN} tone="red" />
        <Count n={sheet.counts.na} label={t.ddNaN} tone="slate" />
      </div>
      <ol className="mt-4 space-y-3">
        {sheet.items.map((item, i) => (
          <li key={item.id} className="panel p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold leading-snug">
                <span className="text-[var(--muted)]">{i + 1}.</span> {item.title[lang]}
              </p>
              <span
                className={cn(
                  "shrink-0 rounded-[var(--radius)] border px-2 py-1 text-xs font-semibold",
                  MARK_STYLE[item.mark],
                )}
              >
                {label(item.mark)}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{item.hint[lang]}</p>
          </li>
        ))}
      </ol>
      {shareUrl ? (
        <>
          <WhatsAppShare className="btn-primary mt-4 w-full" text={formatChecklistWhatsApp({ lang, url: shareUrl, sheet })} />
          <SmsShare className="mt-2 w-full" text={formatSmsFallback(shareUrl, lang)} />
        </>
      ) : null}
    </section>
  );
}

function Count({ n, label, tone }: { n: number; label: string; tone: "green" | "amber" | "red" | "slate" }) {
  const color =
    tone === "green"
      ? "text-[var(--green)]"
      : tone === "amber"
        ? "text-[var(--amber)]"
        : tone === "red"
          ? "text-[var(--red)]"
          : "text-[var(--ink)]";
  return (
    <div className="panel px-2 py-3 text-center">
      <p className={cn("text-xl font-semibold tabular-nums", color)}>{n}</p>
      <p className="mt-1 text-[11px] leading-tight text-[var(--muted)]">{label}</p>
    </div>
  );
}
