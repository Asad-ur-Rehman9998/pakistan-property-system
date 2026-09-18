"use client";

import type { ReactNode } from "react";
import type { Lang, PriceIntelligence, PriceUnavailable, PriceUnitRate } from "@/types/check";
import { isPriceUnavailable } from "@/lib/engine/priceIntel";
import { formatPkr } from "@/lib/pakistan/money";
import { useI18n } from "@/lib/i18n/LanguageProvider";

function amount(row: PriceUnitRate, lang: Lang) {
  return formatPkr(row.pkr, lang);
}

function Unavailable({ row, lang }: { row: PriceUnavailable; lang: Lang }) {
  return <span className="text-[var(--muted)]">{row.message[lang]}</span>;
}

export function PriceIntel({ intel, lang }: { intel: PriceIntelligence; lang: Lang }) {
  const { t } = useI18n();
  const loc = (x: { en: string; ur: string; roman: string }) => x[lang];

  const row = (label: string, value: ReactNode) => (
    <div className="grid grid-cols-1 gap-1 border-b border-[var(--line)] py-3 last:border-b-0 sm:grid-cols-[11rem_1fr] sm:gap-3">
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-base leading-snug">{value}</p>
    </div>
  );

  return (
    <section id="price-intel" className="mt-5 panel p-4">
      <h2 className="text-xl font-semibold">{t.priceIntelTitle}</h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{loc(intel.disclaimer)}</p>

      <div className="mt-4 panel border border-[var(--amber)] px-3 py-2 text-sm font-semibold">
        {t.priceAskingVsSold}
      </div>

      <div className="mt-2">
        {row(
          t.priceAsking,
          intel.asking ? (
            <span>
              <span className="font-semibold">{formatPkr(intel.asking.pkr, lang)}</span>
              <span className="mt-1 block text-sm text-[var(--muted)]">{t.priceAskingH}</span>
            </span>
          ) : (
            <Unavailable row={intel.transaction} lang={lang} />
          ),
        )}
        {row(t.priceTransaction, <Unavailable row={intel.transaction} lang={lang} />)}
        {row(
          t.pricePerMarla,
          isPriceUnavailable(intel.perMarla) ? (
            <Unavailable row={intel.perMarla} lang={lang} />
          ) : (
            <span>
              <span className="me-2 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold">
                {t.priceAsking}
              </span>
              {amount(intel.perMarla, lang)}
              <span className="mt-1 block text-sm text-[var(--muted)]">{t.priceDerivedH}</span>
            </span>
          ),
        )}
        {row(
          t.pricePerKanal,
          isPriceUnavailable(intel.perKanal) ? (
            <Unavailable row={intel.perKanal} lang={lang} />
          ) : (
            <span>
              <span className="me-2 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold">
                {t.priceAsking}
              </span>
              {amount(intel.perKanal, lang)}
              <span className="mt-1 block text-sm text-[var(--muted)]">{t.priceDerivedH}</span>
            </span>
          ),
        )}
        {row(
          t.pricePerSqft,
          isPriceUnavailable(intel.perSqft) ? (
            <Unavailable row={intel.perSqft} lang={lang} />
          ) : (
            <span>
              <span className="me-2 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold">
                {t.priceAsking}
              </span>
              {amount(intel.perSqft, lang)}
              <span className="mt-1 block text-sm text-[var(--muted)]">{t.priceDerivedH}</span>
            </span>
          ),
        )}
        {row(t.priceComparables, <Unavailable row={intel.comparables} lang={lang} />)}
        {row(t.priceHistorical, <Unavailable row={intel.historicalAsking} lang={lang} />)}
        {row(t.priceRental, <Unavailable row={intel.rentalEstimate} lang={lang} />)}
        {row(t.priceRange, <Unavailable row={intel.priceRange} lang={lang} />)}
      </div>
    </section>
  );
}
