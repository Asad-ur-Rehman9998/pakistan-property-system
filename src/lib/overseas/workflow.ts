import type { Localized } from "@/types/check";

function L(en: string, ur: string, roman: string): Localized {
  return { en, ur, roman };
}

export type { BuyerLocation } from "@/types/check";

/** Conceptual path for a buyer who is abroad. Not a legally binding process. */
export const OVERSEAS_STAGE_IDS = [
  "buyer_abroad",
  "property_location",
  "documents",
  "remote_verification",
  "professional_review",
  "report",
  "representative",
  "decision",
] as const;

export type OverseasStageId = (typeof OVERSEAS_STAGE_IDS)[number];

export const OVERSEAS_STAGES: { id: OverseasStageId; title: Localized; hint: Localized }[] = [
  {
    id: "buyer_abroad",
    title: L("Buying in Pakistan while abroad", "بیرون ملک سے پاکستان میں خریداری", "Pakistan mein kharidari, ab bahar hoon"),
    hint: L(
      "You are outside Pakistan and want to understand a property before money moves.",
      "آپ پاکستان سے باہر ہیں اور پیسے سے پہلے جائیداد سمجھنا چاہتے ہیں۔",
      "Aap Pakistan se bahar hain aur paise se pehle jaedad samajhna chahte hain.",
    ),
  },
  {
    id: "property_location",
    title: L("Property location", "جائیداد کی جگہ", "Jaedad ki jagah"),
    hint: L("City, society or mouza, plot or khasra — still user-provided.", "شہر، سوسائٹی یا موضع، پلاٹ یا خسرہ — اب بھی آپ نے بتایا۔", "Shehar, society ya mouza, plot ya khasra — ab bhi aap ne bataya."),
  },
  {
    id: "documents",
    title: L("Documents", "کاغذات", "Kaghazat"),
    hint: L("Photos on this phone. Not a government pull.", "تصویریں اس فون پر۔ سرکاری ریکارڈ نہیں۔", "Tasveerein is phone par. Sarkari record nahi."),
  },
  {
    id: "remote_verification",
    title: L("Remote verification workflow", "دور سے تصدیق کا راستہ", "Door se tasdeeq ka raasta"),
    hint: L(
      "Video, paper photos, and a helper in Pakistan. None of this is official verification.",
      "ویڈیو، کاغذ کی تصویر، پاکستان میں مددگار۔ یہ سرکاری تصدیق نہیں۔",
      "Video, kaghaz ki tasveer, Pakistan mein madadgar. Yeh sarkari tasdeeq nahi.",
    ),
  },
  {
    id: "professional_review",
    title: L("Professional review", "پیشہ ور جائزہ", "Pesha war jaiza"),
    hint: L(
      "A lawyer or consultant can be asked to review. That is not a government stamp.",
      "وکیل یا کنسلٹنٹ سے جائزہ مانگ سکتے ہیں۔ یہ سرکاری مہر نہیں۔",
      "Wakeel ya consultant se jaiza maang sakte hain. Yeh sarkari mohr nahi.",
    ),
  },
  {
    id: "report",
    title: L("Report", "رپورٹ", "Report"),
    hint: L("Decision support. Not a legal certificate.", "فیصلے کی مدد۔ قانونی سرٹیفکیٹ نہیں۔", "Faisle ki madad. Qanooni certificate nahi."),
  },
  {
    id: "representative",
    title: L("Authorized representative", "اختیاری نمائندہ", "Authorized representative"),
    hint: L(
      "A person in Pakistan you named. Not a legally valid power of attorney on this platform.",
      "پاکستان میں وہ شخص جس کا نام آپ نے لکھا۔ اس پلیٹ فارم پر قانونی مختارنامہ نہیں۔",
      "Pakistan mein woh shakhs jiska naam aap ne likha. Is platform par qanooni mukhtarnama nahi.",
    ),
  },
  {
    id: "decision",
    title: L("Decision", "فیصلہ", "Faisla"),
    hint: L("Pause, ask, or proceed only after independent checks.", "رکیں، پوچھیں، یا الگ تصدیق کے بعد آگے بڑھیں۔", "Rukein, poochen, ya alag tasdeeq ke baad aage barhein."),
  },
];

export const OVERSEAS_POA_LIMIT = L(
  "This app does not certify a power of attorney or identity. Official verification required until an authoritative source confirms it through this platform.",
  "یہ ایپ مختارنامہ یا شناخت کی تصدیق نہیں کرتی۔ Official verification required جب تک مستند ذریعہ اس پلیٹ فارم پر تصدیق نہ کرے۔",
  "Yeh app mukhtarnama ya shanakht ki tasdeeq nahi karti. Official verification required jab tak mustanad source is platform par tasdeeq na kare.",
);
