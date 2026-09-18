import type {
  CheckAnswers,
  EvidenceSource,
  Finding,
  Localized,
  PaperField,
  PaperRead,
  RiskAttention,
  RiskItem,
  RiskLane,
} from "@/types/check";
import { fieldValue } from "@/lib/docai/extract";
import { isConsistencyFinding } from "@/lib/docai/consistency";
import { namesConflict } from "@/lib/docai/names";
import { parsePkr } from "@/lib/pakistan/money";
import type { NoteHit } from "./scanNotes";

function L(en: string, ur: string, roman: string): Localized {
  return { en, ur, roman };
}

/** Deterministic pipeline order. No LLM. */
export const RISK_LANES: { id: RiskLane; title: Localized }[] = [
  { id: "missing_info", title: L("Missing required information", "ضروری معلومات غائب", "Zaroori maloomat ghaib") },
  { id: "document_inconsistency", title: L("Document inconsistency", "کاغذات میں تضاد", "Kaghazat mein tazad") },
  { id: "location_inconsistency", title: L("Location inconsistency", "جگہ میں تضاد", "Jagah mein tazad") },
  { id: "seller_mismatch", title: L("Seller information mismatch", "بیچنے والے کی معلومات نہیں ملتیں", "Bechne wale ki maloomat nahi milti") },
  { id: "unusual_pricing", title: L("Unusual pricing", "غیر معمولی قیمت", "Ghair mamooli qeemat") },
  { id: "suspicious_listing", title: L("Duplicate / suspicious listing", "دوہری / مشکوک لسٹنگ", "Dohri / mashkook listing") },
  { id: "unverified_claims", title: L("Unverified claims", "غیر تصدیق شدہ دعوے", "Ghair tasdeeq shuda daaway") },
  { id: "risk_indicators", title: L("Potential risk indicators", "ممکنہ خطرے کے اشارے", "Mumkina khatre ke ishare") },
];

const LANE_ORDER = RISK_LANES.map((l) => l.id);

const ATTENTION_ORDER: Record<RiskAttention, number> = { high: 0, medium: 1, low: 2 };

const OWNERSHIP_IDS = ["fard", "ownership", "owner_proof", "original_file"];

const CLAIM_NEEDLES = [
  "verified",
  "legally clear",
  "legal clear",
  "no issue",
  "papers clear",
  "100% clear",
  "guarantee original",
  "already approved",
  "تصدیق شدہ",
  "قانونی طور پر صاف",
  "koi masla nahi",
  "papers clear hain",
];

const CHAT_LEADS = new Set(["whatsapp", "facebook", "listing"]);

function usable(read: PaperRead): boolean {
  return read.ocrStatus === "done" || read.ocrStatus === "skipped";
}

function usableField(f: PaperField): boolean {
  return !!f.value && f.confirmed !== false;
}

function paperValue(reads: PaperRead[], key: PaperField["key"]): string | null {
  return fieldValue(
    reads.flatMap((r) => r.fields.filter(usableField)),
    key,
  );
}

function placesDiffer(a: string, b: string): boolean {
  const na = a.toLowerCase().replace(/\s+/g, " ").trim();
  const nb = b.toLowerCase().replace(/\s+/g, " ").trim();
  if (na.length < 3 || nb.length < 3) return false;
  if (na === nb) return false;
  if (na.includes(nb) || nb.includes(na)) return false;
  return true;
}

function evidenceLines(rows: { label: string; value: string }[]): Localized {
  const text = rows.map((r) => `${r.label}: ${r.value}`).join("\n");
  return L(text, text, text);
}

function item(
  id: string,
  lane: RiskLane,
  attention: RiskAttention,
  title: Localized,
  why: Localized,
  evidence: Localized,
  doNow: Localized,
  source: EvidenceSource = "needs_verification",
): RiskItem {
  return { id, lane, attention, title, why, evidence, doNow, source };
}

function flag(a: CheckAnswers, id: string) {
  return a.flags[id];
}

function have(a: CheckAnswers, id: string) {
  return a.documents[id] === "have";
}

function verifyBeforeToken(): Localized {
  return L(
    "Ask the seller for clarification and obtain authoritative verification before paying token money.",
    "بیچنے والے سے وضاحت مانگیں اور ٹوکن سے پہلے مستند تصدیق کروائیں۔",
    "Bechne wale se wazahat mangein aur token se pehle mustanad tasdeeq karwaen.",
  );
}

