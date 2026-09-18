import type {
  CheckAnswers,
  Finding,
  InfoStatus,
  InfoStatusLevel,
  Localized,
  RiskItem,
} from "@/types/check";

function L(en: string, ur: string, roman: string): Localized {
  return { en, ur, roman };
}

export const INFO_STATUS_META: {
  level: InfoStatusLevel;
  emoji: string;
  label: Localized;
  meaning: Localized;
}[] = [
  {
    level: "low",
    emoji: "🟢",
    label: L("Low attention", "کم توجہ", "Kam tawajjoh"),
    meaning: L(
      "No stop-level flags from the rules. This is not official verification and not a legal safety score.",
      "قواعد سے روکنے والا اشارہ نہیں۔ یہ سرکاری تصدیق نہیں اور قانونی محفوظ اسکور نہیں۔",
      "Qawaid se rokne wala ishara nahi. Yeh sarkari tasdeeq nahi aur qanooni mehfooz score nahi.",
    ),
  },
  {
    level: "verify",
    emoji: "🟡",
    label: L("Needs verification", "تصدیق درکار", "Tasdeeq darkar"),
    meaning: L(
      "Something still needs an office or a qualified professional. User-provided answers are not that check.",
      "ابھی دفتر یا اہل پیشہ ور سے تصدیق چاہیے۔ آپ کے جواب وہ چیک نہیں۔",
      "Abhi daftar ya ehl pesha war se tasdeeq chahiye. Aap ke jawab woh check nahi.",
    ),
  },
  {
    level: "high",
    emoji: "🔴",
    label: L("High attention", "زیادہ توجہ", "Zyada tawajjoh"),
    meaning: L(
      "A rule found something important missing, conflicting, or high-attention. This is not a finding of fraud.",
      "قاعدے نے کوئی اہم چیز غائب، متضاد یا زیادہ توجہ والی پائی۔ یہ فراڈ کا الزام نہیں۔",
      "Qaida ne koi ahem cheez ghaib, mutazad ya zyada tawajjoh wali payi. Yeh fraud ka ilzam nahi.",
    ),
  },
  {
    level: "insufficient",
    emoji: "⚪",
    label: L("Insufficient information", "ناکافی معلومات", "Nakafi maloomat"),
    meaning: L(
      "Too little was answered to describe this property. The rules did not invent a hidden number.",
      "اتنی کم معلومات ہیں کہ جائیداد بیان نہیں ہو سکتی۔ قواعد نے چھپی ہوئی تعداد نہیں بنائی۔",
      "Itni kam maloomat hain ke jaedad bayan nahi ho sakti. Qawaid ne chhupi hui tadad nahi banayi.",
    ),
  },
];

const CORE_FIELDS = 5;

/** How many of the five core questions were answered. Explainable; not an LLM score. */
export function coreAnsweredCount(answers: CheckAnswers): number {
  return [
    !!answers.intent,
    !!answers.propertyKind,
    !!(answers.locationMethod || answers.city || answers.area || answers.locationLabel),
    !!answers.counterparty,
    answers.hasDocuments !== null,
  ].filter(Boolean).length;
}

function meta(level: InfoStatusLevel) {
  return INFO_STATUS_META.find((m) => m.level === level) ?? INFO_STATUS_META[3];
}

/**
 * Discrete information status from listed rules. Never an unexplained 0–100.
 * No LLM path.
 */
