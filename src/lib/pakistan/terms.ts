import type { Lang, Localized } from "@/types/check";

function L(en: string, ur: string, roman: string): Localized {
  return { en, ur, roman };
}

/**
 * Canonical Pakistan property terms.
 * Legal names are kept. We explain them; we do not invent a foreign equivalent.
 */
export interface TermEntry {
  id: string;
  term: Localized;
  /** Plain neighbour-line — not a substitute name. */
  explain: Localized;
  /** Machine-style names we refuse to use as the term itself. */
  doNotCall: Localized;
}

export const TERMS: TermEntry[] = [
  {
    id: "fard",
    term: L("Fard", "فرد", "Fard"),
    explain: L(
      "The government land-record extract that shows whose name is written. It is not a court title.",
      "سرکاری ریکارڈ جو بتاتا ہے زمین کس کے نام ہے۔ عدالتی ٹائٹل نہیں۔",
      "Sarkari record jo batata hai zameen kis ke naam hai. Adalati title nahi.",
    ),
    doNotCall: L("title deed / ownership certificate", "ٹائٹل ڈیڈ", "title deed"),
  },
  {
    id: "intiqal",
    term: L("Intiqal / Mutation", "انتقال", "Intiqal / Mutation"),
    explain: L(
      "Updating the land record after a sale or inheritance so the new name appears.",
      "خرید یا وراثت کے بعد ریکارڈ میں نیا نام چڑھانا۔",
      "Kharid ya warasat ke baad record mein naya naam charhana.",
    ),
    doNotCall: L("title transfer", "ٹائٹل ٹرانسفر", "title transfer"),
  },
  {
    id: "registry",
    term: L("Registry", "رجسٹری", "Registry"),
    explain: L(
      "The sale written at the sub-registrar. A dealer stamp paper is not this.",
      "سب رجسٹرار کے دفتر میں لکھی فروخت۔ ڈیلر کا سٹام پیپر یہ نہیں۔",
      "Sub-registrar ke daftar mein likhi farokht. Dealer ka stamp paper yeh nahi.",
    ),
    doNotCall: L("conveyance / closing", "کلوزنگ", "closing"),
  },
  {
    id: "bai_nama",
    term: L("Bai nama / Sale deed", "بیع نامہ", "Bai nama / Sale deed"),
    explain: L(
      "The written sale paper. After registration people usually call it registry.",
      "لکھا ہوا فروخت کا کاغذ۔ رجسٹر کے بعد عام طور پر رجسٹری کہتے ہیں۔",
      "Likha hua farokht ka kaghaz. Register ke baad aam taur par registry kehte hain.",
    ),
    doNotCall: L("purchase agreement only", "صرف خرید معاہدہ", "sirf kharid muahida"),
  },
  {
    id: "bayana",
    term: L("Bayana / Token", "بیعانہ / ٹوکن", "Bayana / Token"),
    explain: L(
      "Advance money to hold a deal. Write it before you pay.",
      "ڈیل روکنے کی پیشگی رقم۔ دینے سے پہلے لکھیں۔",
      "Deal rokne ki peshgi raqam. Dene se pehle likhein.",
    ),
    doNotCall: L("earnest money / deposit", "ارنسٹ منی", "earnest money"),
  },
  {
    id: "khasra",
    term: L("Khasra", "خسرہ", "Khasra"),
    explain: L(
      "The number of a village land parcel.",
      "گاؤں کی زمین کے ٹکڑے کا نمبر۔",
      "Gaon ki zameen ke tukray ka number.",
    ),
    doNotCall: L("lot number / parcel ID", "لاٹ نمبر", "lot number"),
  },
  {
    id: "khewat",
    term: L("Khewat", "کھیوت", "Khewat"),
    explain: L("An ownership entry number in the rural record.", "دیہی ریکارڈ میں ملکیت کا اندراج نمبر۔", "Dehi record mein malkiat ka indraj number."),
    doNotCall: L("folio / account ID", "فولیو", "folio"),
  },
  {
    id: "khatooni",
    term: L("Khatooni", "کھتونی", "Khatooni"),
    explain: L("A cultivator / holding number in the rural record.", "دیہی ریکارڈ میں کاشتکار / ہولڈنگ نمبر۔", "Dehi record mein kashtkar / holding number."),
    doNotCall: L("tenant ID", "ٹیننٹ آئی ڈی", "tenant ID"),
  },
  {
    id: "mauza",
    term: L("Mauza / Mouza", "موضع", "Mauza"),
    explain: L("The revenue village name on papers.", "کاغذات پر ریونیو گاؤں کا نام۔", "Kaghazat par revenue gaon ka naam."),
    doNotCall: L("township / county", "ٹاؤن شپ", "township"),
  },
  {
    id: "aks",
    term: L("Aks Shajra", "عکس شجرہ", "Aks Shajra"),
    explain: L("A small map extract of land pieces.", "زمین کے ٹکڑوں کا چھوٹا نقشہ۔", "Zameen ke tukron ka chhota naqsha."),
    doNotCall: L("cadastral plat / GIS map", "GIS نقشہ", "GIS map"),
  },
  {
    id: "warasat",
    term: L("Warasat", "وراثت", "Warasat"),
    explain: L("Inheritance. Heirs and papers must match before a sale.", "وراثت۔ فروخت سے پہلے ورثاء اور کاغذ میل کھائیں۔", "Warasat. Farokht se pehle waris aur kaghaz mil khaen."),
    doNotCall: L("probate / estate grant", "پروبیت", "probate"),
  },
  {
    id: "mukhtarnama",
    term: L("Mukhtarnama / POA", "مختارنامہ", "Mukhtarnama / POA"),
    explain: L(
      "A paper that lets someone else deal in the owner's place. Confirm it at the office.",
      "کاغذ جس سے دوسرا شخص مالک کی جگہ ڈیل کرے۔ دفتر سے تصدیق کریں۔",
      "Kaghaz jis se doosra shakhs malik ki jagah deal kare. Daftar se tasdeeq karein.",
    ),
    doNotCall: L("letter of authority", "اتھارٹی لیٹر", "authority letter"),
  },
  {
    id: "noc",
    term: L("NOC", "این او سی", "NOC"),
    explain: L(
      "No-objection / transfer letter from a society or authority. The letters stay NOC.",
      "سوسائٹی یا اتھارٹی کا این او سی / ٹرانسفر خط۔ مخفف این او سی رہتا ہے۔",
      "Society ya authority ka NOC / transfer khat. Mukhaffaf NOC rehta hai.",
    ),
    doNotCall: L("clearance certificate", "کلیئرنس سرٹیفکیٹ", "clearance certificate"),
  },
  {
    id: "cnic",
    term: L("CNIC", "شناختی کارڈ", "CNIC"),
    explain: L("Computerised national identity card. We keep only last-4.", "کمپیوٹرائزڈ قومی شناختی کارڈ۔ صرف آخری ۴ رکھتے ہیں۔", "Computerised qomi shanakhti card. Sirf aakhri 4 rakhte hain."),
    doNotCall: L("national ID / passport", "پاسپورٹ", "passport"),
  },
  {
    id: "marla",
    term: L("Marla", "مرلہ", "Marla"),
    explain: L("A local plot unit. Square feet in one marla is not the same everywhere.", "مقامی پلاٹ کا ناپ۔ ایک مرلہ کے فٹ ہر جگہ ایک نہیں۔", "Muqami plot ka naap. Ek marla ke feet har jagah ek nahi."),
    doNotCall: L("square rod", "سکوئر راڈ", "square rod"),
  },
  {
    id: "kanal",
    term: L("Kanal", "کنال", "Kanal"),
    explain: L("Usually 20 marla in much of Pakistan. Confirm locally.", "زیادہ تر پاکستان میں ۲۰ مرلہ۔ مقامی تصدیق کریں۔", "Zyada tar Pakistan mein 20 marla. Muqami tasdeeq karein."),
    doNotCall: L("acre only", "صرف ایکڑ", "sirf acre"),
  },
  {
    id: "crore",
    term: L("Crore", "کروڑ", "Crore"),
    explain: L("1 crore = 1,00,00,000 rupees (100 lakh).", "۱ کروڑ = ۱،۰۰،۰۰،۰۰۰ روپے (۱۰۰ لاکھ)۔", "1 crore = 1,00,00,000 rupay (100 lakh)."),
    doNotCall: L("10 million USD", "۱۰ ملین ڈالر", "10 million USD"),
  },
  {
    id: "lakh",
    term: L("Lakh", "لاکھ", "Lakh"),
    explain: L("1 lakh = 1,00,000 rupees.", "۱ لاکھ = ۱،۰۰،۰۰۰ روپے۔", "1 lakh = 1,00,000 rupay."),
    doNotCall: L("100 thousand / 0.1 million", "۰.۱ ملین", "0.1 million"),
  },
  {
    id: "qabza",
    term: L("Qabza / Possession", "قبضہ", "Qabza"),
    explain: L("Who actually holds the property. Papers and possession can differ.", "جائیداد کس کے پاس ہے۔ کاغذ اور قبضہ الگ ہو سکتے ہیں۔", "Jaedad kis ke paas hai. Kaghaz aur qabza alag ho sakte hain."),
    doNotCall: L("seisin / occupancy title", "سیزن", "seisin"),
  },
  {
    id: "allotment",
    term: L("Allotment", "الاٹمنٹ", "Allotment"),
    explain: L("Society or authority letter naming a plot or file. Not the same as registry.", "سوسائٹی یا اتھارٹی کا خط۔ رجسٹری کے برابر نہیں۔", "Society ya authority ka khat. Registry ke barabar nahi."),
    doNotCall: L("grant deed", "گرانٹ ڈیڈ", "grant deed"),
  },
];

const byId = new Map(TERMS.map((t) => [t.id, t]));

export function termByKey(id: string): TermEntry | undefined {
  return byId.get(id);
}

export function termName(id: string, lang: Lang): string {
  return byId.get(id)?.term[lang] ?? id;
}

/** True if this string is a kept legal term in any language, not a forbidden substitute. */
export function isKeptTermName(id: string, value: string): boolean {
  const t = byId.get(id);
  if (!t) return false;
  const v = value.trim().toLowerCase();
  return [t.term.en, t.term.ur, t.term.roman].some((n) => n.toLowerCase().includes(v) || v.includes(n.toLowerCase()));
}