function missingInfo(answers: CheckAnswers): RiskItem[] {
  const out: RiskItem[] = [];
  const anyOwnership = OWNERSHIP_IDS.some((id) => have(answers, id));
  if (!anyOwnership) {
    out.push(
      item(
        "risk_missing_ownership",
        "missing_info",
        "high",
        L("Required ownership paper is missing", "ملکیت کا ضروری کاغذ غائب ہے", "Malkiat ka zaroori kaghaz ghaib hai"),
        L(
          "Without a fard, registry, allotment, or original file, ownership cannot be determined from this check.",
          "فرد، رجسٹری، الاٹمنٹ یا اصل فائل کے بغیر اس چیک سے ملکیت کا تعین نہیں ہو سکتا۔",
          "Fard, registry, allotment ya asal file ke baghair is check se malkiat ka taeen nahi ho sakta.",
        ),
        L(
          "You have not marked a core ownership paper as seen. Source: unknown.",
          "آپ نے بنیادی ملکیت کا کاغذ دیکھا ہوا نہیں بتایا۔ ذریعہ: نامعلوم۔",
          "Aap ne bunyadi malkiat ka kaghaz dekha hua nahi bataya. Source: namaloom.",
        ),
        L(
          "Do not pay token. Get a fresh copy from the relevant office, then match it to this property.",
          "ٹوکن نہ دیں۔ متعلقہ دفتر سے نئی کاپی لیں، پھر اسی جائیداد سے ملائیں۔",
          "Token na dein. Mutaliqa daftar se nayi copy lein, phir isi jaedad se milayen.",
        ),
        "unknown",
      ),
    );
  }
  if ((answers.intent === "token" || answers.intent === "buy") && answers.documents.bayana_written !== "have") {
    out.push(
      item(
        "risk_missing_token_writing",
        "missing_info",
        "high",
        L("Written token / bayana terms are missing", "لکھا ہوا ٹوکن / بیعانہ غائب ہے", "Likha hua token / bayana ghaib hai"),
        L(
          "Required payment terms are not written. Spoken or chat promises are not enough if the deal stops.",
          "ضروری ادائیگی کی شرائط لکھی نہیں۔ ڈیل رکے تو زبانی یا چیٹ وعدے کافی نہیں۔",
          "Zaroori adaiagi ki sharaet likhi nahi. Deal ruke to zabani ya chat wadey kafi nahi.",
        ),
        L(
          "Bayana / token writing: not marked as seen. Source: unknown.",
          "بیعانہ / ٹوکن لکھائی: دیکھی ہوئی نہیں بتائی گئی۔ ذریعہ: نامعلوم۔",
          "Bayana / token likhai: dekhi hui nahi batayi gai. Source: namaloom.",
        ),
        L(
          "Write amount, property identity, dates, and refund before any money moves.",
          "پیسے سے پہلے رقم، جائیداد، تاریخیں اور واپسی لکھیں۔",
          "Paise se pehle raqam, jaedad, tareekhein aur wapsi likhein.",
        ),
        "unknown",
      ),
    );
  }
  if (
    (answers.intent === "buy" || answers.intent === "token") &&
    answers.settlement === "urban" &&
    answers.propertyKind !== "agri" &&
    !answers.plotNumber?.trim()
  ) {
    out.push(
      item(
        "risk_missing_plot",
        "missing_info",
        "medium",
        L("Plot / file number is not written", "پلاٹ / فائل نمبر لکھا نہیں", "Plot / file number likha nahi"),
        L(
          "Required identity information is missing. In a society, 'this house' is how the wrong parcel is sold.",
          "ضروری شناخت غائب ہے۔ سوسائٹی میں صرف 'یہ گھر' کہنا غلط پلاٹ بیچنے کا طریقہ ہے۔",
          "Zaroori shanakht ghaib hai. Society mein sirf 'yeh ghar' kehna ghalat plot bechne ka tareeqa hai.",
        ),
        L("Plot / file number: blank. Source: unknown.", "پلاٹ / فائل نمبر: خالی۔ ذریعہ: نامعلوم۔", "Plot / file number: khali. Source: namaloom."),
        verifyBeforeToken(),
        "unknown",
      ),
    );
  }
  if (
    (answers.settlement === "rural" || answers.propertyKind === "agri") &&
    !answers.khasraNumber?.trim() &&
    answers.intent !== "rent"
  ) {
    out.push(
      item(
        "risk_missing_khasra",
        "missing_info",
        "medium",
        L("Khasra / khewat number is not written", "خسرہ / کھیوت نمبر لکھا نہیں", "Khasra / khewat number likha nahi"),
        L(
          "Village land is identified by these numbers. They are still required information.",
          "گاؤں کی زمین ان نمبروں سے پہچانی جاتی ہے۔ یہ اب بھی ضروری معلومات ہیں۔",
          "Gaon ki zameen in numberon se pehchani jati hai. Yeh ab bhi zaroori maloomat hain.",
        ),
        L("Khasra / khewat: blank. Source: unknown.", "خسرہ / کھیوت: خالی۔ ذریعہ: نامعلوم۔", "Khasra / khewat: khali. Source: namaloom."),
        verifyBeforeToken(),
        "unknown",
      ),
    );
  }
  if (answers.hasDocuments === "no" || answers.hasDocuments === "unsure") {
    out.push(
      item(
        "risk_missing_papers",
        "missing_info",
        answers.hasDocuments === "no" ? "high" : "medium",
        L("Required papers have not been seen", "ضروری کاغذات دیکھے نہیں گئے", "Zaroori kaghazat dekhe nahi gaye"),
        L(
          "This check is incomplete until original papers for this property are seen.",
          "جب تک اسی جائیداد کے اصل کاغذات نہ دیکھے جائیں یہ چیک ادھورا ہے۔",
          "Jab tak isi jaedad ke asal kaghazat na dekhe jaen yeh check adhoora hai.",
        ),
        L(
          `Has documents: ${answers.hasDocuments === "no" ? "no" : "not sure"}. Source: user-provided.`,
          `کاغذات: ${answers.hasDocuments === "no" ? "نہیں" : "پتہ نہیں"}۔ ذریعہ: آپ کی بتائی معلومات۔`,
          `Kaghazat: ${answers.hasDocuments === "no" ? "nahi" : "pata nahi"}. Source: user-provided.`,
        ),
        L(
          "Ask to see originals. If they cannot be shown, wait.",
          "اصل کاغذات مانگیں۔ اگر نہ دکھائیں تو انتظار کریں۔",
          "Asal kaghazat mangein. Agar na dikhaen to intezar karein.",
        ),
        "user_provided",
      ),
    );
  }
  return out;
}

