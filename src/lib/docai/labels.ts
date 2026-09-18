import type { Lang, PaperFieldKey, PaperKind } from "@/types/check";
import { termName } from "@/lib/pakistan/terms";

const kinds: Record<PaperKind, { en: string; ur: string; roman: string }> = {
  fard: { en: termName("fard", "en"), ur: termName("fard", "ur"), roman: termName("fard", "roman") },
  registry: { en: termName("registry", "en"), ur: termName("registry", "ur"), roman: termName("registry", "roman") },
  allotment: { en: termName("allotment", "en"), ur: termName("allotment", "ur"), roman: termName("allotment", "roman") },
  mutation: { en: termName("intiqal", "en"), ur: termName("intiqal", "ur"), roman: termName("intiqal", "roman") },
  cnic: { en: termName("cnic", "en"), ur: termName("cnic", "ur"), roman: termName("cnic", "roman") },
  aks_shajra: { en: termName("aks", "en"), ur: termName("aks", "ur"), roman: termName("aks", "roman") },
  noc: { en: termName("noc", "en"), ur: termName("noc", "ur"), roman: termName("noc", "roman") },
  utility_bills: { en: "Utility bill", ur: "یوٹیلیٹی بل", roman: "Utility bill" },
  bayana: { en: termName("bayana", "en"), ur: termName("bayana", "ur"), roman: termName("bayana", "roman") },
  original_file: { en: "Society file", ur: "سوسائٹی فائل", roman: "Society file" },
  approved_plan: { en: "Building plan", ur: "نقشہ", roman: "Building plan" },
  warasat: { en: termName("warasat", "en"), ur: termName("warasat", "ur"), roman: termName("warasat", "roman") },
  rent_agreement: { en: "Rent agreement", ur: "کرایہ نامہ", roman: "Kiraya nama" },
  khasra: { en: termName("khasra", "en"), ur: termName("khasra", "ur"), roman: termName("khasra", "roman") },
  unknown: { en: "Could not tell the type", ur: "قسم سمجھ نہیں آئی", roman: "Qisam samajh nahi aai" },
};

const fields: Record<PaperFieldKey, { en: string; ur: string; roman: string }> = {
  ownerName: { en: "Owner name", ur: "مالک کا نام", roman: "Malik ka naam" },
  otherPartyName: { en: "Other party name", ur: "دوسری فریق", roman: "Doosri party" },
  cnicLast4: { en: "CNIC (last 4 only)", ur: "شناختی (صرف آخری ۴)", roman: "CNIC (sirf aakhri 4)" },
  plotNumber: { en: "Plot / file number", ur: "پلاٹ / فائل نمبر", roman: "Plot / file number" },
  khasraNumber: { en: termName("khasra", "en"), ur: termName("khasra", "ur"), roman: termName("khasra", "roman") },
  khewat: { en: termName("khewat", "en"), ur: termName("khewat", "ur"), roman: termName("khewat", "roman") },
  khatooni: { en: termName("khatooni", "en"), ur: termName("khatooni", "ur"), roman: termName("khatooni", "roman") },
  mouza: { en: termName("mauza", "en"), ur: termName("mauza", "ur"), roman: termName("mauza", "roman") },
  areaSize: { en: "Area", ur: "رقبہ", roman: "Raqba" },
  location: { en: "Location", ur: "جگہ", roman: "Jagah" },
  societyName: { en: "Society / developer scheme", ur: "سوسائٹی", roman: "Society" },
  developerName: { en: "Developer", ur: "ڈویلپر", roman: "Developer" },
  documentNumber: { en: "Document number", ur: "دستاویز نمبر", roman: "Dastavez number" },
  issueDate: { en: "Date on paper", ur: "کاغذ کی تاریخ", roman: "Kaghaz ki tareekh" },
  dimensions: { en: "Dimensions", ur: "پیمائش", roman: "Paimaish" },
};

export const PAPER_KINDS = Object.keys(kinds) as PaperKind[];

export function kindLabel(kind: PaperKind, lang: Lang): string {
  return kinds[kind][lang];
}

export function fieldLabel(key: PaperFieldKey, lang: Lang): string {
  return fields[key][lang];
}
