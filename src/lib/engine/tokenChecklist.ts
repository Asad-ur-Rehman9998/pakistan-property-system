import type {
  CheckAnswers,
  ChecklistMark,
  EvidenceSource,
  Finding,
  Localized,
  RiskItem,
  TokenChecklistId,
  TokenChecklistReport,
} from "@/types/check";
import { TOKEN_CHECKLIST_IDS } from "@/types/check";

function L(en: string, ur: string, roman: string): Localized {
  return { en, ur, roman };
}

export type TokenChecklistDef = {
  id: TokenChecklistId;
  title: Localized;
  hint: Localized;
  /** Missing this before token is a stop, not a note. */
  critical: boolean;
};

export const TOKEN_CHECKLIST: TokenChecklistDef[] = [
  {
    id: "seller_identity",
    critical: true,
    title: L("Seller identity", "بیچنے والے کی شناخت", "Bechne wale ki shanakht"),
    hint: L(
      "Match the person collecting token with the name on the ownership paper and CNIC. Store last-4 only in this app. Confirmed means you saw them — not that NADRA verified them here.",
      "ٹوکن لینے والے کا نام ملکیت کے کاغذ اور شناختی کارڈ سے ملائیں۔ اس ایپ میں صرف آخری چار ہندسے۔ Confirmed کا مطلب آپ نے دیکھا — NADRA نے یہاں تصدیق نہیں کی۔",
      "Token lene wale ka naam malkiat ke kaghaz aur CNIC se milayen. Is app mein sirf last-4. Confirmed ka matlab aap ne dekha — NADRA ne yahan tasdeeq nahi ki.",
    ),
  },
  {
    id: "ownership",
    critical: true,
    title: L("Ownership information", "ملکیت کی معلومات", "Malkiat ki maloomat"),
    hint: L(
      "Fard, registry, allotment, or original file in the same name. This platform cannot pull the official record.",
      "فرد، رجسٹری، الاٹمنٹ یا اصل فائل اسی نام پر۔ یہ پلیٹ فارم سرکاری ریکارڈ نہیں کھینچتا۔",
      "Fard, registry, allotment ya asli file usi naam par. Yeh platform sarkari record nahi kheenchta.",
    ),
  },
  {
    id: "property_documents",
    critical: true,
    title: L("Property documents", "جائیداد کے کاغذات", "Jaedad ke kaghazat"),
    hint: L(
      "Original papers you held in your hand — not only WhatsApp photos.",
      "اصل کاغذات جو ہاتھ میں لیے — صرف واٹس ایپ تصاویر نہیں۔",
      "Asal kaghazat jo haath mein liye — sirf WhatsApp tasveerein nahi.",
    ),
  },
  {
    id: "boundaries",
    critical: false,
    title: L("Property boundaries", "جائیداد کی حدود", "Jaedad ki hudood"),
    hint: L(
      "Plot on the society map, or khasra on the ground, matches the paper. Walk it. Ask two neighbours.",
      "سوسائٹی کے نقشے کا پلاٹ، یا زمین کا خسرہ، کاغذ سے ملے۔ چل کر دیکھیں۔ دو پڑوسیوں سے پوچھیں۔",
      "Society ke naqshe ka plot, ya zameen ka khasra, kaghaz se mile. Chal kar dekhein. Do padosiyon se poochen.",
    ),
  },
  {
    id: "outstanding_issues",
    critical: false,
    title: L("Outstanding issues", "باقی مسائل", "Baqi masail"),
    hint: L(
      "Court case, family dispute, stay order, or double booking — you asked. This is not a finding of fraud.",
      "مقدمہ، خاندانی جھگڑا، سٹے آرڈر یا دوہری بکنگ — آپ نے پوچھا۔ یہ فراڈ کا الزام نہیں۔",
      "Muqadma, khandani jhagra, stay order ya dohri booking — aap ne poocha. Yeh fraud ka ilzam nahi.",
    ),
  },
  {
    id: "society_developer",
    critical: false,
    title: L("Society / developer status", "سوسائٹی / ڈویلپر کی حیثیت", "Society / developer ki haisiyat"),
    hint: L(
      "Approved society, transfer letter, developer dues. Mark N/A if this is village land with no society.",
      "منظور سوسائٹی، ٹرانسفر لیٹر، ڈویلپر بقایا۔ اگر گاؤں کی زمین ہے اور سوسائٹی نہیں تو N/A۔",
      "Manzoor society, transfer letter, developer baqaya. Agar gaon ki zameen hai aur society nahi to N/A.",
    ),
  },
  {
    id: "possession",
    critical: false,
    title: L("Possession", "قبضہ", "Qabza"),
    hint: L(
      "Who lives or occupies it, and a written date to leave if it is not empty.",
      "کون رہتا یا قابض ہے، اور اگر خالی نہیں تو چھڑانے کی لکھی تاریخ۔",
      "Kaun rehta ya qabiz hai, aur agar khali nahi to chhurane ki likhi tareekh.",
    ),
  },
  {
    id: "utilities",
    critical: false,
    title: L("Utilities", "یوٹیلیٹیز", "Utilities"),
    hint: L(
      "Bills in whose name, arrears, meter. Mark N/A if it is a vacant plot with no connection.",
      "بل کس کے نام، بقایا، میٹر۔ خالی پلاٹ اور کنکشن نہ ہو تو N/A۔",
      "Bill kis ke naam, baqaya, meter. Khali plot aur connection na ho to N/A.",
    ),
  },
  {
    id: "taxes_dues",
    critical: false,
    title: L("Taxes / dues where applicable", "ٹیکس / بقایا جہاں لاگو ہوں", "Tax / baqaya jahan lagu hon"),
    hint: L(
      "Property tax, society dues, development charges. Mark N/A if none apply.",
      "پراپرٹی ٹیکس، سوسائٹی بقایا، ڈیولپمنٹ چارجز۔ اگر کچھ لاگو نہ ہو تو N/A۔",
      "Property tax, society baqaya, development charges. Agar kuch lagu na ho to N/A.",
    ),
  },
  {
    id: "sale_agreement",
    critical: true,
    title: L("Sale agreement", "فروخت کا معاہدہ", "Farokht ka muahida"),
    hint: L(
      "Written bayana / agreement to sell, including refund if papers fail. A WhatsApp chat is not enough.",
      "لکھا بیعانہ / فروخت کا معاہدہ، کاغذات فیل ہونے پر واپسی سمیت۔ واٹس ایپ کافی نہیں۔",
      "Likha bayana / farokht ka muahida, kaghazat fail hone par wapsi samet. WhatsApp kafi nahi.",
    ),
  },
  {
    id: "payment_details",
    critical: true,
    title: L("Payment details", "ادائیگی کی تفصیل", "Adaiagi ki tafseel"),
    hint: L(
      "Token amount, date, and a bank trail or signed receipt. Cash-only with no paper is high attention.",
      "ٹوکن کی رقم، تاریخ، اور بینک ریکارڈ یا دستخط شدہ رسید۔ بغیر کاغذ نقد زیادہ توجہ ہے۔",
      "Token ki raqam, tareekh, aur bank record ya dastakhat shuda raseed. Baghair kaghaz naqd zyada tawajjoh hai.",
    ),
  },
  {
    id: "legal_review",
    critical: true,
    title: L("Professional / legal review", "پیشہ ور / قانونی جائزہ", "Pesha war / qanooni jaiza"),
    hint: L(
      "A qualified lawyer or the relevant office. This platform is not that review. Mark Confirmed only if they actually reviewed this deal — not because someone said lawyer later.",
      "اہل وکیل یا متعلقہ دفتر۔ یہ پلیٹ فارم وہ جائزہ نہیں۔ Confirmed صرف تب جب انہوں نے واقعی دیکھا — 'وکیل بعد میں' پر نہیں۔",
      "Ehl wakeel ya mutaliqa daftar. Yeh platform woh jaiza nahi. Confirmed sirf tab jab unhon ne waqai dekha — 'wakeel baad mein' par nahi.",
    ),
  },
];

