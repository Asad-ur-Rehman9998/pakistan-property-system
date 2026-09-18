"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { SavedCheck } from "@/types/check";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { useLowBandwidth } from "@/components/LowBwToggle";
import { qrSvg } from "@/lib/share/qr";
import { whatsappHref } from "@/lib/share/whatsapp";
import { formatSmsFallback } from "@/lib/share/messages";
import { SmsShare } from "@/components/SmsShare";
import {
  buildShareableSheet,
  formatShareableWhatsApp,
  shareableSheetPath,
  SHEET_IMPORTANT,
} from "@/lib/share/sheet";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { OfficialRequired } from "@/components/OfficialRequired";
import { DemoDataBanner } from "@/components/DemoDataBanner";

const MARK = { ok: "✓", warn: "⚠", unknown: "○" };

export function ShareableSheet({
  check,
  variant = "embed",
}: {
  check: SavedCheck;
  variant?: "embed" | "page";
}) {
  const { t, lang } = useI18n();
  const { on: rural } = useLowBandwidth();
  const loc = (x: { en: string; ur: string; roman: string }) => x[lang];
  const sheet = useMemo(() => buildShareableSheet(check), [check]);
  const [copied, setCopied] = useState(false);
  const sheetPath = shareableSheetPath(check.id, check.shareKey);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const sheetUrl = origin ? `${origin}${sheetPath}` : sheetPath;
  const wa = whatsappHref(formatShareableWhatsApp(sheet, lang, sheetUrl, { checkId: check.id }));
  const svg = useMemo(() => (rural || !origin ? "" : qrSvg(sheetUrl)), [origin, sheetUrl, rural]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(sheetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <section id="share-sheet" className="panel p-5">
      <DemoDataBanner checkId={check.id} />
      <p className="text-xs font-semibold tracking-wide text-[var(--muted)]">{t.productKindShort}</p>
      <h2 className="mt-1 text-xl font-semibold">{t.sheetTitle}</h2>

      <SheetBlock label={t.sheetProperty} value={loc(sheet.property)} />
      <SheetBlock label={t.sheetLocation} value={loc(sheet.location)} />
      <SheetBlock label={t.sheetAsking} value={loc(sheet.asking)} />
      <SheetBlock label={t.sheetStatus} value={`${sheet.statusEmoji} ${loc(sheet.statusLabel)}`} />

      <h3 className="mt-5 text-sm font-semibold">{t.sheetDocs}</h3>
      <ul className="mt-2 space-y-1.5 text-sm leading-snug">
        {sheet.documents.map((d) => (
          <li key={d.text.en}>
            {MARK[d.mark]} {loc(d.text)}
          </li>
        ))}
      </ul>

      <h3 className="mt-5 text-sm font-semibold">{t.sheetConsist}</h3>
      <ul className="mt-2 space-y-1.5 text-sm leading-snug">
        {sheet.consistency.map((d) => (
          <li key={d.text.en}>
            {MARK[d.mark]} {loc(d.text)}
          </li>
        ))}
      </ul>

      <h3 className="mt-5 text-sm font-semibold">{t.sheetPrice}</h3>
      <ul className="mt-2 space-y-1.5 text-sm leading-snug">
        {sheet.priceLines.map((p) => (
          <li key={p.en}>{loc(p)}</li>
        ))}
      </ul>

      <div className="mt-5 panel border border-[var(--amber)] p-4">
        <p className="text-sm font-semibold">{t.sheetImportant}</p>
        <p className="mt-2 text-sm leading-relaxed">{loc(SHEET_IMPORTANT)}</p>
      </div>
      <OfficialRequired className="mt-5" />
      <LegalDisclaimer className="mt-5" />

      {rural ? null : (
        <div className="mt-5 rural-qr">
          <p className="text-sm font-semibold">{t.sheetQr}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">{t.sheetQrH}</p>
          {svg ? (
            <div
              className="mt-3 w-44 overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper-2)]"
              role="img"
              aria-label={t.sheetQr}
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          ) : null}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-2 print:hidden">
        {variant === "embed" ? (
          <Link href={sheetPath} prefetch={false} className="btn-primary">
            {t.sheetWeb}
          </Link>
        ) : (
          <button type="button" className="btn-ghost" onClick={() => void copy()}>
            {copied ? t.copied : t.sheetWeb}
          </button>
        )}
        <button type="button" className="btn-ghost" onClick={() => window.print()}>
          {t.sheetPdf}
        </button>
        <a className="btn-primary" href={wa} target="_blank" rel="noopener noreferrer">
          {t.sheetWa}
        </a>
        <SmsShare className="btn-ghost" text={formatSmsFallback(sheetUrl, lang)} />
      </div>
    </section>
  );
}

function SheetBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-4 border-b border-[var(--line)] pb-3">
      <p className="text-xs font-semibold tracking-wide text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-base font-semibold leading-snug">{value}</p>
    </div>
  );
}
