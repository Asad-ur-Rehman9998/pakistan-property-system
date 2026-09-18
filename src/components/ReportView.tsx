"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { EvidenceSource, Finding, Lang, SavedCheck, Verdict } from "@/types/check";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/cn";
import { formatArea } from "@/lib/pakistan/area";
import { formatPkr, parsePkr } from "@/lib/pakistan/money";
import { IconAsk, IconCheck, IconOffice, IconWarn } from "./icons";
import { consistBadge, ConsistencyCard } from "./ConsistencyFlags";
import { isConsistencyFinding } from "@/lib/docai/consistency";
import { RiskEngine } from "./RiskEngine";
import { TokenChecklistSheet } from "./TokenChecklistSheet";
import { InfoStatusCard } from "./InfoStatusCard";
import { PriceIntel } from "./PriceIntel";
import { DuplicateCard } from "./DuplicateCard";
import { ShareableSheet } from "./ShareableSheet";
import { EvidenceExplain } from "./EvidenceExplain";
import { ReviewAsk } from "./billing/ReviewAsk";
import { UpgradeNote } from "./billing/UpgradeNote";
import { LegalDisclaimer } from "./LegalDisclaimer";
import { OfficialRequired } from "./OfficialRequired";
import { OverseasLane } from "./OverseasLane";
import { DemoDataBanner } from "./DemoDataBanner";
import { useEntitlements } from "./billing/EntitlementsProvider";
import { loadChecks, subscribeChecks } from "@/lib/storage";
import { assessDuplicates, candidateFromCheck, duplicateRisks } from "@/lib/engine/duplicates";
import { buildShareableSheet, formatShareableWhatsApp, publicReportPath, shareableSheetPath } from "@/lib/share/sheet";
import { whatsappHref } from "@/lib/share/whatsapp";
import { formatMissingDocsWhatsApp, formatSmsFallback, missingDocNames } from "@/lib/share/messages";
import { WhatsAppShare, useOrigin } from "./WhatsAppShare";
import { SmsShare } from "./SmsShare";

const NO_CHECKS: SavedCheck[] = [];