const CRITICAL = new Set(TOKEN_CHECKLIST.filter((d) => d.critical).map((d) => d.id));

export function checklistDef(id: TokenChecklistId): TokenChecklistDef {
  return TOKEN_CHECKLIST.find((d) => d.id === id) ?? TOKEN_CHECKLIST[0];
}

export function isTokenChecklistKey(key: string): key is `dd:${TokenChecklistId}` {
  return key.startsWith("dd:") && TOKEN_CHECKLIST_IDS.includes(key.slice(3) as TokenChecklistId);
}

export function markOf(answers: CheckAnswers, id: TokenChecklistId): ChecklistMark | "unanswered" {
  return answers.tokenChecklist?.[id] ?? "unanswered";
}

function sourceFor(mark: ChecklistMark | "unanswered"): EvidenceSource {
  if (mark === "confirmed") return "user_provided";
  if (mark === "verify") return "needs_verification";
  if (mark === "missing") return "unknown";
  if (mark === "na") return "unknown";
  return "unknown";
}

export function tokenChecklistReport(answers: CheckAnswers): TokenChecklistReport | null {
  if (answers.intent !== "token") return null;
  const counts = { confirmed: 0, verify: 0, missing: 0, na: 0, unanswered: 0 };
  const items = TOKEN_CHECKLIST.map((def) => {
    const mark = markOf(answers, def.id);
    counts[mark] += 1;
    return { id: def.id, mark, title: def.title, hint: def.hint };
  });
  return { items, counts };
}

