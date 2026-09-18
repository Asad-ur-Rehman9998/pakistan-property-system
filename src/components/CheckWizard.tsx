"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import type { BuyerLocation, CheckAnswers, ChecklistMark, Counterparty, FoundVia, Intent, LocationMethod, PropertyKind, TokenChecklistId, TriState } from "@/types/check";
import { TOKEN_CHECKLIST_IDS, emptyAnswers } from "@/types/check";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { areaUnits, formatArea } from "@/lib/pakistan/area";
import { parsePkr, rupeesGrouped, croreLakhPhrase } from "@/lib/pakistan/money";
import { documentsFor, flagDefs } from "@/lib/engine/documents";
import { makeSavedCheck } from "@/lib/engine/evaluate";
import { candidateFromCheck } from "@/lib/engine/duplicates";
import { firstUnfilledIndex, isOptionalStep, stepRequired, wizardPath } from "@/lib/engine/wizard";
import { TOKEN_CHECKLIST, checklistDef, isTokenChecklistKey } from "@/lib/engine/tokenChecklist";
import { newCheckId } from "@/lib/id";
import { clearDraft, loadChecks, loadDraft, saveCheck, saveDraft, subscribeDraft } from "@/lib/storage";
import { answersFromDealerPage, attachCheckToDealerPage, createPageFromCheckId, getDealerPage } from "@/lib/dealer/store";
import { enqueueCheck, flushQueue } from "@/lib/offline/queue";
import { sanitizeCheckForShare } from "@/lib/docai/sanitize";
import { attachShareCapability, reportSharePath } from "@/lib/share/token";
import { bindDraftPhotosToCheck } from "@/lib/docai/bindPhotos";
import { deletePhotosByPrefix, DRAFT_PHOTO_PREFIX } from "@/lib/offline/photos";
import { useLowBandwidth } from "@/components/LowBwToggle";
import { PaperPhoto } from "@/components/PaperPhoto";
import { PaperReads } from "@/components/PaperReads";
import { PlaceSearch, MapLocate } from "@/components/LocationPickers";
import { cn } from "@/lib/cn";
import { logClientError } from "@/lib/errors/log";
import { track } from "@/lib/analytics/client";
import { SyncStatus } from "./SyncStatus";
import { BigChoice, TokenMarks, TriButtons } from "./BigChoice";
import { IconCoin, IconHouse, IconKey, IconLand, IconMic } from "./icons";
import { TermHint } from "./TermHint";
import type { VoiceSeed } from "@/lib/voice/seed";
import { listenOnce } from "@/lib/voice/speech";

type Draft = { cursor: number; answers: CheckAnswers };

const NO_DRAFT: Draft | null = null;

function emptyDraft(initialIntent?: Intent, initialAbroad?: boolean): Draft {
  const answers = {
    ...emptyAnswers(),
    intent: initialIntent ?? null,
    buyerLocation: initialAbroad ? ("abroad" as const) : null,
  };
  return { cursor: firstUnfilledIndex(answers), answers };
}

function readDraft(): Draft | null {
  return loadDraft<Draft | null>(null);
}

function getServerDraft(): Draft | null {
  return NO_DRAFT;
}

function applyHasDocs(answers: CheckAnswers, value: TriState): CheckAnswers {
  const next: CheckAnswers = { ...answers, hasDocuments: value };
  if (value === "no") {
    const documents = { ...answers.documents };
    for (const d of documentsFor(answers)) documents[d.id] = "missing";
    next.documents = documents;
    next.paperReads = [];
  }
  return next;
}

function applyKind(answers: CheckAnswers, kind: PropertyKind): CheckAnswers {
  const next: CheckAnswers = {
    ...answers,
    propertyKind: kind,
    isSocietyFile: kind === "plot" ? null : kind === "file" ? true : null,
  };
  if (kind === "agri") next.settlement = "rural";
  else if (kind === "flat" || kind === "shop" || kind === "industrial" || kind === "file") next.settlement = "urban";
  return next;
}