function attentionForPaper(id: string): RiskAttention {
  if (id.includes("units")) return "medium";
  if (id.includes("area") || id.includes("plot") || id.includes("khasra") || id.includes("cnic") || id.includes("khewat")) {
    return "high";
  }
  return "medium";
}

function paperLane(id: string): RiskLane | null {
  if (!isConsistencyFinding({ id } as Finding)) return null;
  if (id.includes("ownerName") || id.includes("typed_owner") || id.includes("otherParty")) return "seller_mismatch";
  if (id.includes("society") || id.includes("mouza") || id.includes("location")) return "location_inconsistency";
  return "document_inconsistency";
}

function fromPaperFinding(f: Finding, lane: RiskLane): RiskItem {
  return item(`risk_${f.id}`, lane, attentionForPaper(f.id), f.title, f.why, f.why, f.doNow, f.source);
}

function locationItems(answers: CheckAnswers, reads: PaperRead[]): RiskItem[] {
  const out: RiskItem[] = [];
  const paperSociety = paperValue(reads, "societyName");
  const paperMouza = paperValue(reads, "mouza");
  const paperLoc = paperValue(reads, "location");
  const typedSociety = answers.societyName.trim() || answers.area.trim();
  if (typedSociety && paperSociety && placesDiffer(typedSociety, paperSociety)) {
    out.push(
      item(
        "risk_location_society",
        "location_inconsistency",
        "high",
        L("Location information could not be reconciled", "جگہ کی معلومات میل نہیں کھاتیں", "Jagah ki maloomat mail nahi khatin"),
        L(
          "The society or area you entered does not match the information extracted from an uploaded document.",
          "آپ کی بتائی سوسائٹی یا علاقہ اپلوڈ دستاویز سے نہیں ملتا۔",
          "Aap ki batayi society ya ilaqa upload dastavez se nahi milta.",
        ),
        evidenceLines([
          { label: "What you typed", value: typedSociety },
          { label: "From a paper", value: paperSociety },
        ]),
        verifyBeforeToken(),
      ),
    );
  }
  if (answers.village.trim() && paperMouza && placesDiffer(answers.village, paperMouza)) {
    out.push(
      item(
        "risk_location_mouza",
        "location_inconsistency",
        "high",
        L("Mauza / village does not match the papers", "موضع / گاؤں کاغذات سے نہیں ملتا", "Mauza / gaon kaghazat se nahi milta"),
        L(
          "The village you entered does not match the mauza extracted from an uploaded document.",
          "آپ کا بتایا گاؤں اپلوڈ دستاویز کے موضع سے نہیں ملتا۔",
          "Aap ka bataya gaon upload dastavez ke mauza se nahi milta.",
        ),
        evidenceLines([
          { label: "What you typed", value: answers.village.trim() },
          { label: "From a paper", value: paperMouza },
        ]),
        verifyBeforeToken(),
      ),
    );
  }
  if (answers.city.trim() && paperLoc && placesDiffer(answers.city, paperLoc)) {
    out.push(
      item(
        "risk_location_city",
        "location_inconsistency",
        "medium",
        L("City / district does not match the papers", "شہر / ضلع کاغذات سے نہیں ملتا", "Shehar / zila kaghazat se nahi milta"),
        L(
          "The place you entered does not match the location extracted from an uploaded document. Unable to determine which is right.",
          "آپ کی بتائی جگہ اپلوڈ دستاویز سے نہیں ملتی۔ تعین نہیں کون سی درست ہے۔",
          "Aap ki batayi jagah upload dastavez se nahi milti. Taeen nahi kaun si durust hai.",
        ),
        evidenceLines([
          { label: "What you typed", value: answers.city.trim() },
          { label: "From a paper", value: paperLoc },
        ]),
        verifyBeforeToken(),
      ),
    );
  }
  return out;
}