export function tokenChecklistFindings(answers: CheckAnswers): Finding[] {
  if (answers.intent !== "token") return [];
  const out: Finding[] = [];
  for (const def of TOKEN_CHECKLIST) {
    const mark = markOf(answers, def.id);
    if (mark === "na") continue;
    const id = `dd_${def.id}`;
    if (mark === "confirmed") {
      out.push({
        id,
        kind: "known",
        severity: "info",
        source: "user_provided",
        title: L(
          `${def.title.en}: marked confirmed (user-provided)`,
          `${def.title.ur}: confirmed درج (آپ کی بتائی)`,
          `${def.title.roman}: confirmed darj (aap ki batayi)`,
        ),
        why: L(
          "You marked this confirmed. That is not official verification. PropertyCheck Pakistan has not confirmed it through a government office or a qualified professional on this platform.",
          "آپ نے اسے confirmed لکھا۔ یہ سرکاری تصدیق نہیں۔ پراپرٹی چیک پاکستان نے دفتر یا اہل پیشہ ور سے یہاں تصدیق نہیں کی۔",
          "Aap ne ise confirmed likha. Yeh sarkari tasdeeq nahi. PropertyCheck Pakistan ne daftar ya ehl pesha war se yahan tasdeeq nahi ki.",
        ),
        doNow: L(
          "Still match original papers and visit the relevant office before paying token.",
          "پھر بھی اصل کاغذات ملائیں اور ٹوکن سے پہلے متعلقہ دفتر جائیں۔",
          "Phir bhi asal kaghazat milayen aur token se pehle mutaliqa daftar jaen.",
        ),
      });
      continue;
    }
    if (mark === "verify") {
      out.push({
        id,
        kind: "verify",
        severity: "watch",
        source: "needs_verification",
        title: L(
          `${def.title.en}: needs verification before token`,
          `${def.title.ur}: ٹوکن سے پہلے تصدیق درکار`,
          `${def.title.roman}: token se pehle tasdeeq darkar`,
        ),
        why: def.hint,
        doNow: L(
          "Do not treat this as settled. Check it at the office or with a qualified professional.",
          "اسے طے شدہ نہ سمجھیں۔ دفتر یا اہل پیشہ ور سے چیک کریں۔",
          "Ise tay shuda na samjhein. Daftar ya ehl pesha war se check karein.",
        ),
      });
      continue;
    }
    const stop = CRITICAL.has(def.id);
    out.push({
      id,
      kind: "missing",
      severity: stop ? "stop" : "watch",
      source: sourceFor(mark),
      title: L(
        `${def.title.en}: ${mark === "missing" ? "marked missing" : "not marked yet"}`,
        `${def.title.ur}: ${mark === "missing" ? "غائب درج" : "ابھی نشان نہیں"}`,
        `${def.title.roman}: ${mark === "missing" ? "ghaib darj" : "abhi nishan nahi"}`,
      ),
      why: def.hint,
      doNow: L(
        stop
          ? "Do not pay token until this point is seen in writing or at the relevant office."
          : "Ask and write the answer before money moves.",
        stop
          ? "جب تک یہ نکتہ لکھ کر یا دفتر میں نہ دیکھیں، ٹوکن نہ دیں۔"
          : "پیسے سے پہلے پوچھیں اور لکھیں۔",
        stop
          ? "Jab tak yeh nuqta likh kar ya daftar mein na dekhein, token na dein."
          : "Paise se pehle poochen aur likhein.",
      ),
    });
  }
  return out;
}

export function tokenChecklistRisks(answers: CheckAnswers): RiskItem[] {
  if (answers.intent !== "token") return [];
  const items: RiskItem[] = [];
  for (const def of TOKEN_CHECKLIST) {
    const mark = markOf(answers, def.id);
    if (mark === "na" || mark === "confirmed") continue;
    const critical = CRITICAL.has(def.id);
    const attention = mark === "missing" && critical ? "high" : mark === "verify" ? "medium" : "medium";
    const lane = def.id === "seller_identity" || def.id === "ownership" ? "seller_mismatch" : "missing_info";
    items.push({
      id: `risk_dd_${def.id}`,
      lane,
      attention,
      title: L(
        `${def.title.en} is not settled before token`,
        `${def.title.ur} ٹوکن سے پہلے طے نہیں`,
        `${def.title.roman} token se pehle tay nahi`,
      ),
      why: def.hint,
      evidence: L(
        `Checklist mark: ${mark === "unanswered" ? "not marked" : mark}. Source: ${sourceFor(mark)}. Not official verification.`,
        `چیک لسٹ نشان: ${mark === "unanswered" ? "نہیں لگایا" : mark}۔ ذریعہ: ${sourceFor(mark)}۔ سرکاری تصدیق نہیں۔`,
        `Checklist nishan: ${mark === "unanswered" ? "nahi lagaya" : mark}. Source: ${sourceFor(mark)}. Sarkari tasdeeq nahi.`,
      ),
      doNow: L(
        critical
          ? "Stop token until this is written or checked at the relevant office."
          : "Write the answer, then still verify at the office.",
        critical
          ? "جب تک یہ لکھا یا دفتر میں چیک نہ ہو، ٹوکن روکیں۔"
          : "جواب لکھیں، پھر بھی دفتر میں تصدیق کریں۔",
        critical
          ? "Jab tak yeh likha ya daftar mein check na ho, token rokein."
          : "Jawab likhein, phir bhi daftar mein tasdeeq karein.",
      ),
      source: sourceFor(mark),
    });
  }
  return items;
}
