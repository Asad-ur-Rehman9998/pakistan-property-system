import type { CheckAnswers, Finding, PaperField, PaperFieldKey, PaperRead } from "@/types/check";
import { compareDocuments } from "./consistency";
import { fieldValue } from "./extract";

function L(en: string, ur: string, roman: string) {
  return { en, ur, roman };
}

/** Paper-to-paper consistency plus a note that OCR is not official. */
export function comparePapers(answers: CheckAnswers): Finding[] {
  const findings = compareDocuments(answers);
  const reads = answers.paperReads ?? [];
  if (reads.some((r) => r.ocrStatus === "done" && r.kind !== "unknown")) {
    findings.push({
      id: "paper_ocr_note",
      kind: "known",
      severity: "info",
      source: "system_detected",
      title: L("Papers were read on this phone", "کاغذات اس فون پر پڑھے گئے", "Kaghazat is phone par padhe gaye"),
      why: L(
        "A camera photo was compressed, stored encrypted on this phone, and read by software. That is system-detected, not a government check. Confirm the important fields yourself.",
        "کیمرے کی تصویر چھوٹی کی گئی، اس فون پر مرموز محفوظ ہوئی، اور سافٹ ویئر نے پڑھی۔ یہ سسٹم کی پڑھائی ہے، سرکاری چیک نہیں۔ اہم خانے خود تصدیق کریں۔",
        "Camera ki tasveer chhoti ki gai, is phone par encrypted mehfooz hui, aur software ne padhi. Yeh system ki padhai hai, sarkari check nahi. Ehem khanay khud tasdeeq karein.",
      ),
      doNow: L(
        "Wrong reading is common. Trust the original paper over this screen. A possible inconsistency is not a legal conclusion.",
        "غلط پڑھائی عام ہے۔ اس اسکرین سے زیادہ اصل کاغذ پر بھروسہ کریں۔ ممکنہ تضاد قانونی فیصلہ نہیں۔",
        "Ghalat padhai aam hai. Is screen se zyada asal kaghaz par bharosa karein. Mumkina tazad qanooni faisla nahi.",
      ),
    });
  }
  return findings;
}

export function applyConfirmedFields(answers: CheckAnswers, reads: PaperRead[]): CheckAnswers {
  const next: CheckAnswers = { ...answers, paperReads: reads };
  const pick = (key: PaperFieldKey) => fieldValue(reads.flatMap((r) => r.fields), key, true);
  if (!next.ownerNameOnPaper) {
    const n = pick("ownerName");
    if (n) next.ownerNameOnPaper = n;
  }
  if (!next.plotNumber) {
    const n = pick("plotNumber");
    if (n) next.plotNumber = n;
  }
  if (!next.khasraNumber) {
    const n = pick("khasraNumber");
    if (n) next.khasraNumber = n;
  }
  if (!next.societyName) {
    const n = pick("societyName");
    if (n) next.societyName = n;
  }
  if (!next.village) {
    const n = pick("mouza");
    if (n) next.village = n;
  }
  if (!next.developerName) {
    const n = pick("developerName");
    if (n) next.developerName = n;
  }
  if (!next.areaSize) {
    const n = pick("areaSize");
    if (n) {
      const m = n.match(/^(\d+(?:\.\d+)?)/);
      if (m) next.areaSize = m[1];
    }
  }
  return next;
}

export function setFieldConfirm(reads: PaperRead[], photoKey: string, key: PaperFieldKey, confirmed: boolean, value?: string): PaperRead[] {
  return reads.map((r) => {
    if (r.photoKey !== photoKey) return r;
    return {
      ...r,
      fields: r.fields.map((f) => {
        if (f.key !== key) return f;
        const next: PaperField = { ...f, confirmed };
        if (typeof value === "string" && value.trim() && !f.sensitive) next.value = value.trim().slice(0, 80);
        return next;
      }),
    };
  });
}

export function setPaperKind(reads: PaperRead[], photoKey: string, kind: PaperRead["kind"]): PaperRead[] {
  return reads.map((r) => (r.photoKey === photoKey ? { ...r, kind, kindConfidence: 1 } : r));
}