function sellerItems(answers: CheckAnswers, reads: PaperRead[]): RiskItem[] {
  const paperOwner = paperValue(reads, "ownerName");
  const typed = answers.ownerNameOnPaper.trim();
  const typedClash = typed && paperOwner && namesConflict(typed, paperOwner);
  const paperClash = reads.length >= 2 && reads.some((r, i) => {
    const a = r.fields.find((f) => f.key === "ownerName" && usableField(f))?.value;
    if (!a) return false;
    return reads.slice(i + 1).some((o) => {
      const b = o.fields.find((f) => f.key === "ownerName" && usableField(f))?.value;
      return b ? namesConflict(a, b) : false;
    });
  });
  const flagNo = flag(answers, "name_match") === "no";
  const flagUnsure = flag(answers, "name_match") === "unsure";
  if (!typedClash && !paperClash && !flagNo && !flagUnsure) return [];

  const rows: { label: string; value: string }[] = [];
  if (typedClash && typed && paperOwner) {
    rows.push({ label: "What you typed", value: typed }, { label: "From a paper", value: paperOwner });
  } else if (paperClash) {
    reads.forEach((r, i) => {
      const v = r.fields.find((f) => f.key === "ownerName" && usableField(f))?.value;
      if (v) rows.push({ label: `Document ${String.fromCharCode(65 + i)}`, value: v });
    });
  } else if (flagNo || flagUnsure) {
    rows.push({
      label: "Your answer",
      value: flagNo ? "Seller name does not match the papers" : "Seller identity vs papers is not confirmed",
    });
  }

  const why = typedClash
    ? L(
        "The seller information provided by the user does not match the information extracted from the uploaded document.",
        "صارف کی بتائی بیچنے والے کی معلومات اپلوڈ دستاویز سے نہیں ملتیں۔",
        "User ki batayi bechne wale ki maloomat upload dastavez se nahi milti.",
      )
    : paperClash
      ? L(
          "Owner names on the uploaded documents do not match. Unable to determine which paper is right.",
          "اپلوڈ کاغذات پر مالک کے نام نہیں ملتے۔ تعین نہیں کون سا کاغذ درست ہے۔",
          "Upload kaghazat par malik ke naam nahi milte. Taeen nahi kaun sa kaghaz durust hai.",
        )
      : L(
          "The seller information you entered could not be reconciled with the papers. Unable to determine who can deal.",
          "بیچنے والے کی معلومات کاغذات سے میل نہیں کھاتیں۔ تعین نہیں کون ڈیل کر سکتا ہے۔",
          "Bechne wale ki maloomat kaghazat se mail nahi khatin. Taeen nahi kaun deal kar sakta hai.",
        );

  return [
    item(
      "risk_seller_mismatch",
      "seller_mismatch",
      flagUnsure && !typedClash && !paperClash && !flagNo ? "medium" : "high",
      L(
        "Owner information could not be reconciled",
        "مالک کی معلومات میل نہیں کھاتیں",
        "Malik ki maloomat mail nahi khatin",
      ),
      why,
      evidenceLines(rows),
      verifyBeforeToken(),
    ),
  ];
}

function pricingItems(answers: CheckAnswers, noteHits: NoteHit[]): RiskItem[] {
  const out: RiskItem[] = [];
  const price = parsePkr(answers.price);
  const token = parsePkr(answers.tokenAmount);
  if (price && token && token > price * 0.15 && answers.intent !== "rent") {
    out.push(
      item(
        "risk_price_token",
        "unusual_pricing",
        "medium",
        L("Token amount looks unusual", "ٹوکن کی رقم غیر معمولی لگتی ہے", "Token ki raqam ghair mamooli lagti hai"),
        L(
          "The bayana is a large share of the asking price. That increases loss if papers later fail a check.",
          "بیعانہ منگی قیمت کا بڑا حصہ ہے۔ کاغذات بعد میں نہ ملیں تو نقصان بڑھتا ہے۔",
          "Bayana mangi qeemat ka bara hissa hai. Kaghazat baad mein na milen to nuqsan barhta hai.",
        ),
        evidenceLines([
          { label: "Asking price", value: answers.price },
          { label: "Token", value: answers.tokenAmount },
        ]),
        L(
          "Lower the token, write refund terms, and obtain authoritative verification before paying.",
          "ٹوکن کم کریں، واپسی لکھیں، اور ادائیگی سے پہلے مستند تصدیق کروائیں۔",
          "Token kam karein, wapsi likhein, aur adaiagi se pehle mustanad tasdeeq karwaen.",
        ),
        "system_detected",
      ),
    );
  }
  const cheap = flag(answers, "too_cheap") === "yes" || noteHits.some((h) => h.id === "cheap");
  if (cheap) {
    out.push(
      item(
        "risk_price_cheap",
        "unusual_pricing",
        "medium",
        L("Asking price looks unusual", "منگی قیمت غیر معمولی لگتی ہے", "Mangi qeemat ghair mamooli lagti hai"),
        L(
          "Far-below-area talk is a signal to slow down. This app has no live market feed, so this is not a valuation.",
          "علاقے سے بہت کم قیمت انتظار کا اشارہ ہے۔ اس ایپ میں لائیو مارکیٹ نہیں، یہ ویلیو ایشن نہیں۔",
          "Ilaqe se bohat kam qeemat intezar ka ishara hai. Is app mein live market nahi, yeh valuation nahi.",
        ),
        L(
          "Notes or answers mention a very low price. Source: system-detected. Not a verified market price.",
          "نوٹ یا جوابات میں بہت کم قیمت کا ذکر۔ ذریعہ: سسٹم نے پکڑا۔ verified مارکیٹ قیمت نہیں۔",
          "Note ya jawabat mein bohat kam qeemat ka zikr. Source: system-detected. Verified market qeemat nahi.",
        ),
        L(
          "Ask for similar nearby deals, then still verify papers at the relevant office.",
          "قریبی ملتی جلتی ڈیلز پوچھیں، پھر بھی متعلقہ دفتر سے کاغذات چیک کریں۔",
          "Qareebi milti julti deals poochen, phir bhi mutaliqa daftar se kaghazat check karein.",
        ),
        "system_detected",
      ),
    );
  }
  return out;
}

