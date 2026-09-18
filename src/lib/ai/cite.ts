import type { CheckAnswers, ClarityReport, EvidenceSource, Finding, Localized, RiskItem } from "@/types/check";
import type { EvidenceKind, EvidenceRef, GroundedClaim } from "./types";

function L(en: string, ur: string, roman: string): Localized {
  return { en, ur, roman };
}

export function sourceToKind(source: EvidenceSource, hint: string): EvidenceKind {
  if (source === "verified") return "authoritative_source";
  if (hint.includes("paper") || hint.includes("fard") || hint.includes("ocr") || hint.includes("document")) {
    return "uploaded_document";
  }
  if (hint.includes("duplicate") || hint.includes("database") || hint.includes("other check")) {
    return "internal_database";
  }
  if (hint.includes("per-marla") || hint.includes("per-kanal") || hint.includes("estimate")) return "estimate";
  if (source === "user_provided") return "user_provided";
  if (source === "system_detected") return "uploaded_document";
  return "user_provided";
}

export function kindLabel(kind: EvidenceKind): Localized {
  if (kind === "uploaded_document") return L("Uploaded document", "اپ لوڈ شدہ کاغذ", "Upload shuda kaghaz");
  if (kind === "user_provided") return L("User-provided", "آپ نے بتایا", "Aap ne bataya");
  if (kind === "authoritative_source") return L("Authoritative source", "مستند ذریعہ", "Mustanad zariya");
  if (kind === "internal_database") return L("Internal database", "اندرونی ڈیٹا", "Androoni data");
  return L("Clearly labelled estimate", "واضح اندازہ", "Wazeh andaza");
}

function refFor(source: EvidenceSource, pointer: string, hint: string): EvidenceRef {
  const kind = sourceToKind(source, `${pointer} ${hint}`);
  return { kind, pointer, label: kindLabel(kind) };
}

export function claimFromFinding(f: Finding): GroundedClaim {
  return {
    id: f.id,
    text: f.why,
    evidence: [refFor(f.source, `finding:${f.id}`, `${f.id} ${f.title.en}`)],
  };
}

export function claimFromRisk(r: RiskItem): GroundedClaim {
  return {
    id: r.id,
    text: r.why,
    evidence: [refFor(r.source, `risk:${r.id}`, `${r.id} ${r.lane} ${r.evidence.en}`)],
  };
}

export function packTokens(answers: CheckAnswers, report: ClarityReport): string[] {
  const bits = [
    answers.city,
    answers.area,
    answers.village,
    answers.plotNumber,
    answers.khasraNumber,
    answers.societyName,
    answers.price,
    answers.tokenAmount,
    answers.ownerNameOnPaper,
    answers.notes,
    ...(answers.paperReads ?? []).flatMap((p) => [p.kind, ...p.fields.map((f) => f.value)]),
    report.headline.en,
    report.summary.en,
    ...report.risks.map((r) => `${r.title.en} ${r.why.en} ${r.evidence.en}`),
    ...[...report.known, ...report.missing, ...report.inconsistent, ...report.verify].map(
      (f) => `${f.title.en} ${f.why.en}`,
    ),
  ];
  const tokens = new Set<string>();
  for (const bit of bits) {
    for (const w of String(bit || "")
      .toLowerCase()
      .split(/[^a-z0-9\u0600-\u06ff]+/i)) {
      if (w.length >= 2) tokens.add(w);
    }
  }
  return [...tokens];
}
