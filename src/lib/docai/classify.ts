import type { PaperKind } from "@/types/check";

interface Rule {
  kind: PaperKind;
  needles: string[];
  weight: number;
}

const RULES: Rule[] = [
  { kind: "cnic", weight: 6, needles: ["nadra", "national identity", "cnic", "شناختی کارڈ", "شناختي کارڈ", "computerized national"] },
  { kind: "fard", weight: 5, needles: ["fard", "jamabandi", "فرد", "جمبندی", "جمبندي", "patwari"] },
  { kind: "khasra", weight: 4, needles: ["khasra", "khewat", "khatooni", "khatauni", "خسرہ", "خسارہ", "کھتونی", "کھیوت"] },
  { kind: "aks_shajra", weight: 5, needles: ["aks shajra", "shajra", "عکس شجرہ", "شجرہ"] },
  { kind: "mutation", weight: 5, needles: ["intiqal", "mutation", "انتقال", "fard badar"] },
  { kind: "registry", weight: 5, needles: ["registry", "sale deed", "registrar", "sub registrar", "رجسٹری", "رجسٹري", "wasika", "وثیقہ"] },
  { kind: "allotment", weight: 4, needles: ["allotment", "allottee", "الاٹمنٹ", "الاٹمنټ"] },
  { kind: "original_file", weight: 4, needles: ["open file", "file number", "allocation file", "فائل نمبر"] },
  { kind: "noc", weight: 4, needles: ["noc", "no objection", "transfer letter", "این او سی"] },
  { kind: "bayana", weight: 4, needles: ["bayana", "token money", "earnest", "بیعانہ", "بیع نامہ", "agreement to sell"] },
  { kind: "utility_bills", weight: 4, needles: ["lesco", "k-electric", "kelectric", "ssgc", "sui gas", "wapda", "ptcl", "water bill", "electricity bill"] },
  { kind: "approved_plan", weight: 4, needles: ["building plan", "completion certificate", "approved plan", "map approval"] },
  { kind: "warasat", weight: 4, needles: ["warasat", "heir", "succession", "وراثت", "ورثاء", "legal heir"] },
  { kind: "rent_agreement", weight: 4, needles: ["rent agreement", "tenancy", "kiraya nama", "کرایہ نامہ"] },
];

export function classifyPaper(ocrText: string): { kind: PaperKind; confidence: number } {
  const text = (ocrText || "").toLowerCase();
  if (!text.trim()) return { kind: "unknown", confidence: 0 };

  const scores = new Map<PaperKind, number>();
  for (const rule of RULES) {
    let hits = 0;
    for (const n of rule.needles) {
      if (text.includes(n.toLowerCase())) hits += 1;
    }
    if (hits) scores.set(rule.kind, (scores.get(rule.kind) ?? 0) + hits * rule.weight);
  }

  let best: PaperKind = "unknown";
  let bestScore = 0;
  for (const [kind, score] of scores) {
    if (score > bestScore) {
      best = kind;
      bestScore = score;
    }
  }

  if (bestScore < 4) return { kind: "unknown", confidence: bestScore / 12 };
  const confidence = Math.min(0.95, 0.35 + bestScore / 20);
  return { kind: best, confidence };
}

export function kindToDocId(kind: PaperKind): string | null {
  if (kind === "unknown") return null;
  if (kind === "registry" || kind === "allotment") return "ownership";
  if (kind === "cnic") return "cnic_owner";
  if (kind === "noc") return "society_noc";
  if (kind === "bayana") return "bayana_written";
  return kind;
}
