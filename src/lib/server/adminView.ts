import { stripCnics } from "@/lib/docai/sensitive";
import type { SharedCheckRecord } from "./checksStore";

type LooseReport = {
  verdict?: string;
  headline?: { en?: string; ur?: string; roman?: string };
  infoStatus?: { level?: string };
  hasOfficialVerification?: boolean;
  provenance?: { verified?: number; needs_verification?: number };
  duplicates?: { matches?: { id: string; score?: number }[] };
};

type LooseAnswers = {
  city?: string;
  area?: string;
  village?: string;
  plotNumber?: string;
  khasraNumber?: string;
  foundVia?: string;
  propertyKind?: string;
  notes?: string;
  paperReads?: { kind?: string; photoKey?: string; fields?: unknown[] }[];
};

export function propertyCard(row: SharedCheckRecord) {
  const report = (row.report || {}) as LooseReport;
  const answers = (row.answers || {}) as LooseAnswers;
  const papers = (answers.paperReads ?? []).map((p) => ({
    kind: p.kind || "unknown",
    fields: Array.isArray(p.fields) ? p.fields.length : 0,
  }));
  return {
    id: row.id,
    createdAt: row.createdAt,
    city: String(answers.city || ""),
    area: String(answers.area || answers.village || ""),
    plotNumber: String(answers.plotNumber || ""),
    khasraNumber: String(answers.khasraNumber || ""),
    kind: String(answers.propertyKind || ""),
    foundVia: String(answers.foundVia || ""),
    notes: stripCnics(String(answers.notes || "")).slice(0, 240),
    verdict: report.verdict || "wait",
    headline: report.headline?.roman || report.headline?.en || "",
    infoStatus: report.infoStatus?.level || "insufficient",
    officialVerification: 0,
    hasOfficialVerification: false,
    needsVerification: Number(report.provenance?.needs_verification || 0),
    duplicateMatches: report.duplicates?.matches?.length || 0,
    papers,
    papersStored: false,
  };
}

export function isFlagged(row: SharedCheckRecord): boolean {
  const report = (row.report || {}) as LooseReport;
  return report.infoStatus?.level === "high";
}

export function needsVerify(row: SharedCheckRecord): boolean {
  const report = (row.report || {}) as LooseReport;
  return report.infoStatus?.level === "verify" || Number(report.provenance?.needs_verification || 0) > 0;
}

export function hasDuplicate(row: SharedCheckRecord): boolean {
  const report = (row.report || {}) as LooseReport;
  return (report.duplicates?.matches?.length || 0) > 0;
}
