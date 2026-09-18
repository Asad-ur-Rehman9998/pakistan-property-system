"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { areaUnits } from "@/lib/pakistan/area";
import type { AreaUnit } from "@/types/check";
import { parseDealerImport } from "@/lib/dealer/import";
import { dealerPageTitle, dealerReportStatus } from "@/lib/dealer/status";
import {
  emptyDealerPage,
  loadDealerPages,
  pageFromImport,
  saveDealerPage,
  saveDealerPages,
  subscribeDealerPages,
} from "@/lib/dealer/store";
import { getCheck } from "@/lib/storage";
import { useEntitlements } from "@/components/billing/EntitlementsProvider";
import { UpgradeNote } from "@/components/billing/UpgradeNote";
import { track } from "@/lib/analytics/client";

const NONE: ReturnType<typeof loadDealerPages> = [];

export function DealerDashboard() {
  const { t, lang } = useI18n();
  const { can } = useEntitlements();
  const router = useRouter();
  const pages = useSyncExternalStore(subscribeDealerPages, loadDealerPages, () => NONE);
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [plot, setPlot] = useState("");
  const [khasra, setKhasra] = useState("");
  const [size, setSize] = useState("");
  const [unit, setUnit] = useState<AreaUnit | "">("");
  const [price, setPrice] = useState("");
  const [paste, setPaste] = useState("");
  const [imported, setImported] = useState(0);

  useEffect(() => {
    track("dealer_used");
  }, []);

  const create = () => {
    if (!city.trim() && !area.trim() && !plot.trim() && !khasra.trim()) return;
    const page = emptyDealerPage({
      city: city.trim(),
      area: area.trim(),
      plotNumber: plot.trim(),
      khasraNumber: khasra.trim(),
      areaSize: size.trim(),
      areaUnit: unit || null,
      price: price.trim(),
    });
    saveDealerPage(page);
    track("dealer_used");
    router.push(`/dealer/${page.id}`);
  };

  const runImport = () => {
    const rows = parseDealerImport(paste);
    if (!rows.length) {
      setImported(0);
      return;
    }
    const extra = rows.map(pageFromImport);
    saveDealerPages([...extra, ...loadDealerPages()]);
    setImported(extra.length);
    setPaste("");
  };

  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-[var(--muted)]">{t.notListing}</p>
      <h1 className="mt-2 text-3xl font-semibold leading-tight">{t.dealerMain}</h1>
      <p className="mt-3 text-base leading-relaxed">{t.dealerH}</p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{t.dealerMainH}</p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{t.dealerNotCrm}</p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{t.guestOk}</p>
      {can("dealer_pages") ? null : <UpgradeNote title={t.planDealerLock} body={t.planDealerLockH} stage={false} />}

      <section className="mt-6 panel p-4">
        <h2 className="text-lg font-semibold">{t.dealerAdd}</h2>
        <div className="mt-3 grid gap-3">
          <label className="text-sm font-semibold">
            {t.city}
            <input className="field mt-1" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Lahore" />
          </label>
          <label className="text-sm font-semibold">
            {t.societyName}
            <input className="field mt-1" value={area} onChange={(e) => setArea(e.target.value)} placeholder={t.societyNamePh} />
          </label>
          <label className="text-sm font-semibold">
            {t.plotNo}
            <input className="field mt-1" value={plot} onChange={(e) => setPlot(e.target.value)} placeholder={t.plotNoPh} />
          </label>
          <label className="text-sm font-semibold">
            {t.khasraNo}
            <input className="field mt-1" value={khasra} onChange={(e) => setKhasra(e.target.value)} placeholder={t.khasraNoPh} />
          </label>
          <label className="text-sm font-semibold">
            {t.areaSize}
            <input className="field mt-1" value={size} onChange={(e) => setSize(e.target.value)} placeholder="10" />
          </label>
          <div className="flex flex-wrap gap-2">
            {areaUnits.map((u) => (
              <button
                key={u.id}
                type="button"
                className={unit === u.id ? "btn-primary min-h-11 px-3 text-sm" : "btn-ghost min-h-11 px-3 text-sm"}
                onClick={() => setUnit(u.id)}
              >
                {u.label[lang]}
              </button>
            ))}
          </div>
          <label className="text-sm font-semibold">
            {t.price}
            <input className="field mt-1" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={t.pricePh} />
          </label>
        </div>
        <button type="button" className="btn-primary mt-4 w-full" onClick={create}>
          {t.dealerCreate}
        </button>
      </section>

      <section className="mt-5 panel p-4">
        <h2 className="text-lg font-semibold">{t.dealerImport}</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{t.dealerImportH}</p>
        <textarea
          className="field mt-3 min-h-28"
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          placeholder={"Lahore, DHA Phase 6, 412, 10 marla, 2.5 crore"}
        />
        <button type="button" className="btn-ghost mt-3 w-full" onClick={runImport}>
          {t.dealerImportGo}
        </button>
        {imported ? (
          <p className="mt-2 text-sm font-semibold">
            {t.dealerImportOk}: {imported}
          </p>
        ) : null}
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">{t.dealerPages}</h2>
        {pages.length === 0 ? (
          <p className="mt-3 text-[var(--muted)]">{t.dealerNoPages}</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {pages.map((page) => {
              const check = page.checkId ? getCheck(page.checkId) : null;
              const status = dealerReportStatus(page, check);
              return (
                <li key={page.id}>
                  <Link href={`/dealer/${page.id}`} prefetch={false} className="block panel p-4">
                    <p className="font-semibold">{dealerPageTitle(page)}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{status.label[lang]}</p>
                    {page.price ? (
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {t.price}: {page.price}
                      </p>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Link href="/r/ex-urban" prefetch={false} className="btn-ghost mt-6 w-full">
        {t.dealerSeeSample}
      </Link>
      <Link href="/check?intent=sell&from=dealer" prefetch={false} className="btn-ghost mt-3 w-full">
        {t.checkProperty}
      </Link>
      <p className="mt-6 text-sm text-[var(--muted)]">{t.registerLater}</p>
    </div>
  );
}