export function CheckWizard({
  initialIntent,
  initialAbroad,
  dealerPageId,
  fromDealer,
  voiceSeed,
}: {
  initialIntent?: Intent;
  initialAbroad?: boolean;
  dealerPageId?: string | null;
  fromDealer?: boolean;
  voiceSeed?: VoiceSeed | null;
}) {
  const { t, lang } = useI18n();
  const { on: lowBw } = useLowBandwidth();
  const router = useRouter();
  const stored = useSyncExternalStore(subscribeDraft, readDraft, getServerDraft);
  const [session, setSession] = useState<Draft | null>(null);
  const [draftWriteOk, setDraftWriteOk] = useState(true);
  const [finishErr, setFinishErr] = useState(false);
  const dealerFlow = !!(dealerPageId || fromDealer);
  const voiceFlow = !!voiceSeed;
  const seedKey = voiceSeed
    ? `${voiceSeed.intent ?? ""}|${voiceSeed.kind ?? ""}|${voiceSeed.size ?? ""}|${voiceSeed.unit ?? ""}|${voiceSeed.abroad ? "1" : ""}`
    : "";

  useEffect(() => {
    if (!dealerPageId) return;
    const p = getDealerPage(dealerPageId);
    if (!p) return;
    setSession({
      cursor: 1,
      answers: { ...answersFromDealerPage(p), intent: initialIntent ?? "sell" },
    });
  }, [dealerPageId, initialIntent]);

  useEffect(() => {
    if (!voiceFlow || dealerFlow) return;
    const [intentRaw, kindRaw, size, unitRaw] = seedKey.split("|");
    const intent = intentRaw === "buy" || intentRaw === "sell" || intentRaw === "rent" || intentRaw === "token"
      ? intentRaw
      : initialIntent ?? null;
    const kind =
      kindRaw === "house" ||
      kindRaw === "plot" ||
      kindRaw === "flat" ||
      kindRaw === "shop" ||
      kindRaw === "agri" ||
      kindRaw === "industrial" ||
      kindRaw === "file"
        ? kindRaw
        : null;
    const unit =
      unitRaw === "marla" ||
      unitRaw === "kanal" ||
      unitRaw === "sqyd" ||
      unitRaw === "sqft" ||
      unitRaw === "acre"
        ? unitRaw
        : null;
    let answers = { ...emptyAnswers(), intent };
    if (kind) answers = applyKind(answers, kind);
    if (size) answers = { ...answers, areaSize: size };
    if (unit) answers = { ...answers, areaUnit: unit };
    if (voiceSeed?.abroad || initialAbroad) answers = { ...answers, buyerLocation: "abroad" };
    setSession({ cursor: firstUnfilledIndex(answers), answers });
  }, [voiceFlow, dealerFlow, seedKey, initialIntent, initialAbroad, voiceSeed?.abroad]);

  const base = session ?? (dealerFlow || voiceFlow ? emptyDraft(initialIntent ?? (dealerFlow ? "sell" : undefined), initialAbroad) : stored) ?? emptyDraft(initialIntent, initialAbroad);
  const answers: CheckAnswers = useMemo(() => {
    const raw = initialIntent ? { ...base.answers, intent: initialIntent } : base.answers;
    const located = initialAbroad ? { ...raw, buyerLocation: "abroad" as const } : raw;
    return {
      ...located,
      tokenChecklist: located.tokenChecklist ?? {},
      paperReads: located.paperReads ?? [],
      buyerLocation: located.buyerLocation ?? null,
      representativeName: located.representativeName ?? "",
      representativeRelation: located.representativeRelation ?? "",
      representativePoa: located.representativePoa ?? null,
    };
  }, [base.answers, initialIntent, initialAbroad]);
  const path = useMemo(() => wizardPath(answers), [answers]);
  const cursor = Math.min(Math.max(0, typeof base.cursor === "number" ? base.cursor : 0), path.length - 1);
  const key = path[cursor];
  const total = path.length;
  const completedRef = useRef(false);
  const lastStepRef = useRef(String(key || "intent"));
  const tokenFeat = useRef(false);
  const overseasFeat = useRef(false);
  const offlineFeat = useRef(false);

  const persist = (next: Draft) => {
    setSession(next);
    if (!dealerFlow) {
      const ok = saveDraft(next);
      setDraftWriteOk(ok);
      if (ok && typeof navigator !== "undefined" && navigator.onLine === false && !offlineFeat.current) {
        offlineFeat.current = true;
        track("feature", { feature: "offline" });
      }
    }
  };
  const setAnswers = (next: CheckAnswers) => persist({ cursor, answers: next });
  const setCursor = (update: number | ((c: number) => number)) => {
    const nextCursor = typeof update === "function" ? update(cursor) : update;
    persist({ cursor: Math.max(0, Math.min(nextCursor, wizardPath(answers).length - 1)), answers });
  };

  const docs = useMemo(() => documentsFor(answers), [answers]);
  const flags = useMemo(() => flagDefs(answers), [answers]);
  const loc = (x: { en: string; ur: string; roman: string }) => x[lang];
  const rural = answers.settlement === "rural" || answers.propertyKind === "agri";

  const kinds: { id: PropertyKind; title: string; emoji: string }[] = [
    { id: "house", title: t.house, emoji: "🏠" },
    { id: "flat", title: t.flat, emoji: "🏢" },
    { id: "plot", title: t.plot, emoji: "🌳" },
    { id: "shop", title: t.shop, emoji: "🏪" },
    { id: "agri", title: t.agri, emoji: "🌾" },
    { id: "industrial", title: t.industrial, emoji: "🏭" },
  ];

  const canNext = stepRequired(key, answers);

  useEffect(() => {
    track("check_started", { intent: answers.intent });
    if (!dealerFlow) track("feature", { feature: "guest_check" });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- once per wizard mount

  useEffect(() => {
    lastStepRef.current = String(key || "intent");
  }, [key]);

  useEffect(() => {
    if (answers.intent === "token" && !tokenFeat.current) {
      tokenFeat.current = true;
      track("feature", { feature: "token" });
    }
    if (answers.buyerLocation === "abroad" && !overseasFeat.current) {
      overseasFeat.current = true;
      track("feature", { feature: "overseas" });
    }
  }, [answers.intent, answers.buyerLocation]);

  useEffect(() => {
    const onHide = () => {
      if (completedRef.current) return;
      track("drop_off", { step: lastStepRef.current, intent: answers.intent });
    };
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, [answers.intent]);

  const next = () => {
    if (cursor < path.length - 1) setCursor((c) => c + 1);
    else finish();
  };

  const finish = () => {
    const id = newCheckId();
    void (async () => {
      try {
        setFinishErr(false);
        const paperReads = await bindDraftPhotosToCheck(id, answers.paperReads ?? []);
        const saved = await attachShareCapability(
          makeSavedCheck(id, { ...answers, paperReads }, {
            duplicateCandidates: loadChecks().map(candidateFromCheck),
          }),
        );
        const kept = saveCheck(saved);
        if (!kept) {
          saveDraft({ cursor, answers: { ...answers, paperReads } });
          setDraftWriteOk(false);
          return;
        }
        let dealerDest = dealerPageId || null;
        if (dealerPageId) {
          const attached = attachCheckToDealerPage(dealerPageId, saved.id);
          if (!attached) dealerDest = createPageFromCheckId(saved.id, saved.answers).id;
        } else if (fromDealer) {
          dealerDest = createPageFromCheckId(saved.id, saved.answers).id;
        }
        clearDraft();
        enqueueCheck(sanitizeCheckForShare(saved));
        completedRef.current = true;
        track("check_completed", { intent: saved.answers.intent });
        track("report_generated", { intent: saved.answers.intent });
        if (dealerDest) track("dealer_used");
        void flushQueue(fetch, { force: true });
        router.push(dealerDest ? `/dealer/${dealerDest}` : reportSharePath(id, saved.shareKey));
      } catch (err) {
        logClientError(err);
        saveDraft({ cursor, answers });
        setDraftWriteOk(true);
        setFinishErr(true);
      }
    })();
  };

  const docId = key.startsWith("doc:") ? key.slice(4) : null;
  const flagId = key.startsWith("flag:") ? key.slice(5) : null;
  const currentDoc = docId ? docs.find((d) => d.id === docId) : undefined;
  const currentFlag = flagId ? flags.find((f) => f.id === flagId) : undefined;

  return (
    <div>
      <div className="mb-5">
        <p
          className={cn(
            "font-semibold",
            lowBw ? "text-lg leading-snug" : "text-xs uppercase tracking-wide text-[var(--muted)]",
          )}
        >
          {t.step} {cursor + 1} {t.of} {total}
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">{t.oneQuestion}</p>
        <div
          id="wizard-progress"
          className={cn("mt-2 overflow-hidden rounded-full bg-[var(--line)]", lowBw ? "h-3" : "h-1.5")}
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={cursor + 1}
          aria-label={`${t.step} ${cursor + 1} ${t.of} ${total}`}
        >
          <div
            className="h-full rounded-full bg-[var(--green)]"
            style={{ width: `${((cursor + 1) / total) * 100}%` }}
          />
        </div>
        {cursor === 0 ? <p className="mt-2 text-sm text-[var(--muted)]">{t.guestOk}</p> : null}
        {voiceFlow && (answers.propertyKind || answers.areaSize) ? (
          <p className="mt-2 rounded-xl bg-[var(--green-soft)] px-3 py-2 text-sm font-semibold text-[var(--green-deep)]">
            {t.voiceFilled}{" "}
            {[
              kinds.find((k) => k.id === answers.propertyKind)?.title,
              formatArea(answers.areaSize, answers.areaUnit, lang),
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        ) : null}
        {answers.intent === "token" ? (
          <p className="mt-2 rounded-xl bg-[var(--green-soft)] px-3 py-2 text-sm font-semibold text-[var(--green-deep)]">
            {t.tokenMode}
          </p>
        ) : null}
        <SyncStatus />
        {draftWriteOk ? null : (
          <p className="mt-1 text-sm font-semibold text-[var(--red)]">{t.draftSaveFailed}</p>
        )}
        {finishErr ? <p className="mt-1 text-sm font-semibold text-[var(--red)]">{t.err}</p> : null}
      </div>

      {key === "intent" && (
        <Screen title={t.intentQ} hint={t.intentH}>
          <BigChoice selected={answers.intent === "buy"} onClick={() => setAnswers({ ...answers, intent: "buy" })} title={t.buy} hint={t.buyH} icon={<IconHouse />} />
          <BigChoice selected={answers.intent === "sell"} onClick={() => setAnswers({ ...answers, intent: "sell" })} title={t.sell} hint={t.sellH} icon={<IconKey />} />
          <BigChoice selected={answers.intent === "rent"} onClick={() => setAnswers({ ...answers, intent: "rent" })} title={t.rent} hint={t.rentH} icon={<IconHouse />} />
          <BigChoice selected={answers.intent === "token"} onClick={() => setAnswers({ ...answers, intent: "token" })} title={t.token} hint={t.tokenH} icon={<IconCoin />} />
        </Screen>
      )}

      {key === "whereYouAre" && (
        <Screen title={t.whereYouAreQ} hint={t.whereYouAreH}>
          {(
            [
              ["pakistan", t.wherePakistan, t.wherePakistanH],
              ["abroad", t.whereAbroad, t.whereAbroadH],
            ] as [BuyerLocation, string, string][]
          ).map(([id, title, hint]) => (
            <BigChoice
              key={id}
              selected={answers.buyerLocation === id}
              onClick={() => setAnswers({ ...answers, buyerLocation: id })}
              title={title}
              hint={hint}
            />
          ))}
        </Screen>
      )}

      {key === "kind" && (
        <Screen title={t.kindQ} hint={t.kindH}>
          {kinds.map((k) => (
            <BigChoice
              key={k.id}
              selected={answers.propertyKind === k.id || (k.id === "plot" && answers.propertyKind === "file")}
              onClick={() => setAnswers(applyKind(answers, k.id))}
              title={k.title}
              icon={<span className="text-2xl leading-none" aria-hidden>{k.emoji}</span>}
            />
          ))}
        </Screen>
      )}

      {key === "fileAsk" && (
        <Screen title={t.fileAskQ} hint={t.fileAskH}>
          <TermHint id="file" />
          <BigChoice
            selected={answers.isSocietyFile === true}
            onClick={() => setAnswers({ ...answers, isSocietyFile: true, propertyKind: "file", settlement: "urban" })}
            title={t.fileYes}
          />
          <BigChoice
            selected={answers.isSocietyFile === false}
            onClick={() => setAnswers({ ...answers, isSocietyFile: false, propertyKind: "plot" })}
            title={t.fileNo}
          />
        </Screen>
      )}

      {key === "settle" && (
        <Screen title={t.settleQ} hint={t.settleH}>
          <BigChoice selected={answers.settlement === "urban"} onClick={() => setAnswers({ ...answers, settlement: "urban" })} title={t.urban} hint={t.urbanH} icon={<IconHouse />} />
          <BigChoice selected={answers.settlement === "rural"} onClick={() => setAnswers({ ...answers, settlement: "rural" })} title={t.rural} hint={t.ruralH} icon={<IconLand />} />
        </Screen>
      )}

      {key === "locateHow" && (
        <Screen title={t.locateQ} hint={t.locateH}>
          {(
            [
              ["search", t.locateSearch, "🔎"],
              ["map", t.locateMap, "🗺️"],
              ["manual", t.locateManual, "✍️"],
            ] as [LocationMethod, string, string][]
          ).map(([id, title, emoji]) => (
            <BigChoice
              key={id}
              selected={answers.locationMethod === id}
              onClick={() => setAnswers({ ...answers, locationMethod: id })}
              title={title}
              icon={<span className="text-2xl leading-none" aria-hidden>{emoji}</span>}
            />
          ))}
        </Screen>
      )}

      {key === "locateSearch" && (
        <Screen title={t.locateSearch} hint={t.searchPh}>
          <PlaceSearch answers={answers} onChange={setAnswers} />
        </Screen>
      )}

      {key === "locateMap" && (
        <Screen title={t.locateMap} hint={t.geoH}>
          <MapLocate answers={answers} onChange={setAnswers} />
        </Screen>
      )}

      {key === "district" && (
        <Screen title={t.districtQ} hint={t.districtH}>
          <input
            className="field"
            placeholder={t.districtPh}
            value={answers.district}
            onChange={(e) => setAnswers({ ...answers, district: e.target.value })}
          />
        </Screen>
      )}

      {key === "tehsil" && (
        <Screen title={t.tehsilQ} hint={t.skipUnknown}>
          <input
            className="field"
            placeholder={t.tehsilPh}
            value={answers.tehsil}
            onChange={(e) => setAnswers({ ...answers, tehsil: e.target.value })}
          />
        </Screen>
      )}

      {key === "village" && (
        <Screen title={t.villageQ} hint={t.villageH}>
          <TermHint id="mouza" />
          <input
            className="field"
            placeholder={t.villagePh}
            value={answers.village}
            onChange={(e) => setAnswers({ ...answers, village: e.target.value, area: answers.area || e.target.value })}
          />
        </Screen>
      )}

      {key === "area" && (
        <Screen title={t.areaQ} hint={t.areaLocH}>
          <input
            className="field"
            placeholder={t.areaPh}
            value={answers.area}
            onChange={(e) => setAnswers({ ...answers, area: e.target.value })}
          />
        </Screen>
      )}

      {key === "society" && (
        <Screen title={t.societyQ} hint={t.localityH}>
          <TermHint id="society" />
          <input
            className="field"
            placeholder={t.societyNamePh}
            value={answers.societyName}
            onChange={(e) => setAnswers({ ...answers, societyName: e.target.value, area: answers.area || e.target.value })}
          />
        </Screen>
      )}

      {key === "identity" && (
        <Screen title={t.identityQ} hint={t.identityH}>
          <TermHint id={rural ? "khasra" : "plot"} />
          <input
            className="field"
            placeholder={rural ? t.khasraNoPh : t.plotNoPh}
            value={rural ? answers.khasraNumber : answers.plotNumber}
            onChange={(e) =>
              setAnswers(rural ? { ...answers, khasraNumber: e.target.value } : { ...answers, plotNumber: e.target.value })
            }
          />
        </Screen>
      )}

      {key === "size" && (
        <Screen title={t.sizeQ} hint={t.sizeH}>
          <input
            className="field"
            inputMode="decimal"
            placeholder={t.areaSizePh}
            value={answers.areaSize}
            onChange={(e) => setAnswers({ ...answers, areaSize: e.target.value })}
          />
          <div className="flex flex-wrap gap-2">
            {areaUnits.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => setAnswers({ ...answers, areaUnit: u.id })}
                className={cn(
                  "min-h-11 rounded-[var(--radius)] border px-3 text-sm font-semibold",
                  answers.areaUnit === u.id
                    ? "border-[var(--green)] bg-[var(--green-soft)]"
                    : "border-[var(--line)] bg-[var(--paper-2)]",
                )}
              >
                {loc(u.label)}
              </button>
            ))}
          </div>
          {answers.areaUnit ? <TermHint id={answers.areaUnit === "sqyd" ? "sqyd" : answers.areaUnit} /> : (
            <p className="text-sm text-[var(--muted)]">{t.unitHint}</p>
          )}
        </Screen>
      )}

      {key === "party" && (
        <Screen title={t.partyQ} hint={t.partyH}>
          {(
            [
              ["owner", t.owner, t.ownerH],
              ["agent", t.agent, t.agentH],
              ["relative", t.relative, t.relativeH],
              ["builder", t.builder, t.builderH],
              ["poa", t.poa, t.poaH],
              ["unknown", t.unknown, t.unknownH],
            ] as [Counterparty, string, string][]
          ).map(([id, title, hint]) => (
            <BigChoice key={id} selected={answers.counterparty === id} onClick={() => setAnswers({ ...answers, counterparty: id })} title={title} hint={hint} />
          ))}
        </Screen>
      )}

      {key === "foundVia" && (
        <Screen title={t.foundViaQ} hint={t.foundViaH}>
          {(
            [
              ["whatsapp", t.viaWhatsapp],
              ["facebook", t.viaFacebook],
              ["dealer", t.viaDealer],
              ["friend", t.viaFriend],
              ["agent", t.viaAgent],
              ["signboard", t.viaSign],
              ["newspaper", t.viaNews],
              ["listing", t.viaListing],
              ["community", t.viaCommunity],
              ["other", t.viaOther],
            ] as [FoundVia, string][]
          ).map(([id, label]) => (
            <BigChoice key={id} selected={answers.foundVia === id} onClick={() => setAnswers({ ...answers, foundVia: id })} title={label} />
          ))}
        </Screen>
      )}

      {key === "owner" && (
        <Screen title={t.ownerOnPaper} hint={t.ownerOnPaperPh}>
          <TermHint id="ownership" />
          <input
            className="field"
            placeholder={t.ownerOnPaperPh}
            value={answers.ownerNameOnPaper}
            onChange={(e) => setAnswers({ ...answers, ownerNameOnPaper: e.target.value })}
            autoComplete="off"
          />
        </Screen>
      )}

      {currentDoc && (
        <Screen title={loc(currentDoc.title)} hint={t.onePaperH}>
          <p className="text-sm leading-relaxed text-[var(--muted)]">{loc(currentDoc.hint)}</p>
          {currentDoc.termId ? <TermHint id={currentDoc.termId} /> : null}
          <div className="mt-2 flex flex-col gap-2">
            {(["have", "missing", "unsure"] as const).map((s) => (
              <BigChoice
                key={s}
                selected={answers.documents[currentDoc.id] === s}
                onClick={() => setAnswers({ ...answers, documents: { ...answers.documents, [currentDoc.id]: s } })}
                title={s === "have" ? t.have : s === "missing" ? t.missing : t.unsure}
              />
            ))}
          </div>
        </Screen>
      )}

      {currentFlag && (
        <Screen title={loc(currentFlag.title)} hint={loc(currentFlag.hint)}>
          {currentFlag.termId ? <TermHint id={currentFlag.termId} /> : null}
          <TriButtons
            value={answers.flags[currentFlag.id]}
            onChange={(v) => setAnswers({ ...answers, flags: { ...answers.flags, [currentFlag.id]: v } })}
            yes={t.yes}
            no={t.no}
            unsure={t.notSure}
          />
        </Screen>
      )}

      {key === "price" && (
        <Screen title={t.askingQ} hint={t.askingH}>
          <TermHint id="pkr" />
          <input
            className="field"
            value={answers.price}
            onChange={(e) => setAnswers({ ...answers, price: e.target.value })}
            placeholder={t.askingPh}
            autoComplete="off"
          />
          <MoneyPreview raw={answers.price} lang={lang} />
        </Screen>
      )}

      {key === "hasDocs" && (
        <Screen title={t.hasDocsQ} hint={t.hasDocsH}>
          <BigChoice selected={answers.hasDocuments === "yes"} onClick={() => setAnswers(applyHasDocs(answers, "yes"))} title={t.yes} />
          <BigChoice
            selected={answers.hasDocuments === "no"}
            onClick={() => {
              setAnswers(applyHasDocs(answers, "no"));
              void deletePhotosByPrefix(DRAFT_PHOTO_PREFIX);
            }}
            title={t.no}
          />
          <BigChoice selected={answers.hasDocuments === "unsure"} onClick={() => setAnswers(applyHasDocs(answers, "unsure"))} title={t.notSure} />
        </Screen>
      )}

      {key === "upload" && (
        <Screen title={t.uploadQ} hint={t.uploadH}>
          <PaperPhoto
            photoKey="draft-papers"
            multiple
            reads={answers.paperReads ?? []}
            onReadsChange={(paperReads) => setAnswers({ ...answers, paperReads })}
          />
        </Screen>
      )}

      {key === "paperReview" && (
        <Screen title={t.paperReviewQ} hint={t.paperReviewH}>
          <PaperReads
            reads={answers.paperReads ?? []}
            answers={answers}
            onAnswers={setAnswers}
          />
        </Screen>
      )}

      {key === "tokenIntro" && (
        <Screen title={t.tokenIntroQ} hint={t.tokenIntroH}>
          <ol className="space-y-2 panel p-4">
            {TOKEN_CHECKLIST.map((item, i) => (
              <li key={item.id} className="text-base leading-snug">
                <span className="font-semibold text-[var(--muted)]">{i + 1}.</span> {item.title[lang]}
              </li>
            ))}
          </ol>
        </Screen>
      )}

      {isTokenChecklistKey(key) && (
        <Screen
          title={`${TOKEN_CHECKLIST_IDS.indexOf(key.slice(3) as TokenChecklistId) + 1}. ${checklistDef(key.slice(3) as TokenChecklistId).title[lang]}`}
          hint={checklistDef(key.slice(3) as TokenChecklistId).hint[lang]}
        >
          <TokenMarks
            value={answers.tokenChecklist[key.slice(3) as TokenChecklistId]}
            onChange={(mark: ChecklistMark) =>
              setAnswers({
                ...answers,
                tokenChecklist: { ...answers.tokenChecklist, [key.slice(3)]: mark },
              })
            }
            confirmed={t.ddMarkConfirmed}
            verify={t.ddMarkVerify}
            missing={t.ddMarkMissing}
            na={t.ddMarkNa}
          />
        </Screen>
      )}

      {key === "token" && (
        <Screen title={t.tokenOnlyQ} hint={t.moneyH}>
          <TermHint id="bayana" />
          <input
            className="field"
            value={answers.tokenAmount}
            onChange={(e) => setAnswers({ ...answers, tokenAmount: e.target.value })}
            placeholder={t.tokenPh}
            autoComplete="off"
          />
          <MoneyPreview raw={answers.tokenAmount} lang={lang} />
        </Screen>
      )}

      {key === "remoteVerify" && (
        <Screen title={t.remoteVerifyQ} hint={t.remoteVerifyH}>
          <p className="text-sm font-semibold">{t.remoteVideo}</p>
          <TriButtons
            value={answers.flags.remote_video_owner}
            onChange={(v) => setAnswers({ ...answers, flags: { ...answers.flags, remote_video_owner: v } })}
            yes={t.yes}
            no={t.no}
            unsure={t.notSure}
          />
          <p className="mt-4 text-sm font-semibold">{t.remotePapers}</p>
          <TriButtons
            value={answers.flags.remote_papers}
            onChange={(v) => setAnswers({ ...answers, flags: { ...answers.flags, remote_papers: v } })}
            yes={t.yes}
            no={t.no}
            unsure={t.notSure}
          />
          <p className="mt-4 text-sm font-semibold">{t.remoteVisit}</p>
          <TriButtons
            value={answers.flags.remote_local_visit}
            onChange={(v) => setAnswers({ ...answers, flags: { ...answers.flags, remote_local_visit: v } })}
            yes={t.yes}
            no={t.no}
            unsure={t.notSure}
          />
        </Screen>
      )}

      {key === "overseasReview" && (
        <Screen title={t.overseasReviewQ} hint={t.overseasReviewH}>
          <BigChoice
            selected={answers.flags.overseas_want_review === "yes"}
            onClick={() => setAnswers({ ...answers, flags: { ...answers.flags, overseas_want_review: "yes" } })}
            title={t.reviewWant}
          />
          <BigChoice
            selected={answers.flags.overseas_want_review === "no"}
            onClick={() => setAnswers({ ...answers, flags: { ...answers.flags, overseas_want_review: "no" } })}
            title={t.reviewLater}
          />
        </Screen>
      )}

      {key === "representative" && (
        <Screen title={t.representativeQ} hint={t.representativeH}>
          <input
            className="field"
            value={answers.representativeName}
            onChange={(e) => setAnswers({ ...answers, representativeName: e.target.value })}
            placeholder={t.representativeNamePh}
            autoComplete="name"
          />
          <input
            className="mt-3 field"
            value={answers.representativeRelation}
            onChange={(e) => setAnswers({ ...answers, representativeRelation: e.target.value })}
            placeholder={t.representativeRelationPh}
            autoComplete="off"
          />
          <p className="mt-4 text-sm font-semibold">{t.representativePoaQ}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">{t.representativePoaH}</p>
          <TriButtons
            value={answers.representativePoa ?? undefined}
            onChange={(v) => setAnswers({ ...answers, representativePoa: v })}
            yes={t.yes}
            no={t.no}
            unsure={t.notSure}
          />
        </Screen>
      )}

      {key === "notes" && (
        <Screen title={t.notesQ} hint={t.notesH}>
          <NotesField
            value={answers.notes}
            onChange={(notes) => setAnswers({ ...answers, notes })}
            t={t}
            lang={lang}
          />
        </Screen>
      )}

      <div className="fixed inset-x-0 bottom-[5.25rem] z-20 mx-auto flex w-full max-w-lg gap-2 bg-[var(--paper)] px-4 py-3 print:hidden md:static md:bottom-auto md:mt-8 md:max-w-none md:px-0">
        {cursor > 0 ? (
          <button type="button" className="btn-ghost flex-1" onClick={() => setCursor((c) => c - 1)}>
            {t.back}
          </button>
        ) : (
          <button type="button" className="btn-ghost flex-1" onClick={() => router.push("/")}>
            {t.home}
          </button>
        )}
        <button type="button" className="btn-primary flex-[2]" onClick={next} disabled={!canNext}>
          {key === "notes" ? (answers.intent === "token" ? t.ddGenerate : t.generate) : isOptionalStep(key) ? `${t.continue} / ${t.skip}` : t.continue}
        </button>
      </div>
    </div>
  );
}

function Screen({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 pb-44 md:pb-28">
      <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight">{title}</h1>
      {hint ? <p className="text-base leading-relaxed text-[var(--muted)]">{hint}</p> : null}
      {children}
    </section>
  );
}

function MoneyPreview({ raw, lang }: { raw: string; lang: "en" | "ur" | "roman" }) {
  const n = parsePkr(raw);
  if (!n) return null;
  return (
    <div className="panel px-4 py-3">
      <p className="text-lg font-semibold">{rupeesGrouped(n, lang)}</p>
      <p className="mt-1 text-base text-[var(--green-deep)]">{croreLakhPhrase(n, lang)}</p>
    </div>
  );
}

function NotesField({
  value,
  onChange,
  t,
  lang,
}: {
  value: string;
  onChange: (v: string) => void;
  t: { voice: string; voiceStop: string; notesPh: string };
  lang: string;
}) {
  const [listening, setListening] = useState(false);

  const speak = async () => {
    if (listening) return;
    setListening(true);
    try {
      const said = await listenOnce(lang === "ur" ? "ur" : lang === "en" ? "en" : "roman");
      if (said) onChange(value ? `${value} ${said}` : said);
    } catch {
      /* mic is optional */
    } finally {
      setListening(false);
    }
  };

  return (
    <>
      <textarea className="field min-h-36" value={value} onChange={(e) => onChange(e.target.value)} placeholder={t.notesPh} />
      <button type="button" className="btn-ghost inline-flex items-center justify-center gap-2" onClick={() => void speak()}>
        <IconMic />
        {listening ? t.voiceStop : t.voice}
      </button>
    </>
  );
}
