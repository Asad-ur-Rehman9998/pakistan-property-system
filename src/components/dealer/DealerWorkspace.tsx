"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { PaperRead } from "@/types/check";
import type { DealerFollowUp, DealerPage, DealerPerson, DealerPersonRole, VisitPurpose } from "@/types/dealer";
import { dealerPageTitle, dealerReportStatus, publicPagePath, whatsappShareText } from "@/lib/dealer/status";
import { buildShareableSheet, formatShareableWhatsApp, shareableSheetPath } from "@/lib/share/sheet";
import { whatsappHref } from "@/lib/share/whatsapp";
import {
  formatAppointmentWhatsApp,
  formatDealerContactWhatsApp,
  formatMissingDocsWhatsApp,
  formatSmsFallback,
  missingDocNames,
} from "@/lib/share/messages";
import { WhatsAppShare, useOrigin } from "@/components/WhatsAppShare";
import { SmsShare } from "@/components/SmsShare";
import {
  addFollowUp,
  addPerson,
  addVisit,
  getDealerPage,
  loadDealerPages,
  saveDealerPage,
  subscribeDealerPages,
} from "@/lib/dealer/store";
import { getCheck, loadChecks, saveCheck, subscribeChecks } from "@/lib/storage";
import { makeSavedCheck } from "@/lib/engine/evaluate";
import { candidateFromCheck } from "@/lib/engine/duplicates";
import { PaperPhoto } from "@/components/PaperPhoto";
import { PaperReads } from "@/components/PaperReads";
import { enqueueCheck, flushQueue } from "@/lib/offline/queue";
import { sanitizeCheckForShare } from "@/lib/docai/sanitize";
import { attachShareCapability, withExistingShare } from "@/lib/share/token";
import { track } from "@/lib/analytics/client";

function pageShareKey(page: DealerPage): string | undefined {
  return page.checkId ? getCheck(page.checkId)?.shareKey : undefined;
}

const NO_PAGES: DealerPage[] = [];
const NO_CHECKS: ReturnType<typeof loadChecks> = [];

export function DealerWorkspace({ id }: { id: string }) {
  const { t } = useI18n();
  const pages = useSyncExternalStore(subscribeDealerPages, loadDealerPages, () => NO_PAGES);
  useSyncExternalStore(subscribeChecks, loadChecks, () => NO_CHECKS);
  const page = pages.find((p) => p.id === id) ?? getDealerPage(id);

  if (!page) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">{t.err}</h1>
        <Link href="/dealer" className="btn-ghost mt-4 inline-flex">
          {t.dealerBack}
        </Link>
      </div>
    );
  }

  return <Workspace page={page} />;
}