function listingItems(answers: CheckAnswers, noteHits: NoteHit[]): RiskItem[] {
  const out: RiskItem[] = [];
  const chat = answers.foundVia ? CHAT_LEADS.has(answers.foundVia) : false;
  const thin = answers.hasDocuments !== "yes" || answers.counterparty === "unknown";
  if (chat && thin) {
    out.push(
      item(
        "risk_listing_source",
        "suspicious_listing",
        answers.counterparty === "unknown" ? "high" : "medium",
        L("This listing needs extra verification", "اس لسٹنگ کی اضافی تصدیق درکار ہے", "Is listing ki izafi tasdeeq darkar hai"),
        L(
          "The lead came through a chat or online listing, and papers or the seller's identity are not confirmed. This is not a finding that the listing is fake.",
          "لیڈ چیٹ یا آن لائن لسٹنگ سے آئی، اور کاغذات یا بیچنے والے کی شناخت تصدیق نہیں۔ یہ جعلی لسٹنگ کا فیصلہ نہیں۔",
          "Lead chat ya online listing se ai, aur kaghazat ya bechne wale ki shanakht tasdeeq nahi. Yeh jalii listing ka faisla nahi.",
        ),
        evidenceLines([
          { label: "Found via", value: answers.foundVia ?? "—" },
          { label: "Has papers", value: answers.hasDocuments ?? "not answered" },
          { label: "Other party", value: answers.counterparty ?? "not answered" },
        ]),
        verifyBeforeToken(),
        "system_detected",
      ),
    );
  }
  if (noteHits.some((h) => h.id === "double")) {
    out.push(
      item(
        "risk_listing_double",
        "suspicious_listing",
        "high",
        L("Possible overlapping claim mentioned", "اوورلیپ دعوے کا ذکر", "Overlap daaway ka zikr"),
        L(
          "Notes mention that this property may already have been promised to someone else. Requires verification. Unable to determine the true position from notes alone.",
          "نوٹ میں ذکر ہے کہ یہ جائیداد کسی اور کو وعدہ ہو سکتی ہے۔ تصدیق درکار ہے۔ صرف نوٹ سے تعین نہیں۔",
          "Note mein zikr hai ke yeh jaedad kisi aur ko wada ho sakti hai. Tasdeeq darkar hai. Sirf note se taeen nahi.",
        ),
        L("Your notes mention a possible double promise. Source: system-detected.", "آپ کے نوٹ میں دوہرے وعدے کا اشارہ۔ ذریعہ: سسٹم۔", "Aap ke note mein dohre wadey ka ishara. Source: system."),
        L("Do not pay token. Check the official record and ask neighbours.", "ٹوکن نہ دیں۔ سرکاری ریکارڈ اور پڑوسیوں سے پوچھیں۔", "Token na dein. Sarkari record aur padosiyon se poochen."),
        "system_detected",
      ),
    );
  }
  if (flag(answers, "land_exists") === "no") {
    out.push(
      item(
        "risk_listing_file",
        "suspicious_listing",
        "high",
        L("Plot / unit existence is not shown", "پلاٹ / یونٹ کا وجود نہیں دکھایا گیا", "Plot / unit ka wujood nahi dikhaya gaya"),
        L(
          "A file number can exist without land on the ground. Requires verification at the developer or authority.",
          "فائل نمبر زمین کے بغیر بھی ہو سکتا ہے۔ ڈویلپر یا اتھارٹی سے تصدیق درکار ہے۔",
          "File number zameen ke baghair bhi ho sakta hai. Developer ya authority se tasdeeq darkar hai.",
        ),
        L("You answered that the plot/unit was not shown. Source: user-provided.", "آپ نے بتایا پلاٹ/یونٹ نہیں دکھایا گیا۔ ذریعہ: آپ کی بتائی معلومات۔", "Aap ne bataya plot/unit nahi dikhaya gaya. Source: user-provided."),
        verifyBeforeToken(),
        "user_provided",
      ),
    );
  }
  return out;
}