export function ReportView({
  check,
  example,
  catalog,
}: {
  check: SavedCheck;
  example?: boolean;
  catalog?: SavedCheck[];
}) {
  const { t, lang } = useI18n();
  const { can } = useEntitlements();
  const detailed = Boolean(example) || can("detailed_report");
  const origin = useOrigin();
  const r = check.report;
  const loc = (x: { en: string; ur: string; roman: string }) => x[lang];
  const [copied, setCopied] = useState(false);
  const [asked, setAsked] = useState<Record<string, boolean>>({});
  const provenance = r.provenance ?? emptyProvenance();
  const consistItems = [...r.inconsistent, ...r.verify].filter(isConsistencyFinding);
  const localChecks = useSyncExternalStore(subscribeChecks, loadChecks, () => NO_CHECKS);
  const pool = example ? (catalog ?? []) : localChecks;
  const duplicates = useMemo(
    () =>
      assessDuplicates(check.answers, {
        selfId: check.id,
        candidates: pool.filter((c) => c.id !== check.id).map(candidateFromCheck),
      }),
    [check.answers, check.id, pool],
  );
  const risks = [
    ...(r.risks ?? []).filter((x) => x.id !== "risk_possible_duplicate"),
    ...duplicateRisks(duplicates),
  ];

  const sheet = useMemo(() => buildShareableSheet(check), [check]);
  const shareText = useMemo(() => {
    return formatShareableWhatsApp(sheet, lang, `${origin}${shareableSheetPath(check.id, check.shareKey)}`, {
      checkId: check.id,
    });
  }, [sheet, lang, check.id, check.shareKey, origin]);
  const wa = whatsappHref(shareText);

  const speak = () => {
    const u = new SpeechSynthesisUtterance(
      `${r.infoStatus ? `${r.infoStatus.label[lang]}. ` : ""}${r.headline[lang]}. ${t.notVerifiedBanner}. ${r.summary[lang]}`,
    );
    u.lang = lang === "ur" ? "ur-PK" : "en-PK";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${origin}${publicReportPath(check.id, check.shareKey)}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <article>
      <DemoDataBanner checkId={check.id} />
      {example && !check.id.startsWith("ex-") ? (
        <p className="mb-3 inline-block rounded-[var(--radius)] border border-[var(--amber)] px-3 py-1 text-xs font-semibold text-[var(--amber)]">
          {t.exampleBadge}
        </p>
      ) : null}

      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{t.productKind}</p>
      <ShareableSheet check={check} />
      <div className="report-full mt-5">
      {r.infoStatus ? <InfoStatusCard status={r.infoStatus} lang={lang} /> : null}
      <div className="mt-4">
        <VerdictBanner verdict={r.verdict} headline={loc(r.headline)} summary={loc(r.summary)} />
      </div>

      {r.tokenChecklist ? (
        <TokenChecklistSheet
          sheet={r.tokenChecklist}
          lang={lang}
          shareUrl={origin ? `${origin}/r/${check.id}#checklist` : `/r/${check.id}#checklist`}
        />
      ) : null}

      <div className="mt-4 panel border border-[var(--amber)] p-4">
        <p className="font-semibold leading-snug">{t.notVerifiedBanner}</p>
        {r.hasOfficialVerification ? null : (
          <p className="mt-2 text-sm">
            {t.srcVerified}: 0 — {t.srcVerifiedH}
          </p>
        )}
      </div>
      <OfficialRequired />
      <LegalDisclaimer />
      {check.answers.buyerLocation === "abroad" ? <OverseasLane /> : null}

      <p className="mt-4 text-sm text-[var(--muted)]">
        {identityLine(check, lang, t)}
      </p>

      {detailed ? <DuplicateCard report={duplicates} lang={lang} /> : <UpgradeNote />}

      <section className="mt-5">
        <h2 className="text-lg font-semibold">{t.provenanceTitle}</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
          <Count n={provenance.verified} label={t.srcVerified} tone="green" />
          <Count n={provenance.user_provided} label={t.srcUser} tone="slate" />
          <Count n={provenance.system_detected} label={t.srcSystem} tone="blue" />
          <Count n={provenance.needs_verification} label={t.srcNeeds} tone="amber" />
          <Count n={provenance.unknown} label={t.srcUnknown} tone="red" />
        </div>
        <ul className="mt-4 space-y-2 text-sm leading-snug text-[var(--muted)]">
          <li>
            <strong className="text-[var(--ink)]">{t.srcVerified}:</strong> {t.srcVerifiedH}
          </li>
          <li>
            <strong className="text-[var(--ink)]">{t.srcUser}:</strong> {t.srcUserH}
          </li>
          <li>
            <strong className="text-[var(--ink)]">{t.srcSystem}:</strong> {t.srcSystemH}
          </li>
          <li>
            <strong className="text-[var(--ink)]">{t.srcNeeds}:</strong> {t.srcNeedsH}
          </li>
          <li>
            <strong className="text-[var(--ink)]">{t.srcUnknown}:</strong> {t.srcUnknownH}
          </li>
        </ul>
      </section>

      {detailed ? <RiskEngine items={risks} lang={lang} /> : null}
      {detailed ? <EvidenceExplain explanation={r.aiExplanation} lang={lang} /> : null}

      <div className="mt-4 grid grid-cols-2 gap-2 print:hidden sm:grid-cols-4">
        <Count n={r.known.length} label={t.known} tone="slate" />
        <Count n={r.missing.length} label={t.missingSec} tone="amber" />
        <Count n={r.inconsistent.length} label={t.inconsistent} tone="red" />
        <Count n={r.verify.length} label={t.verify} tone="blue" />
      </div>

      {r.completeness ? (
        <section id="complete" className="mt-5 panel p-4">
          <h2 className="font-semibold">{t.completeSec}</h2>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <Count n={r.completeness.seen} label={t.seenN} tone="slate" />
            <Count n={r.completeness.missing} label={t.missN} tone="amber" />
            <Count n={r.completeness.unknown} label={t.unkN} tone="red" />
          </div>
        </section>
      ) : null}

      <ol className="mt-5 space-y-1 text-sm">
        <li>
          <a className="font-medium text-[var(--green)]" href="#share-sheet">
            {t.sheetTitle}
          </a>
        </li>
        {r.infoStatus ? (
          <li>
            <a className="font-medium text-[var(--green)]" href="#status">
              {t.infoStatusTitle}
            </a>
          </li>
        ) : null}
        {r.tokenChecklist ? (
          <li>
            <a className="font-medium text-[var(--green)]" href="#checklist">
              {t.ddChecklistTitle}
            </a>
          </li>
        ) : null}
        <li>
          <a className="font-medium text-[var(--green)]" href="#duplicates">
            {t.dupTitle}
          </a>
        </li>
        <li>
          <a className="font-medium text-[var(--green)]" href="#risk">
            {t.riskEngine}
          </a>
        </li>
        <li>
          <a className="font-medium text-[var(--green)]" href="#docs">
            1. {t.problem1}
          </a>
        </li>
        <li>
          <a className="font-medium text-[var(--green)]" href="#complete">
            2. {t.problem2}
          </a>
        </li>
        <li>
          <a className="font-medium text-[var(--green)]" href="#conflict">
            3. {t.problem3}
          </a>
        </li>
        <li>
          <a className="font-medium text-[var(--green)]" href="#ask">
            4. {t.problem4}
          </a>
        </li>
        <li>
          <a className="font-medium text-[var(--green)]" href="#verify">
            5. {t.problem5}
          </a>
        </li>
        <li>
          <a className="font-medium text-[var(--green)]" href="#lawyer">
            6. {t.problem6}
          </a>
        </li>
        <li>
          <a className="font-medium text-[var(--green)]" href="#price">
            7. {t.problem7}
          </a>
        </li>
        <li>
          <a className="font-medium text-[var(--green)]" href="#record">
            8. {t.problem8}
          </a>
        </li>
      </ol>

      <div className="mt-4 flex flex-wrap gap-2 print:hidden">
        <a className="btn-primary" href={wa} target="_blank" rel="noopener noreferrer">
          {t.share}
        </a>
        <SmsShare text={formatSmsFallback(`${origin}${shareableSheetPath(check.id, check.shareKey)}`, lang)} />
        <button type="button" className="btn-ghost" onClick={() => window.print()}>
          {t.print}
        </button>
        <button type="button" className="btn-ghost" onClick={speak}>
          {t.speakReport}
        </button>
        <button type="button" className="btn-ghost" onClick={() => void copy()}>
          {copied ? t.copied : t.copyLink}
        </button>
      </div>

      <Section icon={<IconCheck />} title={t.known} empty={t.emptyKnown} items={r.known} lang={lang} t={t} />
      <div id="docs" />
      <Section icon={<IconWarn />} title={t.missingSec} empty={t.emptyMissing} items={r.missing} lang={lang} t={t} />
      {missingDocNames(check, lang).length ? (
        <>
          <WhatsAppShare
            className="mt-3 w-full"
            text={formatMissingDocsWhatsApp(check, origin, lang)}
          />
          <SmsShare className="mt-2 w-full" text={formatSmsFallback(`${origin}/r/${check.id}`, lang)} />
        </>
      ) : null}
      <div id="conflict" />
      {consistItems.length ? (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <IconWarn /> {t.consistSec}
            <span className="text-sm font-normal text-[var(--muted)]">({consistItems.length})</span>
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{t.consistH}</p>
          <div className="mt-3 flex flex-col gap-3">
            {consistItems.map((f) => (
              <ConsistencyCard
                key={f.id}
                finding={f}
                lang={lang}
                badge={consistBadge(f, t)}
                verify={t.requiresVerify}
              />
            ))}
          </div>
        </section>
      ) : null}
      <Section
        icon={<IconWarn />}
        title={t.inconsistent}
        empty={t.emptyInc}
        items={r.inconsistent.filter((f) => !isConsistencyFinding(f))}
        lang={lang}
        t={t}
      />
      <div id="verify" />
      <Section icon={<IconOffice />} title={t.verify} empty={t.emptyVerify} items={r.verify.filter((f) => !isConsistencyFinding(f))} lang={lang} t={t} />

      <section className="mt-8" id="ask">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <IconAsk /> {t.questions}
        </h2>
        <a className="mt-2 inline-block text-sm font-semibold text-[var(--green)] print:hidden" href={wa}>
          {t.shareQ}
        </a>
        <ul className="mt-3 flex flex-col gap-3">
          {r.questions.map((q) => (
            <li key={q.id} className="panel p-4">
              <label className="flex gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 accent-[var(--green)]"
                  checked={!!asked[q.id]}
                  onChange={() => setAsked((s) => ({ ...s, [q.id]: !s[q.id] }))}
                />
                <span>
                  <SourceBadge source={q.source ?? "system_detected"} t={t} />
                  <span className="mt-1 block font-semibold leading-snug">{q.title[lang]}</span>
                  <span className="mt-1 block text-sm text-[var(--muted)]">{q.why[lang]}</span>
                  <span className="mt-2 block text-sm font-medium">{q.doNow[lang]}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <div id="lawyer" />
      <Section
        icon={<IconWarn />}
        title={t.lawyerSec}
        empty=""
        items={r.lawyer ?? []}
        lang={lang}
        t={t}
      />
      <div id="price" />
      {detailed && r.priceIntel ? <PriceIntel intel={r.priceIntel} lang={lang} /> : null}
      <Section
        icon={<IconOffice />}
        title={t.priceSec}
        empty=""
        items={r.priceCheck ?? []}
        lang={lang}
        t={t}
      />
      <div id="record" />
      <Section
        icon={<IconAsk />}
        title={t.recordSec}
        empty=""
        items={r.recordBeforeMoney ?? []}
        lang={lang}
        t={t}
      />

      <section className="mt-8 panel p-4">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <IconOffice /> {t.officesNext}
        </h2>
        <ul className="mt-3 list-disc ps-5 text-base leading-relaxed">
          {r.nextOffices.map((o, i) => (
            <li key={i}>{o[lang]}</li>
          ))}
        </ul>
        <Link href="/offices" className="mt-3 inline-block text-sm font-semibold text-[var(--green)] print:hidden">
          {t.offices}
        </Link>
      </section>

      <LegalDisclaimer className="mt-8" />

      <ReviewAsk checkId={check.id} />
      <ComplaintBox checkId={check.id} />

      <div className="mt-6 print:hidden">
        <Link href="/check" className="btn-primary inline-flex">
          {t.newCheck}
        </Link>
      </div>
      </div>
    </article>
  );
}

function identityLine(
  check: SavedCheck,
  lang: Lang,
  t: {
    viaWhatsapp: string;
    viaFacebook: string;
    viaDealer: string;
    viaFriend: string;
    viaAgent: string;
    viaSign: string;
    viaNews: string;
    viaListing: string;
    viaCommunity: string;
    viaOther: string;
  },
) {
  const a = check.answers;
  const bits = [
    a.city,
    a.area,
    a.societyName && a.societyName !== a.area ? a.societyName : "",
    a.plotNumber ? `${lang === "ur" ? "پلاٹ" : "Plot"} ${a.plotNumber}` : "",
    a.khasraNumber ? `${lang === "ur" ? "خسرہ" : "Khasra"} ${a.khasraNumber}` : "",
    formatArea(a.areaSize, a.areaUnit, lang),
    a.ownerNameOnPaper ? a.ownerNameOnPaper : "",
    a.foundVia ? viaLabel(a.foundVia, t) : "",
  ].filter(Boolean);
  const price = parsePkr(a.price);
  if (price) bits.push(formatPkr(price, lang));
  return bits.join(" · ");
}

function viaLabel(
  via: NonNullable<SavedCheck["answers"]["foundVia"]>,
  t: {
    viaWhatsapp: string;
    viaFacebook: string;
    viaDealer: string;
    viaFriend: string;
    viaAgent: string;
    viaSign: string;
    viaNews: string;
    viaListing: string;
    viaCommunity: string;
    viaOther: string;
  },
) {
  const map = {
    whatsapp: t.viaWhatsapp,
    facebook: t.viaFacebook,
    dealer: t.viaDealer,
    friend: t.viaFriend,
    agent: t.viaAgent,
    signboard: t.viaSign,
    newspaper: t.viaNews,
    listing: t.viaListing,
    community: t.viaCommunity,
    other: t.viaOther,
  };
  return map[via];
}

function emptyProvenance() {
  return { verified: 0, user_provided: 0, system_detected: 0, needs_verification: 0, unknown: 0 };
}

function SourceBadge({
  source,
  t,
}: {
  source: EvidenceSource;
  t: {
    srcVerified: string;
    srcUser: string;
    srcSystem: string;
    srcNeeds: string;
    srcUnknown: string;
  };
}) {
  const map: Record<EvidenceSource, { label: string; className: string }> = {
    verified: { label: t.srcVerified, className: "border-[var(--green)] text-[var(--green)]" },
    user_provided: { label: t.srcUser, className: "border-[var(--line)] text-[var(--muted)]" },
    system_detected: { label: t.srcSystem, className: "border-[var(--blue)] text-[var(--blue)]" },
    needs_verification: { label: t.srcNeeds, className: "border-[var(--amber)] text-[var(--amber)]" },
    unknown: { label: t.srcUnknown, className: "border-[var(--red)] text-[var(--red)]" },
  };
  const item = map[source];
  return (
    <span className={cn("inline-block rounded-[var(--radius)] border px-2 py-0.5 text-[11px] font-semibold", item.className)}>
      {item.label}
    </span>
  );
}

function VerdictBanner({
  verdict,
  headline,
  summary,
}: {
  verdict: Verdict;
  headline: string;
  summary: string;
}) {
  const tone =
    verdict === "stop"
      ? "border-[var(--red)]"
      : verdict === "wait"
        ? "border-[var(--amber)]"
        : "border-[var(--line)]";
  return (
    <div className={cn("panel border p-5", tone)}>
      <p className="text-[1.7rem] font-semibold leading-tight">{headline}</p>
      <p className="mt-3 text-base leading-relaxed">{summary}</p>
    </div>
  );
}

function Count({
  n,
  label,
  tone,
}: {
  n: number;
  label: string;
  tone: "green" | "amber" | "red" | "blue" | "slate";
}) {
  const color = {
    green: "text-[var(--green)]",
    amber: "text-[var(--amber)]",
    red: "text-[var(--red)]",
    blue: "text-[var(--blue)]",
    slate: "text-[var(--ink)]",
  }[tone];
  return (
    <div className="panel p-3">
      <p className={cn("text-2xl font-semibold tabular-nums", color)}>{n}</p>
      <p className="text-xs font-medium leading-tight text-[var(--muted)]">{label}</p>
    </div>
  );
}

function Section({
  icon,
  title,
  empty,
  items,
  lang,
  t,
}: {
  icon: React.ReactNode;
  title: string;
  empty: string;
  items: Finding[];
  lang: Lang;
  t: {
    why: string;
    doNow: string;
    srcVerified: string;
    srcUser: string;
    srcSystem: string;
    srcNeeds: string;
    srcUnknown: string;
  };
}) {
  return (
    <section className="mt-8">
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        {icon} {title}
        <span className="text-sm font-normal text-[var(--muted)]">({items.length})</span>
      </h2>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--muted)]">{empty}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {items.map((f) => (
            <li key={f.id} className="panel p-4">
              <SourceBadge source={f.source ?? "unknown"} t={t} />
              <p className="mt-2 font-semibold leading-snug">{f.title[lang]}</p>
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium text-[var(--green)]">{t.why}</summary>
                <p className="mt-2 text-sm leading-relaxed">{f.why[lang]}</p>
                <p className="mt-2 text-sm font-medium">
                  {t.doNow}: {f.doNow[lang]}
                </p>
                {f.officeHint ? (
                  <p className="mt-2 text-sm text-[var(--muted)]">{f.officeHint[lang]}</p>
                ) : null}
              </details>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ComplaintBox({ checkId }: { checkId: string }) {
  const { t } = useI18n();
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);
  if (sent) {
    return <p className="mt-6 text-sm text-[var(--muted)] print:hidden">{t.complaintThanks}</p>;
  }
  return (
    <section className="mt-8 panel p-4 print:hidden">
      <h2 className="text-lg font-semibold">{t.complaintTitle}</h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{t.complaintH}</p>
      <textarea className="field mt-3 min-h-20" value={body} onChange={(e) => setBody(e.target.value)} />
      <button
        type="button"
        className="btn-ghost mt-3 w-full"
        onClick={() => {
          if (body.trim().length < 4) return;
          void fetch("/api/complaints", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ checkId, body }),
          }).then((res) => {
            if (res.ok) setSent(true);
          });
        }}
      >
        {t.complaintSend}
      </button>
    </section>
  );
}
