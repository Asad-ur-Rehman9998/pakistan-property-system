"use client";

import { useState } from "react";
import type { PaperFieldKey, PaperKind, PaperRead } from "@/types/check";
import { applyConfirmedFields, setFieldConfirm, setPaperKind } from "@/lib/docai/compare";
import { fieldLabel, kindLabel, PAPER_KINDS } from "@/lib/docai/labels";
import { formatCnicLast4 } from "@/lib/docai/sensitive";
import type { CheckAnswers } from "@/types/check";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { ConsistencyFlags } from "./ConsistencyFlags";

export function PaperReads({
  reads,
  answers,
  onAnswers,
}: {
  reads: PaperRead[];
  answers: CheckAnswers;
  onAnswers: (next: CheckAnswers) => void;
}) {
  const { t } = useI18n();
  if (!reads.length) return null;

  const update = (nextReads: PaperRead[]) => {
    onAnswers(applyConfirmedFields(answers, nextReads));
  };

  return (
    <div className="mt-4 flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-[var(--muted)]">{t.paperNotOfficial}</p>
      <ConsistencyFlags answers={{ ...answers, paperReads: reads }} />
      {reads.map((read) => (
        <PaperCard
          key={read.photoKey}
          read={read}
          onKind={(kind) => update(setPaperKind(reads, read.photoKey, kind))}
          onConfirm={(key, ok, value) => update(setFieldConfirm(reads, read.photoKey, key, ok, value))}
        />
      ))}
    </div>
  );
}

function PaperCard({
  read,
  onKind,
  onConfirm,
}: {
  read: PaperRead;
  onKind: (kind: PaperKind) => void;
  onConfirm: (key: PaperFieldKey, ok: boolean, value?: string) => void;
}) {
  const { t, lang } = useI18n();
  const [editing, setEditing] = useState<PaperFieldKey | null>(null);
  const status =
    read.ocrStatus === "pending"
      ? t.ocrReading
      : read.ocrStatus === "failed"
        ? t.ocrFailed
        : read.ocrStatus === "skipped"
          ? t.ocrSkipped
          : read.encrypted
            ? t.paperEncrypted
            : t.ocrDone;

  return (
    <div className="panel p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{status}</p>
      <label className="mt-2 block text-sm font-semibold">{t.paperType}</label>
      <select
        className="field mt-1"
        value={read.kind}
        onChange={(e) => onKind(e.target.value as PaperKind)}
      >
        {PAPER_KINDS.map((k) => (
          <option key={k} value={k}>
            {kindLabel(k, lang)}
          </option>
        ))}
      </select>
      {read.fields.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--muted)]">{t.paperNoFields}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {read.fields.map((f) => {
            const shown = f.sensitive ? formatCnicLast4(f.value) : f.value;
            return (
              <li key={f.key} className="border-t border-[var(--line)] pt-3">
                <p className="text-sm text-[var(--muted)]">{fieldLabel(f.key, lang)}</p>
                {editing === f.key && !f.sensitive ? (
                  <input
                    className="field mt-1"
                    defaultValue={f.value}
                    autoComplete="off"
                    onBlur={(e) => {
                      onConfirm(f.key, true, e.target.value);
                      setEditing(null);
                    }}
                  />
                ) : (
                  <p className="mt-1 text-base font-semibold leading-snug">{shown}</p>
                )}
                {f.sensitive ? <p className="mt-1 text-xs text-[var(--muted)]">{t.cnicMaskedH}</p> : null}
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" className="btn-ghost min-h-11 px-3 text-sm" onClick={() => onConfirm(f.key, true)}>
                    {t.fieldOk}
                  </button>
                  <button type="button" className="btn-ghost min-h-11 px-3 text-sm" onClick={() => onConfirm(f.key, false)}>
                    {t.fieldWrong}
                  </button>
                  {f.sensitive ? null : (
                    <button type="button" className="btn-ghost min-h-11 px-3 text-sm" onClick={() => setEditing(f.key)}>
                      {t.fieldEdit}
                    </button>
                  )}
                </div>
                {f.confirmed === true ? <p className="mt-1 text-xs text-[var(--green-deep)]">{t.fieldConfirmed}</p> : null}
                {f.confirmed === false ? <p className="mt-1 text-xs text-[var(--red)]">{t.fieldRejected}</p> : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