function claimItems(answers: CheckAnswers, noteHits: NoteHit[]): RiskItem[] {
  const out: RiskItem[] = [];
  const notes = answers.notes.toLowerCase();
  const claimHit = CLAIM_NEEDLES.find((n) => notes.includes(n.toLowerCase()));
  if (claimHit) {
    out.push(
      item(
        "risk_claim_notes",
        "unverified_claims",
        "medium",
        L("A claim in the notes is not officially verified", "نوٹ کا دعویٰ سرکاری طور پر تصدیق شدہ نہیں", "Note ka dawa sarkari taur par tasdeeq shuda nahi"),
        L(
          "Words such as clear, approved, or verified in a chat are user-provided. This platform has not confirmed them with an official source.",
          "صاف، منظور، یا verified جیسے الفاظ آپ کی بتائی معلومات ہیں۔ اس پلیٹ فارم نے انہیں سرکاری ذریعہ سے تصدیق نہیں کی۔",
          "Saaf, manzoor, ya verified jaise alfaaz aap ki batayi maloomat hain. Is platform ne inhe sarkari source se tasdeeq nahi ki.",
        ),
        L(`Notes contain: “${claimHit}”. Source: system-detected, not verified.`, `نوٹ میں: “${claimHit}”. ذریعہ: سسٹم، verified نہیں۔`, `Note mein: “${claimHit}”. Source: system-detected, verified nahi.`),
        verifyBeforeToken(),
        "system_detected",
      ),
    );
  }
  if (flag(answers, "society_approved") === "yes" && answers.documents.society_noc !== "have" && answers.settlement === "urban") {
    out.push(
      item(
        "risk_claim_approval",
        "unverified_claims",
        "medium",
        L("Society approval is still an unverified claim", "سوسائٹی منظوری اب بھی غیر تصدیق شدہ دعویٰ ہے", "Society manzoori ab bhi ghair tasdeeq shuda dawa hai"),
        L(
          "You said the scheme is approved. That is user-provided. It is not official verification until the authority confirms it.",
          "آپ نے کہا اسکیم منظور ہے۔ یہ آپ کی بتائی معلومات ہے۔ جب تک اتھارٹی تصدیق نہ کرے یہ سرکاری تصدیق نہیں۔",
          "Aap ne kaha scheme manzoor hai. Yeh aap ki batayi maloomat hai. Jab tak authority tasdeeq na kare yeh sarkari tasdeeq nahi.",
        ),
        L("Society approved: yes. Society NOC: not marked as seen.", "سوسائٹی منظور: ہاں۔ این او سی: دیکھی ہوئی نہیں۔", "Society manzoor: haan. NOC: dekhi hui nahi."),
        L(
          "Ask for the approval letter or number and confirm from LDA, CDA, SBCA, or the relevant authority.",
          "منظوری خط یا نمبر مانگیں اور ایل ڈی اے، سی ڈی اے، ایس بی سی اے یا متعلقہ اتھارٹی سے تصدیق کریں۔",
          "Manzoori khat ya number mangein aur LDA, CDA, SBCA ya mutaliqa authority se tasdeeq karein.",
        ),
        "user_provided",
      ),
    );
  }
  if ((answers.paperReads ?? []).some((r) => r.ocrStatus === "done")) {
    out.push(
      item(
        "risk_claim_ocr",
        "unverified_claims",
        "low",
        L("Phone reading is not official verification", "فون کی پڑھائی سرکاری تصدیق نہیں", "Phone ki padhai sarkari tasdeeq nahi"),
        L(
          "Fields extracted from photos are system-detected. They do not make the property verified.",
          "تصاویر سے نکلے خانے سسٹم کی پڑھائی ہیں۔ اس سے جائیداد verified نہیں بنتی۔",
          "Tasveer se nikle khanay system ki padhai hain. Is se jaedad verified nahi banti.",
        ),
        L("At least one paper was read on this phone. Source: system-detected.", "کم از کم ایک کاغذ اس فون پر پڑھا گیا۔ ذریعہ: سسٹم۔", "Kam az kam ek kaghaz is phone par padha gaya. Source: system."),
        L("Trust the original paper over this screen, then confirm at the office.", "اس اسکرین سے زیادہ اصل کاغذ پر بھروسہ کریں، پھر دفتر سے تصدیق کریں۔", "Is screen se zyada asal kaghaz par bharosa karein, phir daftar se tasdeeq karein."),
        "system_detected",
      ),
    );
  }
  return out;
}

