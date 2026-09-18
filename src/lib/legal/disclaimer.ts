import type { Localized } from "@/types/check";

function L(en: string, ur: string, roman: string): Localized {
  return { en, ur, roman };
}

/** Required on every report. A qualified Pakistani lawyer may refine this before production. */
export const LEGAL_DISCLAIMER = L(
  "PropertyCheck provides information organization, document analysis, consistency checks, and decision-support tools. It does not constitute legal advice, title certification, ownership certification, or a guarantee that a transaction is safe. Users should obtain authoritative verification and qualified professional advice where appropriate.",
  "پراپرٹی چیک معلومات کی ترتیب، کاغذات کا تجزیہ، میل کھانے کی جانچ، اور فیصلے میں مدد فراہم کرتا ہے۔ یہ قانونی مشورہ، ٹائٹل سرٹیفیکیشن، ملکیت کی سرٹیفیکیشن، یا اس بات کی ضمانت نہیں کہ سودا محفوظ ہے۔ جہاں مناسب ہو، مستند تصدیق اور اہل پیشہ ورانہ مشورہ حاصل کریں۔",
  "PropertyCheck maloomat ki tartib, kaghazat ka tajziya, mail khane ki checks, aur faisle ki madad deta hai. Yeh qanooni mashwara, title certification, ownership certification, ya is baat ki guarantee nahi ke koi deal mehfooz hai. Jahan munasib ho, mustanad tasdeeq aur ehl pesha war se mashwara lein.",
);

export const LEGAL_DISCLAIMER_TITLE = L("Trust and legal", "اعتماد اور قانون", "Bharosa aur qanoon");

export const LEGAL_DISCLAIMER_DRAFT = L(
  "This wording can be improved by a qualified Pakistani legal professional before production.",
  "پروڈکشن سے پہلے ایک اہل پاکستانی قانونی پیشہ ور اس عبارت کو بہتر کر سکتا ہے۔",
  "Production se pehle ek ehl Pakistani qanooni pesha war is ibarat ko behtar kar sakta hai.",
);