function Workspace({ page }: { page: DealerPage }) {
  const { t, lang } = useI18n();
  const origin = useOrigin();
  const check = page.checkId ? getCheck(page.checkId) : null;
  const status = dealerReportStatus(page, check);
  const loc = (x: { en: string; ur: string; roman: string }) => x[lang];
  const publicPath = publicPagePath(page, check?.shareKey);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    track("dealer_used");
  }, []);

  const openFollowUps = page.followUps.filter((f) => !f.done).length;
  const openVisits = page.visits.filter((v) => !v.done).length;

  const share = () => {
    if (!publicPath) return;
    const origin = window.location.origin;
    const text = check
      ? formatShareableWhatsApp(buildShareableSheet(check), lang, `${origin}${shareableSheetPath(check.id, check.shareKey)}`, {
          checkId: check.id,
        })
      : whatsappShareText(page, origin, lang);
    window.open(whatsappHref(text), "_blank", "noopener,noreferrer");
  };

  const copyLink = async () => {
    if (!publicPath) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${publicPath}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const publish = () => {
    if (!check) return;
    void (async () => {
      const ready = await attachShareCapability(check);
      saveCheck(ready);
      enqueueCheck(sanitizeCheckForShare(ready));
      void flushQueue(fetch, { force: true });
    })();
  };

  const onPapers = (paperReads: PaperRead[]) => {
    if (!check) return;
    const saved = makeSavedCheck(check.id, { ...check.answers, paperReads }, {
      duplicateCandidates: loadChecks().map(candidateFromCheck),
    });
    saveCheck(withExistingShare({ ...saved, createdAt: check.createdAt }, check));
  };

  return (
    <div>
      <Link href="/dealer" prefetch={false} className="text-sm font-semibold text-[var(--green)]">
        {t.dealerBack}
      </Link>
      <p className="mt-3 text-xs font-semibold tracking-wide text-[var(--muted)]">{t.notListing}</p>
      <h1 className="mt-2 text-2xl font-semibold leading-tight">{dealerPageTitle(page)}</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">{t.dealerMain}</p>
      {page.price ? (
        <p className="mt-2 text-sm text-[var(--muted)]">
          {t.price}: {page.price}
        </p>
      ) : null}

      <section className="mt-5 panel border border-[var(--amber)] p-4">
        <h2 className="text-lg font-semibold">{t.dealerTrack}</h2>
        <p className="mt-2 text-xl font-semibold">{loc(status.label)}</p>
        <p className="mt-2 text-sm leading-relaxed">{loc(status.hint)}</p>
        <p className="mt-2 text-sm font-semibold">{t.dealerNotVerified}</p>
        <p className="mt-3 text-sm">
          {t.dealerPeople}: {page.people.length} · {t.dealerVisits}: {openVisits} {t.dealerOpen} · {t.dealerFollow}: {openFollowUps}{" "}
          {t.dealerOpen}
        </p>
      </section>

      <div className="mt-4 flex flex-col gap-2">
        <Link href={`/check?intent=sell&page=${page.id}`} prefetch={false} className="btn-primary">
          {check ? t.dealerRunAgain : t.dealerRunCheck}
        </Link>
        {publicPath ? (
          <>
            <Link href={publicPath} prefetch={false} className="btn-ghost">
              {t.dealerOpenPage}
            </Link>
            <Link href={`/r/${page.checkId}/sheet`} prefetch={false} className="btn-ghost">
              {t.sheetOpen}
            </Link>
            <button type="button" className="btn-ghost" onClick={() => { publish(); void copyLink(); }}>
              {copied ? t.copied : t.dealerCopyLink}
            </button>
            <button type="button" className="btn-primary" onClick={share}>
              {t.dealerShareWa}
            </button>
            <p className="text-xs text-[var(--muted)]">{t.waOfficial}</p>
          </>
        ) : (
          <p className="text-sm text-[var(--muted)]">{t.dealerNoReportYet}</p>
        )}
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">{t.dealerDocs}</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{t.dealerDocsH}</p>
        {check ? (
          <>
            <PaperPhoto
              photoKey={`dealer-${page.id}-papers`}
              multiple
              reads={check.answers.paperReads ?? []}
              onReadsChange={onPapers}
            />
            <PaperReads
              reads={check.answers.paperReads ?? []}
              answers={check.answers}
              onAnswers={(next) => {
                const saved = makeSavedCheck(check.id, next, {
                  duplicateCandidates: loadChecks().map(candidateFromCheck),
                });
                saveCheck(withExistingShare({ ...saved, createdAt: check.createdAt }, check));
              }}
            />
            {missingDocNames(check, lang).length ? (
              <>
                <WhatsAppShare className="mt-3 w-full" text={formatMissingDocsWhatsApp(check, origin, lang)} />
                <SmsShare className="mt-2 w-full" text={formatSmsFallback(`${origin}${publicPagePath(page, check.shareKey) || `/r/${check.id}`}`, lang)} />
              </>
            ) : null}
          </>
        ) : (
          <p className="mt-2 text-sm text-[var(--muted)]">{t.dealerNoReportYet}</p>
        )}
      </section>

      <PeopleBlock page={page} />
      <VisitsBlock page={page} />
      <FollowBlock page={page} />
    </div>
  );
}