function indicatorItems(answers: CheckAnswers, noteHits: NoteHit[]): RiskItem[] {
  const out: RiskItem[] = [];
  if (flag(answers, "pressure_today") === "yes" || noteHits.some((h) => h.id === "token_pressure")) {
    out.push(
      item(
        "risk_ind_pressure",
        "risk_indicators",
        "high",
        L("Pressure to pay today", "آج ہی پیسے دینے کا دباؤ", "Aaj hi paise dene ka dabao"),
        L(
          "Urgency is a common way missing papers get skipped. A genuine party can usually wait for a check.",
          "جلدی سے اکثر کاغذات چھوٹ جاتے ہیں۔ اصل فریق عام طور پر چیک کا انتظار کر سکتا ہے۔",
          "Jaldi se aksar kaghazat chhoot jate hain. Asal fariq aam taur par check ka intezar kar sakta hai.",
        ),
        L("You reported pressure to pay now, or notes mention it. Source: user-provided / system-detected.", "آج پیسے دینے کا دباؤ بتایا گیا، یا نوٹ میں ہے۔ ذریعہ: آپ / سسٹم۔", "Aaj paise dene ka dabao bataya gaya, ya note mein hai. Source: aap / system."),
        L("Say you will pay after papers are checked. Walk away if they refuse.", "کہیں: کاغذات چیک کے بعد دوں گا۔ انکار پر واپس چلے جائیں۔", "Kahen: kaghazat check ke baad doonga. Inkar par wapas chale jaen."),
        "system_detected",
      ),
    );
  }
  if (flag(answers, "occupied") === "yes") {
    out.push(
      item(
        "risk_ind_occupied",
        "risk_indicators",
        "high",
        L("Someone else is in possession", "قبضہ کسی اور کے پاس ہے", "Qabza kisi aur ke paas hai"),
        L(
          "Paper without possession often leads to a later dispute. Requires verification of who is on the land.",
          "بغیر قبضہ کاغذ بعد کے جھگڑے کا سبب بنتا ہے۔ زمین پر کون ہے، تصدیق درکار ہے۔",
          "Baghair qabza kaghaz baad ke jhagray ka sabab banta hai. Zameen par kaun hai, tasdeeq darkar hai.",
        ),
        L("Occupied: yes. Source: user-provided.", "قبضہ: ہاں۔ ذریعہ: آپ کی بتائی معلومات۔", "Qabza: haan. Source: user-provided."),
        L("Meet the occupant. Get a written vacation date before token.", "قابض سے ملیں۔ ٹوکن سے پہلے لکھی چھڑانے کی تاریخ لیں۔", "Qabiz se milen. Token se pehle likhi chhurane ki tareekh lein."),
        "user_provided",
      ),
    );
  }
  if (flag(answers, "court_case") === "yes" || noteHits.some((h) => h.id === "court")) {
    out.push(
      item(
        "risk_ind_court",
        "risk_indicators",
        "high",
        L("Court or family dispute reported", "مقدمہ یا خاندانی جھگڑا بتایا گیا", "Muqadma ya khandani jhagra bataya gaya"),
        L(
          "A stay or family objection can freeze a sale. This check cannot read a court file.",
          "سٹے یا خاندانی اعتراض فروخت روک سکتا ہے۔ یہ چیک عدالتی فائل نہیں پڑھ سکتا۔",
          "Stay ya khandani etiraz farokht rok sakta hai. Yeh check adalati file nahi parh sakta.",
        ),
        L("Court / dispute flagged from answers or notes. Source: needs verification.", "جوابات یا نوٹ سے مقدمہ/جھگڑا۔ ذریعہ: تصدیق درکار۔", "Jawabat ya note se muqadma/jhagra. Source: tasdeeq darkar."),
        L("Do not pay. Have a lawyer check case status before token.", "پیسے نہ دیں۔ ٹوکن سے پہلے وکیل سے کیس چیک کرائیں۔", "Paise na dein. Token se pehle wakeel se case check karwaen."),
      ),
    );
  }
  if (flag(answers, "society_approved") === "no") {
    out.push(
      item(
        "risk_ind_unapproved",
        "risk_indicators",
        "high",
        L("Society / scheme may be unapproved", "سوسائٹی / اسکیم غیر منظور ہو سکتی ہے", "Society / scheme ghair manzoor ho sakti hai"),
        L(
          "Unapproved housing can fail utilities, registry, and resale. Confirm with the authority, not the dealer.",
          "غیر منظور ہاؤسنگ میں یوٹیلیٹی، رجسٹری اور آگے فروخت رک سکتی ہے۔ اتھارٹی سے تصدیق کریں، ڈیلر سے نہیں۔",
          "Ghair manzoor housing mein utility, registry aur aage farokht ruk sakti hai. Authority se tasdeeq karein, dealer se nahi.",
        ),
        L("Society approved: no. Source: user-provided.", "سوسائٹی منظور: نہیں۔ ذریعہ: آپ کی بتائی معلومات۔", "Society manzoor: nahi. Source: user-provided."),
        L("Ask for the approval number and confirm from the relevant development authority.", "منظوری نمبر مانگیں اور متعلقہ ڈیولپمنٹ اتھارٹی سے تصدیق کریں۔", "Manzoori number mangein aur mutaliqa development authority se tasdeeq karein."),
        "user_provided",
      ),
    );
  }
  if (flag(answers, "all_heirs") === "no") {
    out.push(
      item(
        "risk_ind_heirs",
        "risk_indicators",
        "high",
        L("Not all heirs have agreed", "تمام ورثاء راضی نہیں", "Tamam waris razi nahi"),
        L(
          "On inherited khata, a missing heir is a frequent later dispute. Requires verification of mutation parties.",
          "وراثتی کھاتے پر ایک وارث کا رہ جانا بعد کے جھگڑے کی عام وجہ ہے۔ انتقال کے فریقین کی تصدیق درکار ہے۔",
          "Warasati khate par ek waris ka reh jana baad ke jhagray ki aam wajah hai. Intiqal ke fariqeen ki tasdeeq darkar hai.",
        ),
        L("All heirs agreed: no. Source: user-provided.", "تمام ورثاء راضی: نہیں۔ ذریعہ: آپ کی بتائی معلومات۔", "Tamam waris razi: nahi. Source: user-provided."),
        verifyBeforeToken(),
        "user_provided",
      ),
    );
  }
  if (
    (answers.counterparty === "poa" || answers.counterparty === "agent") &&
    flag(answers, "met_owner") !== "yes"
  ) {
    out.push(
      item(
        "risk_ind_no_owner",
        "risk_indicators",
        "high",
        L("Actual owner has not been verified", "اصل مالک سے تصدیق نہیں ہوئی", "Asal malik se tasdeeq nahi hui"),
        L(
          "Token collected by an agent or attorney needs written authority. Unable to determine authority from this check.",
          "ایجنٹ یا مختار کا ٹوکن لکھے اختیار کا محتاج ہے۔ اس چیک سے اختیار کا تعین نہیں۔",
          "Agent ya mukhtar ka token likhe ikhtiyar ka mohtaj hai. Is check se ikhtiyar ka taeen nahi.",
        ),
        evidenceLines([
          { label: "Other party", value: answers.counterparty },
          { label: "Met owner", value: flag(answers, "met_owner") ?? "not answered" },
        ]),
        L(
          "Video-call the owner with CNIC. For a mukhtarnama, check it at the registrar and with the owner.",
          "مالک سے شناختی کارڈ کے ساتھ ویڈیو کال کریں۔ مختارنامہ رجسٹرار اور مالک سے چیک کریں۔",
          "Malik se CNIC ke sath video call karein. Mukhtarnama registrar aur malik se check karein.",
        ),
        "needs_verification",
      ),
    );
  }
  if (noteHits.some((h) => h.id === "cash")) {
    out.push(
      item(
        "risk_ind_cash",
        "risk_indicators",
        "medium",
        L("Cash-only talk", "صرف نقد کی بات", "Sirf naqd ki baat"),
        L(
          "Cash without a bank trail makes a refund harder. Prefer a documented transfer.",
          "بینک ریکارڈ کے بغیر نقد واپسی مشکل بناتا ہے۔ دستاویزی منتقلی بہتر ہے۔",
          "Bank record ke baghair naqd wapsi mushkil banata hai. Dastavezi intiqali behtar hai.",
        ),
        L("Notes mention cash-only. Source: system-detected.", "نوٹ میں صرف نقد کا ذکر۔ ذریعہ: سسٹم۔", "Note mein sirf naqd ka zikr. Source: system."),
        L("Use a bank transfer you can show later, and take a signed receipt.", "ایسی بینک منتقلی کریں جو بعد میں دکھا سکیں، اور دستخط شدہ رسید لیں۔", "Aisi bank intiqali karein jo baad mein dikha saken, aur dastakhat shuda raseed lein."),
        "system_detected",
      ),
    );
  }
  return out;
}