export function assessInfoStatus(
  answers: CheckAnswers,
  parts: Pick<{ known: Finding[]; missing: Finding[]; inconsistent: Finding[]; verify: Finding[] }, "known" | "missing" | "inconsistent" | "verify">,
  completeness: { seen: number; missing: number; unknown: number; total: number },
  risks: RiskItem[],
): InfoStatus {
  const core = coreAnsweredCount(answers);
  const stopHits = [...parts.missing, ...parts.inconsistent, ...parts.verify].filter((f) => f.severity === "stop");
  const watchHits = [...parts.missing, ...parts.inconsistent, ...parts.verify].filter((f) => f.severity === "watch");
  const highRisks = risks.filter((r) => r.attention === "high");
  const mediumRisks = risks.filter((r) => r.attention === "medium");
  const checklistVerify = answers.intent === "token"
    ? Object.values(answers.tokenChecklist ?? {}).filter((m) => m === "verify").length
    : 0;

  if (core < 3) {
    return pack("insufficient", [
      L(
        `Only ${core} of ${CORE_FIELDS} core questions were answered (intent, type, location, who you are dealing with, papers seen).`,
        `صرف ${core} از ${CORE_FIELDS} بنیادی سوالوں کے جواب ہیں (ارادہ، قسم، جگہ، کس سے ڈیل، کاغذات دیکھے)۔`,
        `Sirf ${core} az ${CORE_FIELDS} bunyadi sawalon ke jawab hain (irada, qisam, jagah, kis se deal, kaghazat dekhe).`,
      ),
      L(
        "The rules will not invent a number to fill the gaps. This is not a legal safety score.",
        "خالی جگہ بھرنے کے لیے قواعد تعداد نہیں بناتے۔ یہ قانونی محفوظ اسکور نہیں۔",
        "Khali jagah bharne ke liye qawaid tadad nahi banate. Yeh qanooni mehfooz score nahi.",
      ),
    ]);
  }

  if (stopHits.length > 0 || highRisks.length > 0) {
    const reasons: Localized[] = [];
    if (stopHits.length) {
      reasons.push(
        L(
          `${stopHits.length} stop-level finding(s): ${stopHits.slice(0, 3).map((f) => f.title.en).join("; ")}.`,
          `${stopHits.length} روکنے والے اشارے: ${stopHits.slice(0, 3).map((f) => f.title.ur).join("؛ ")}۔`,
          `${stopHits.length} rokne wale ishare: ${stopHits.slice(0, 3).map((f) => f.title.roman).join("; ")}.`,
        ),
      );
    }
    if (highRisks.length) {
      reasons.push(
        L(
          `${highRisks.length} high-attention risk flag(s) from the rule engine (not an LLM).`,
          `${highRisks.length} زیادہ توجہ والے خطرے کے اشارے قواعد سے (LLM نہیں)۔`,
          `${highRisks.length} zyada tawajjoh wale risk ishare qawaid se (LLM nahi).`,
        ),
      );
    }
    reasons.push(
      L(
        "This is Information & Verification Status, not a legal safety score. Official verification remains 0 unless an office or professional confirmed it here.",
        "یہ معلومات اور تصدیق کی حیثیت ہے، قانونی محفوظ اسکور نہیں۔ سرکاری تصدیق 0 رہتی ہے جب تک دفتر یا پیشہ ور یہاں تصدیق نہ کرے۔",
        "Yeh maloomat aur tasdeeq ki haisiyat hai, qanooni mehfooz score nahi. Sarkari tasdeeq 0 rehti hai jab tak daftar ya pesha war yahan tasdeeq na kare.",
      ),
    );
    return pack("high", reasons);
  }

  const needsOffice = watchHits.length > 0 || parts.verify.length > 0 || mediumRisks.length > 0 || checklistVerify > 0
    || (completeness.total > 0 && completeness.seen < completeness.missing + completeness.unknown);

  if (needsOffice) {
    const reasons: Localized[] = [];
    if (watchHits.length || parts.verify.length) {
      reasons.push(
        L(
          `${watchHits.length + parts.verify.length} item(s) still need verification (watch flags or official-check items).`,
          `${watchHits.length + parts.verify.length} چیزیں اب بھی تصدیق مانگتی ہیں (نگرانی یا سرکاری چیک)۔`,
          `${watchHits.length + parts.verify.length} cheezein ab bhi tasdeeq mangti hain (nigrani ya sarkari check).`,
        ),
      );
    }
    if (mediumRisks.length) {
      reasons.push(
        L(
          `${mediumRisks.length} medium-attention risk flag(s) from the rule checklist.`,
          `${mediumRisks.length} درمیانی توجہ کے خطرے کے اشارے قواعد کی فہرست سے۔`,
          `${mediumRisks.length} darmiyani tawajjoh ke risk ishare qawaid ki fehrist se.`,
        ),
      );
    }
    if (checklistVerify) {
      reasons.push(
        L(
          `${checklistVerify} token-checklist point(s) marked “need to verify”.`,
          `${checklistVerify} ٹوکن چیک لسٹ نکات “تصدیق درکار”۔`,
          `${checklistVerify} token checklist nuqte “tasdeeq darkar”.`,
        ),
      );
    }
    if (completeness.total > 0 && completeness.seen < completeness.missing + completeness.unknown) {
      reasons.push(
        L(
          `Papers: ${completeness.seen} seen, ${completeness.missing} missing, ${completeness.unknown} unknown.`,
          `کاغذات: ${completeness.seen} دیکھے، ${completeness.missing} غائب، ${completeness.unknown} نامعلوم۔`,
          `Kaghazat: ${completeness.seen} dekhe, ${completeness.missing} ghaib, ${completeness.unknown} namaloom.`,
        ),
      );
    }
    reasons.push(
      L(
        "Needs verification is not a pass or fail. It is not a legal safety score.",
        "تصدیق درکار پاس یا فیل نہیں۔ قانونی محفوظ اسکور نہیں۔",
        "Tasdeeq darkar pass ya fail nahi. Qanooni mehfooz score nahi.",
      ),
    );
    return pack("verify", reasons);
  }

  return pack("low", [
    L(
      `Core questions answered: ${core} of ${CORE_FIELDS}. No stop-level findings and no high-attention risk flags.`,
      `بنیادی سوال: ${core} از ${CORE_FIELDS}۔ روکنے والا اشارہ اور زیادہ توجہ کا خطرہ نہیں۔`,
      `Bunyadi sawal: ${core} az ${CORE_FIELDS}. Rokne wala ishara aur zyada tawajjoh ka khatra nahi.`,
    ),
    L(
      "Low attention is not legally safe and not Verified. Verified stays 0 until an official source or qualified professional confirms it through this platform.",
      "کم توجہ قانونی طور پر محفوظ نہیں اور Verified نہیں۔ Verified 0 رہتا ہے جب تک سرکاری ذریعہ یا اہل پیشہ ور اس پلیٹ فارم پر تصدیق نہ کرے۔",
      "Kam tawajjoh qanooni taur par mehfooz nahi aur Verified nahi. Verified 0 rehta hai jab tak sarkari source ya ehl pesha war is platform par tasdeeq na kare.",
    ),
  ]);
}

function pack(level: InfoStatusLevel, reasons: Localized[]): InfoStatus {
  const m = meta(level);
  return {
    level,
    engine: "rules",
    emoji: m.emoji,
    label: m.label,
    reasons,
  };
}
