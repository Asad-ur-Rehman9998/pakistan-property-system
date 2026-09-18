import type { AreaUnit, Lang, Localized } from "@/types/check";

export const areaUnits: { id: AreaUnit; label: Localized; hint: Localized }[] = [
  {
    id: "marla",
    label: { en: "Marla", ur: "مرلہ", roman: "Marla" },
    hint: {
      en: "Common city-plot size in Punjab and many towns. The exact square feet in one marla is not the same everywhere — some places use about 272, others 225. Confirm locally.",
      ur: "پنجاب اور بہت سے شہروں میں پلاٹ کا عام ناپ۔ ایک مرلہ کے فٹ ہر جگہ ایک نہیں — کہیں ۲۷۲، کہیں ۲۲۵۔ مقامی تصدیق کریں۔",
      roman: "Punjab aur bohat se shehron mein plot ka aam naap. Ek marla ke feet har jagah ek nahi — kahin 272, kahin 225. Muqami tasdeeq karein.",
    },
  },
  {
    id: "kanal",
    label: { en: "Kanal", ur: "کنال", roman: "Kanal" },
    hint: {
      en: "Bigger than a marla. In most of Pakistan 1 kanal is 20 marla. Houses in older cities are often 1 or 2 kanal.",
      ur: "مرلہ سے بڑا۔ زیادہ تر پاکستان میں ۱ کنال = ۲۰ مرلہ۔ پرانے شہروں کے گھر اکثر ۱ یا ۲ کنال۔",
      roman: "Marla se bara. Zyada tar Pakistan mein 1 kanal = 20 marla. Purane shehron ke ghar aksar 1 ya 2 kanal.",
    },
  },
  {
    id: "sqyd",
    label: { en: "Sq. yards (gaz)", ur: "مربع گز", roman: "Sq. yards (gaz)" },
    hint: {
      en: "Karachi and many Sindh plots are sold in square yards, often called gaz.",
      ur: "کراچی اور سندھ کے بہت سے پلاٹ مربع گز میں بکتے ہیں، اسے گز بھی کہتے ہیں۔",
      roman: "Karachi aur Sindh ke bohat se plot murabba gaz mein bikte hain, ise gaz bhi kehte hain.",
    },
  },
  {
    id: "sqft",
    label: { en: "Sq. feet", ur: "مربع فٹ", roman: "Sq. feet" },
    hint: {
      en: "Flats and shops often use square feet. Still write the society plot number if there is one.",
      ur: "فلیٹ اور دکان اکثر مربع فٹ میں۔ اگر پلاٹ نمبر ہو تو وہ بھی لکھیں۔",
      roman: "Flat aur dukaan aksar murabba feet mein. Agar plot number ho to woh bhi likhein.",
    },
  },
  {
    id: "acre",
    label: { en: "Acre", ur: "ایکڑ", roman: "Acre" },
    hint: {
      en: "Village and farm land. Roughly 8 kanal in many areas — still match khasra on the field.",
      ur: "گاؤں اور کھیت۔ بہت سی جگہ تقریباً ۸ کنال — پھر بھی خسرہ کھیت پر ملائیں۔",
      roman: "Gaon aur khet. Bohat si jagah taqreeban 8 kanal — phir bhi khasra khet par milayen.",
    },
  },
];

export function unitLabel(unit: AreaUnit | null, lang: Lang): string {
  if (!unit) return "";
  return areaUnits.find((u) => u.id === unit)?.label[lang] ?? unit;
}

export function formatArea(size: string, unit: AreaUnit | null, lang: Lang): string {
  const n = size.trim();
  if (!n || !unit) return "";
  return `${n} ${unitLabel(unit, lang)}`;
}

function unitFromWord(raw: string): AreaUnit | null {
  const s = raw.toLowerCase().replace(/\s+/g, " ").trim();
  if (!s) return null;
  if (/marla|مرلہ/.test(s)) return "marla";
  if (/kanal|کنال/.test(s)) return "kanal";
  if (/acre|ایکڑ|ایکڑ/.test(s)) return "acre";
  if (/sq\.?\s*yd|square\s*yards?|gaz|گز/.test(s)) return "sqyd";
  if (/sq\.?\s*ft|square\s*feet?|فٹ/.test(s)) return "sqft";
  return null;
}

/** Read "10 Marla", "8 marla", "0.5 kanal" the way papers write size. */
export function parseAreaPhrase(raw: string): { amount: number; unit: AreaUnit | null } | null {
  const s = String(raw || "").trim();
  if (!s) return null;
  const m = s.match(/(\d+(?:\.\d+)?)\s*([A-Za-z\u0600-\u06FF. ]{0,24})/);
  if (!m) return null;
  const amount = Number(m[1]);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return { amount, unit: unitFromWord(m[2] || "") };
}

/** Rough Pakistan conversion for compare only — not a legal survey. */
export function toMarla(amount: number, unit: AreaUnit): number | null {
  if (unit === "marla") return amount;
  if (unit === "kanal") return amount * 20;
  if (unit === "acre") return amount * 160;
  return null;
}

export function toKanal(amount: number, unit: AreaUnit): number | null {
  const marla = toMarla(amount, unit);
  return marla == null ? null : marla / 20;
}

/** Only when the user already used sq ft or gaz. Marla is not one official sq-ft figure. */
export function toSqft(amount: number, unit: AreaUnit): number | null {
  if (unit === "sqft") return amount;
  if (unit === "sqyd") return amount * 9;
  return null;
}

export function areasCompare(a: string, b: string): "match" | "mismatch" | "undetermined" {
  const pa = parseAreaPhrase(a);
  const pb = parseAreaPhrase(b);
  if (!pa || !pb) return "undetermined";
  if (pa.unit && pb.unit && pa.unit === pb.unit) {
    return nearlyEqual(pa.amount, pb.amount) ? "match" : "mismatch";
  }
  if (pa.unit && pb.unit) {
    const ma = toMarla(pa.amount, pa.unit);
    const mb = toMarla(pb.amount, pb.unit);
    if (ma == null || mb == null) return "undetermined";
    return nearlyEqual(ma, mb) ? "match" : "mismatch";
  }
  if (!pa.unit && !pb.unit) {
    return nearlyEqual(pa.amount, pb.amount) ? "match" : "mismatch";
  }
  return "undetermined";
}

function nearlyEqual(a: number, b: number): boolean {
  const scale = Math.max(Math.abs(a), Math.abs(b), 1);
  return Math.abs(a - b) <= Math.max(0.05, scale * 0.02);
}