export function assessRisk(
  answers: CheckAnswers,
  ctx: { paperHits: Finding[]; noteHits: NoteHit[] },
): RiskItem[] {
  const reads = (answers.paperReads ?? []).filter(usable);
  const items: RiskItem[] = [];

  items.push(...missingInfo(answers));

  const seller = sellerItems(answers, reads);
  items.push(...seller);
  const location = locationItems(answers, reads);
  items.push(...location);

  for (const f of ctx.paperHits) {
    const lane = paperLane(f.id);
    if (!lane) continue;
    if (lane === "seller_mismatch" && seller.length) continue;
    if (lane === "location_inconsistency" && location.length) continue;
    items.push(fromPaperFinding(f, lane));
  }

  items.push(...pricingItems(answers, ctx.noteHits));
  items.push(...listingItems(answers, ctx.noteHits));
  items.push(...claimItems(answers, ctx.noteHits));
  items.push(...indicatorItems(answers, ctx.noteHits));

  const seen = new Set<string>();
  const uniq = items.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
  uniq.sort((a, b) => {
    const lane = LANE_ORDER.indexOf(a.lane) - LANE_ORDER.indexOf(b.lane);
    if (lane !== 0) return lane;
    return ATTENTION_ORDER[a.attention] - ATTENTION_ORDER[b.attention];
  });
  return uniq;
}

export function placesLookDifferent(a: string, b: string): boolean {
  return placesDiffer(a, b);
}