function PeopleBlock({ page }: { page: DealerPage }) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<DealerPersonRole>("buyer");
  const roles: DealerPersonRole[] = ["buyer", "seller", "owner", "other"];
  const roleLabel: Record<DealerPersonRole, string> = {
    buyer: t.roleBuyer,
    seller: t.roleSeller,
    owner: t.roleOwner,
    other: t.roleOther,
  };

  return (
    <section className="mt-8 panel p-4">
      <h2 className="text-lg font-semibold">{t.dealerPeople}</h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{t.dealerPeopleH}</p>
      <label className="mt-3 block text-sm font-semibold">
        {t.dealerPersonName}
        <input className="field mt-1" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="mt-3 block text-sm font-semibold">
        {t.dealerPersonPhone}
        <input className="field mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03xx" />
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        {roles.map((r) => (
          <button
            key={r}
            type="button"
            className={role === r ? "btn-primary min-h-11 px-3 text-sm" : "btn-ghost min-h-11 px-3 text-sm"}
            onClick={() => setRole(r)}
          >
            {roleLabel[r]}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="btn-ghost mt-3 w-full"
        onClick={() => {
          if (!name.trim()) return;
          addPerson(page, { name: name.trim(), phone: phone.trim(), role, note: "" });
          setName("");
          setPhone("");
        }}
      >
        {t.dealerAddPerson}
      </button>
      <ul className="mt-4 space-y-2">
        {page.people.map((p) => (
          <PersonRow key={p.id} page={page} person={p} />
        ))}
      </ul>
    </section>
  );
}

function PersonRow({ page, person }: { page: DealerPage; person: DealerPerson }) {
  const { t, lang } = useI18n();
  const origin = useOrigin();
  const path = publicPagePath(page, pageShareKey(page));
  const roleLabel: Record<DealerPersonRole, string> = {
    buyer: t.roleBuyer,
    seller: t.roleSeller,
    owner: t.roleOwner,
    other: t.roleOther,
  };
  const wa = () => {
    const text = whatsappShareText(page, origin || window.location.origin, lang, pageShareKey(page));
    window.open(whatsappHref(text, person.phone), "_blank", "noopener,noreferrer");
  };
  return (
    <li className="rounded-xl border border-[var(--line)] p-3">
      <p className="font-semibold">{person.name}</p>
      <p className="text-sm text-[var(--muted)]">
        {roleLabel[person.role]}
        {person.phone ? ` · ${person.phone}` : ""}
      </p>
      <div className="mt-2 flex flex-col gap-2">
        <WhatsAppShare text={formatDealerContactWhatsApp(person, lang)} />
        {path ? (
          <button type="button" className="text-sm font-semibold text-[var(--green)]" onClick={wa}>
            {t.dealerWhatsappPerson}
          </button>
        ) : null}
      </div>
    </li>
  );
}

function VisitsBlock({ page }: { page: DealerPage }) {
  const { t, lang } = useI18n();
  const origin = useOrigin();
  const [when, setWhen] = useState("");
  const [purpose, setPurpose] = useState<VisitPurpose>("see_property");
  const purposes: VisitPurpose[] = ["see_property", "see_papers", "office"];
  const labels: Record<VisitPurpose, string> = {
    see_property: t.visitSee,
    see_papers: t.visitPapers,
    office: t.visitOffice,
  };
  return (
    <section className="mt-5 panel p-4">
      <h2 className="text-lg font-semibold">{t.dealerVisits}</h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{t.dealerVisitsH}</p>
      <input className="field mt-3" type="date" value={when} onChange={(e) => setWhen(e.target.value)} />
      <div className="mt-3 flex flex-wrap gap-2">
        {purposes.map((p) => (
          <button
            key={p}
            type="button"
            className={purpose === p ? "btn-primary min-h-11 px-3 text-sm" : "btn-ghost min-h-11 px-3 text-sm"}
            onClick={() => setPurpose(p)}
          >
            {labels[p]}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="btn-ghost mt-3 w-full"
        onClick={() => {
          if (!when) return;
          addVisit(page, { personId: "", when, purpose, done: false });
          setWhen("");
        }}
      >
        {t.dealerAddVisit}
      </button>
      <ul className="mt-4 space-y-2">
        {page.visits.map((v) => (
          <li key={v.id} className="flex flex-col gap-2 rounded-xl border border-[var(--line)] p-3">
            <div className="flex items-center justify-between gap-2">
              <span>
                <span className="font-semibold">{v.when}</span>
                <span className="mt-1 block text-sm text-[var(--muted)]">{labels[v.purpose]}</span>
              </span>
              <button
                type="button"
                className="text-sm font-semibold text-[var(--green)]"
                onClick={() =>
                  saveDealerPage({
                    ...page,
                    visits: page.visits.map((x) => (x.id === v.id ? { ...x, done: !x.done } : x)),
                  })
                }
              >
                {v.done ? t.dealerDone : t.dealerMarkDone}
              </button>
            </div>
            <WhatsAppShare
              text={formatAppointmentWhatsApp({ page, visit: v, origin, lang, shareKey: pageShareKey(page) })}
            />
            {publicPagePath(page, pageShareKey(page)) ? (
              <SmsShare text={formatSmsFallback(`${origin}${publicPagePath(page, pageShareKey(page))}`, lang)} />
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function FollowBlock({ page }: { page: DealerPage }) {
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  return (
    <section className="mt-5 panel p-4">
      <h2 className="text-lg font-semibold">{t.dealerFollow}</h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{t.dealerFollowH}</p>
      <input className="field mt-3" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t.dealerFollowWhat} />
      <input className="field mt-2" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
      <button
        type="button"
        className="btn-ghost mt-3 w-full"
        onClick={() => {
          if (!title.trim()) return;
          addFollowUp(page, { title: title.trim(), due, done: false });
          setTitle("");
          setDue("");
        }}
      >
        {t.dealerAddFollow}
      </button>
      <ul className="mt-4 space-y-2">
        {page.followUps.map((f: DealerFollowUp) => (
          <li key={f.id} className="flex items-center justify-between gap-2 rounded-xl border border-[var(--line)] p-3">
            <span>
              <span className="font-semibold">{f.title}</span>
              {f.due ? <span className="mt-1 block text-sm text-[var(--muted)]">{f.due}</span> : null}
            </span>
            <button
              type="button"
              className="text-sm font-semibold text-[var(--green)]"
              onClick={() =>
                saveDealerPage({
                  ...page,
                  followUps: page.followUps.map((x) => (x.id === f.id ? { ...x, done: !x.done } : x)),
                })
              }
            >
              {f.done ? t.dealerDone : t.dealerMarkDone}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
