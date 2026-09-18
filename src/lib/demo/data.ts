import type { CheckAnswers, Lang, Localized } from "@/types/check";

/** Exact product label — keep this English wording on every demo surface. */
export const DEMO_DATA_LABEL = "DEMO DATA — NOT A REAL PROPERTY";

export const DEMO_DATA_HINT: Localized = {
  en: "Fictional sample only. No real CNIC, property paper photo, phone number, or private information.",
  ur: "صرف فرضی نمونہ۔ کوئی حقیقی شناختی نمبر، جائیداد کا کاغذ، فون نمبر یا ذاتی معلومات نہیں۔",
  roman: "Sirf farzi namuna. Koi haqiqi CNIC, jaedad ka kaghaz, phone number ya zati maloomat nahi.",
};

/** Featured fictional demo — never a live listing. */
export const DEMO_PROPERTY = {
  id: "ex-demo",
  title: "Demo Property",
  area: "DHA Phase 6",
  city: "Lahore",
  size: "5",
  unit: "marla" as const,
  /** Asking price as typed; display as Rs. 2.40 Crore. */
  price: "2.40 crore",
  priceDisplay: "Rs. 2.40 Crore",
  plotNumber: "DEMO-5",
  ownerName: "Demo Owner",
} as const;

export function isDemoCheckId(id: string | null | undefined): boolean {
  return typeof id === "string" && id.startsWith("ex-");
}

export function demoLabel(lang: Lang = "en"): string {
  if (lang === "ur") return `${DEMO_DATA_LABEL} — فرضی نمونہ`;
  if (lang === "roman") return `${DEMO_DATA_LABEL} — farzi namuna`;
  return DEMO_DATA_LABEL;
}

export function demoPropertyCardLines(lang: Lang = "en"): string[] {
  if (lang === "ur") {
    return [DEMO_PROPERTY.title, DEMO_PROPERTY.area, "۵ مرلہ", DEMO_PROPERTY.priceDisplay];
  }
  if (lang === "roman") {
    return [DEMO_PROPERTY.title, DEMO_PROPERTY.area, "5 Marla", DEMO_PROPERTY.priceDisplay];
  }
  return [DEMO_PROPERTY.title, DEMO_PROPERTY.area, "5 Marla", DEMO_PROPERTY.priceDisplay];
}

/** Answers for the featured demo check. All fields are fictional. */
export function demoPropertyAnswers(): CheckAnswers {
  return {
    intent: "buy",
    settlement: "urban",
    propertyKind: "plot",
    isSocietyFile: false,
    locationMethod: "manual",
    province: "punjab",
    city: DEMO_PROPERTY.city,
    district: "Lahore",
    area: DEMO_PROPERTY.area,
    tehsil: "",
    village: "",
    plotNumber: DEMO_PROPERTY.plotNumber,
    khasraNumber: "",
    societyName: DEMO_PROPERTY.area,
    developerName: "",
    lat: "",
    lng: "",
    locationLabel: `${DEMO_PROPERTY.area}, ${DEMO_PROPERTY.city}`,
    hasDocuments: "no",
    areaSize: DEMO_PROPERTY.size,
    areaUnit: DEMO_PROPERTY.unit,
    ownerNameOnPaper: DEMO_PROPERTY.ownerName,
    counterparty: "agent",
    foundVia: "listing",
    documents: {
      ownership: "missing",
      cnic_owner: "missing",
      mutation: "missing",
      society_noc: "missing",
      bayana_written: "missing",
    },
    flags: {
      seen_in_person: "no",
      occupied: "unsure",
      pressure_today: "no",
      name_match: "unsure",
      court_case: "no",
      society_approved: "unsure",
      met_owner: "no",
    },
    price: DEMO_PROPERTY.price,
    tokenAmount: "",
    notes: "DEMO DATA — NOT A REAL PROPERTY. Fictional sample for product demos. No real CNIC, paper photo, or phone.",
    paperReads: [],
    tokenChecklist: {},
    buyerLocation: "pakistan",
    representativeName: "",
    representativeRelation: "",
    representativePoa: null,
  };
}

/** Reject demo payloads that look like real private contact data. */
export function demoNotesLookPrivate(text: string): boolean {
  const s = String(text || "");
  if (/\b\d{5}-\d{7}-\d\b/.test(s)) return true;
  if (/data:image\//i.test(s)) return true;
  const digits = s.replace(/\D/g, "");
  if (/03\d{9}/.test(digits) || /923\d{9}/.test(digits)) return true;
  return false;
}
