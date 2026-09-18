import type {
  CheckAnswers,
  ClarityReport,
  EvidenceSource,
  Finding,
  Localized,
  ProvenanceCounts,
  SavedCheck,
  Verdict,
} from "@/types/check";
import { documentsFor } from "./documents";
import { extraWorkflow } from "./workflow";
import { scanNotes } from "./scanNotes";
import { comparePapers } from "@/lib/docai/compare";
import { assessRisk } from "./risk";
import { tokenChecklistFindings, tokenChecklistReport, tokenChecklistRisks } from "./tokenChecklist";
import { assessInfoStatus } from "./infoStatus";
import { assessPriceIntel } from "./priceIntel";
import { assessDuplicates, duplicateRisks, type DuplicateCandidate } from "./duplicates";
import { explainReport } from "@/lib/ai/explain";
import { officialSnapshot } from "@/lib/official/registry";

function L(en: string, ur: string, roman: string): Localized {
  return { en, ur, roman };
}

function sourceFromKind(kind: Finding["kind"]): EvidenceSource {
  if (kind === "known") return "user_provided";
  if (kind === "missing") return "unknown";
  if (kind === "verify") return "needs_verification";
  return "system_detected";
}

function finding(
  id: string,
  kind: Finding["kind"],
  severity: Finding["severity"],
  title: Localized,
  why: Localized,
  doNow: Localized,
  officeHint?: Localized,
  source?: EvidenceSource,
): Finding {
  return { id, kind, severity, source: source ?? sourceFromKind(kind), title, why, doNow, officeHint };
}

function docState(a: CheckAnswers, id: string) {
  return a.documents[id];
}

function missing(a: CheckAnswers, id: string) {
  return docState(a, id) === "missing" || docState(a, id) === "unsure" || !docState(a, id);
}

function have(a: CheckAnswers, id: string) {
  return docState(a, id) === "have";
}

function flag(a: CheckAnswers, id: string) {
  return a.flags[id];
}

import { parsePkr } from "@/lib/pakistan/money";

export type EvaluateOptions = {
  selfId?: string;
  duplicateCandidates?: DuplicateCandidate[];
};

export function evaluate(answers: CheckAnswers, opts?: EvaluateOptions): ClarityReport {
  const known: Finding[] = [];
  const missingF: Finding[] = [];
  const inconsistent: Finding[] = [];
  const verify: Finding[] = [];
  const questions: Finding[] = [];

  const docs = documentsFor(answers);
  const noteHits = scanNotes(answers.notes);
  const paperHits = comparePapers(answers);

  for (const f of paperHits) {
    if (f.kind === "inconsistent") inconsistent.push(f);
    else if (f.kind === "verify") verify.push(f);
    else known.push(f);
  }

  for (const f of tokenChecklistFindings(answers)) {
    if (f.kind === "missing") missingF.push(f);
    else if (f.kind === "verify") verify.push(f);
    else known.push(f);
  }

  for (const d of docs) {
    if (have(answers, d.id)) {
      known.push(
        finding(
          `have_${d.id}`,
          "known",
          "info",
          d.title,
          L(
            "You told us you have seen this. That is user-provided, not official verification. Confirm it is original, fresh, and matches this property.",
            "آپ نے بتایا کہ یہ دیکھا ہے۔ یہ آپ کی بتائی معلومات ہے، سرکاری تصدیق نہیں۔ اصل، نئی، اور اسی جائیداد سے میل چیک کریں۔",
            "Aap ne bataya ke yeh dekha hai. Yeh aap ki batayi maloomat hai, sarkari tasdeeq nahi. Asal, nayi, aur isi jaedad se match check karein.",
          ),
          L(
            "Keep a photo of the original. Do not rely on WhatsApp images alone.",
            "اصل کی تصویر رکھیں۔ صرف واٹس ایپ تصویر پر بس نہ کریں۔",
            "Asal ki tasveer rakhein. Sirf WhatsApp tasveer par bas na karein.",
          ),
        ),
      );
    } else if (docState(answers, d.id) === "missing") {
      missingF.push(
        finding(
          `miss_${d.id}`,
          "missing",
          criticalDoc(d.id) ? "stop" : "watch",
          d.title,
          d.hint,
          L(
            "Ask for this before paying token. If they cannot show it, slow down.",
            "ٹوکن سے پہلے یہ مانگیں۔ اگر نہ دکھا سکیں تو رک جائیں۔",
            "Token se pehle yeh mangein. Agar na dikha saken to ruk jaen.",
          ),
          undefined,
          criticalDoc(d.id) ? "needs_verification" : "unknown",
        ),
      );
    } else {
      missingF.push(
        finding(
          `unsure_${d.id}`,
          "missing",
          criticalDoc(d.id) ? "watch" : "info",
          L(
            `Not confirmed yet: ${d.title.en}`,
            `ابھی تصدیق نہیں: ${d.title.ur}`,
            `Abhi tasdeeq nahi: ${d.title.roman}`,
          ),
          d.hint,
          L(
            "Treat unknown papers as missing until you have seen them.",
            "جب تک نہ دیکھیں، نامعلوم کاغذ کو غائب سمجھیں۔",
            "Jab tak na dekhen, namaloom kaghaz ko ghaib samjhein.",
          ),
          undefined,
          "unknown",
        ),
      );
    }
  }

  // Ownership vacuum
  const ownershipIds = ["fard", "ownership", "owner_proof", "original_file"];
  const anyOwnership = ownershipIds.some((id) => have(answers, id));
  if (!anyOwnership) {
    missingF.push(
      finding(
        "no_ownership_proof",
        "missing",
        "stop",
        L(
          "No ownership paper is confirmed",
          "ملکیت کا کوئی کاغذ تصدیق شدہ نہیں",
          "Malkiat ka koi kaghaz tasdeeq shuda nahi",
        ),
        L(
          "Without a fard, registry, allotment, or original file, you cannot tell who can legally deal.",
          "فرد، رجسٹری، الاٹمنٹ یا اصل فائل کے بغیر پتہ نہیں چلتا کون قانونی طور پر ڈیل کر سکتا ہے۔",
          "Fard, registry, allotment ya asal file ke baghair pata nahi chalta kaun qanooni taur par deal kar sakta hai.",
        ),
        L(
          "Do not pay token. Get a fresh copy from the official office first.",
          "ٹوکن نہ دیں۔ پہلے سرکاری دفتر سے نئی کاپی لیں۔",
          "Token na dein. Pehle sarkari daftar se nayi copy lein.",
        ),
        officeFor(answers),
      ),
    );
  }

  if (missing(answers, "bayana_written") && (answers.intent === "token" || answers.intent === "buy")) {
    missingF.push(
      finding(
        "token_without_writing",
        "missing",
        "stop",
        L(
          "No written token / bayana terms",
          "لکھا ہوا ٹوکن / بیعانہ نہیں",
          "Likha hua token / bayana nahi",
        ),
        L(
          "Spoken promises and WhatsApp chats are weak if the deal fails. Amount, property identity, dates, and refund must be written.",
          "اگر ڈیل ٹوٹے تو زبانی وعدے اور واٹس ایپ کمزور ہیں۔ رقم، جائیداد، تاریخ اور واپسی لکھنی چاہیے۔",
          "Agar deal toote to zabani wadey aur WhatsApp kamzor hain. Raqam, jaedad, tareekh aur wapsi likhni chahiye.",
        ),
        L(
          "Write a simple agreement before any payment. Read it aloud with a trusted person.",
          "کسی ادائیگی سے پہلے سادہ معاہدہ لکھیں۔ کسی قابل اعتماد شخص کے ساتھ پڑھیں۔",
          "Kisi adaiagi se pehle sada muahida likhein. Kisi qabil-e-aitmad shakhs ke sath parhein.",
        ),
      ),
    );
  }

  if (flag(answers, "pressure_today") === "yes") {
    inconsistent.push(
      finding(
        "pressure",
        "inconsistent",
        "stop",
        L(
          "Pressure to pay today",
          "آج ہی پیسے دینے کا دباؤ",
          "Aaj hi paise dene ka dabao",
        ),
        L(
          "Genuine sellers can usually wait a day for fard, society transfer check, or a family review. Pressure often hides missing papers.",
          "اصل بیچنے والا عام طور پر فرد یا فیملی چیک کے لیے ایک دن انتظار کر سکتا ہے۔ دباؤ اکثر کاغذات چھپاتا ہے۔",
          "Asal bechne wala aam taur par fard ya family check ke liye ek din intezar kar sakta hai. Dabao aksar kaghazat chhupata hai.",
        ),
        L(
          "Say: I will pay after papers are checked. Walk away if they refuse.",
          "کہیں: کاغذات چیک کے بعد دوں گا۔ انکار پر واپس چلے جائیں۔",
          "Kahen: kaghazat check ke baad doonga. Inkar par wapas chale jaen.",
        ),
      ),
    );
  }

  if (flag(answers, "name_match") === "no") {
    inconsistent.push(
      finding(
        "name_mismatch",
        "inconsistent",
        "stop",
        L(
          "Seller name does not match papers",
          "بیچنے والے کا نام کاغذات سے نہیں ملتا",
          "Bechne wale ka naam kaghazat se nahi milta",
        ),
        L(
          "This is a classic double-sale / relative-selling / fake-agent pattern in Pakistan.",
          "یہ پاکستان میں دوہری فروخت، رشتہ دار کے بیچنے، یا جعلی ایجنٹ کی عام صورت ہے۔",
          "Yeh Pakistan mein dohri farokht, rishtedar ke bechne, ya jalii agent ki aam soorat hai.",
        ),
        L(
          "Stop. Only deal with the person named on the fard/allotment, or a verified power of attorney.",
          "رک جائیں۔ صرف فرد/الاٹمنٹ والے نام یا تصدیق شدہ مختارنامے سے ڈیل کریں۔",
          "Ruk jaen. Sirf fard/allotment wale naam ya tasdeeq shuda mukhtarnama se deal karein.",
        ),
      ),
    );
  }

  if (flag(answers, "name_match") === "unsure") {
    verify.push(
      finding(
        "name_unverified",
        "verify",
        "watch",
        L(
          "Seller identity vs papers is not confirmed",
          "بیچنے والے کی شناخت کاغذات سے تصدیق نہیں",
          "Bechne wale ki shanakht kaghazat se tasdeeq nahi",
        ),
        L(
          "You must match CNIC, photo, and the name on ownership paper.",
          "شناختی کارڈ، تصویر اور ملکیت کے کاغذ کا نام ملانا ضروری ہے۔",
          "CNIC, tasveer aur malkiat ke kaghaz ka naam milana zaroori hai.",
        ),
        L(
          "Ask to see original CNIC next to the original ownership paper.",
          "اصل شناختی کارڈ اصل ملکیت کے کاغذ کے ساتھ دیکھیں۔",
          "Asal CNIC asal malkiat ke kaghaz ke sath dekhein.",
        ),
      ),
    );
  }

  if (flag(answers, "occupied") === "yes") {
    inconsistent.push(
      finding(
        "occupied",
        "inconsistent",
        "stop",
        L(
          "Someone else is in possession",
          "قبضہ کسی اور کے پاس ہے",
          "Qabza kisi aur ke paas hai",
        ),
        L(
          "Buying paper without possession is how qabza and tenant fights start. Even a relative living there can refuse to leave.",
          "بغیر قبضہ کاغذ خریدنا قبضہ اور کرایہ دار جھگڑوں کی ابتدا ہے۔ گھر کا رشتہ دار بھی نہ ہٹے۔",
          "Baghair qabza kaghaz kharidna qabza aur kirayedar jhagron ki ibtida hai. Ghar ka rishtedar bhi na hate.",
        ),
        L(
          "Meet the occupant. Get a written vacation date. Do not pay full token until possession is clear.",
          "قابض سے ملیں۔ لکھی چھڑانے کی تاریخ لیں۔ قبضہ صاف ہونے تک پورا ٹوکن نہ دیں۔",
          "Qabiz se milen. Likhi chhurane ki tareekh lein. Qabza saaf hone tak poora token na dein.",
        ),
      ),
    );
  }

  if (flag(answers, "court_case") === "yes") {
    inconsistent.push(
      finding(
        "court",
        "inconsistent",
        "stop",
        L(
          "Court case or family dispute reported",
          "مقدمہ یا خاندانی جھگڑا بتایا گیا",
          "Muqadma ya khandani jhagra bataya gaya",
        ),
        L(
          "A stay order can freeze sale. Family objections after token are common on inherited property.",
          "سٹے آرڈر فروخت روک سکتا ہے۔ وراثتی جائیداد پر ٹوکن کے بعد اعتراض عام ہیں۔",
          "Stay order farokht rok sakta hai. Warasati jaedad par token ke baad etiraz aam hain.",
        ),
        L(
          "Do not pay. Have a lawyer check case status. Get written no-objection from adult heirs.",
          "پیسے نہ دیں۔ وکیل سے کیس چیک کرائیں۔ بالغ ورثاء سے لکھا عدم اعتراض لیں۔",
          "Paise na dein. Wakeel se case check karwaen. Baligh waris se likha adam-etiraz lein.",
        ),
      ),
    );
  }

  if (flag(answers, "seen_in_person") === "no") {
    missingF.push(
      finding(
        "no_visit",
        "missing",
        "watch",
        L("You have not visited the property", "آپ جائیداد پر گئے نہیں", "Aap jaedad par gaye nahi"),
        L(
          "Boundaries, occupancy, access road, and flooding are not visible on a brochure.",
          "حدود، قبضہ، سڑک اور سیلاب بروشر میں نہیں دکھتے۔",
          "Hudood, qabza, sarak aur sailab brochure mein nahi dikhte.",
        ),
        L(
          "Visit in daylight with a local person who is not the seller's agent.",
          "دن کی روشنی میں کسی مقامی کے ساتھ جائیں جو بیچنے والے کا ایجنٹ نہ ہو۔",
          "Din ki roshni mein kisi muqami ke sath jaen jo bechne wale ka agent na ho.",
        ),
      ),
    );
  }

  if (flag(answers, "society_approved") === "no") {
    inconsistent.push(
      finding(
        "unapproved",
        "inconsistent",
        "stop",
        L(
          "Society / scheme may be unapproved",
          "سوسائٹی / اسکیم غیر منظور ہو سکتی ہے",
          "Society / scheme ghair manzoor ho sakti hai",
        ),
        L(
          "Unapproved housing is one of Pakistan's biggest buyer traps: utilities, registry, and resale can fail.",
          "غیر منظور ہاؤسنگ پاکستان کے بڑے جالوں میں ہے: یوٹیلیٹی، رجسٹری اور آگے فروخت رک سکتی ہے۔",
          "Ghair manzoor housing Pakistan ke baray jalon mein hai: utility, registry aur aage farokht ruk sakti hai.",
        ),
        L(
          "Ask for the approval letter/number and confirm from LDA, CDA, SBCA, or the relevant authority — not from the dealer.",
          "منظوری خط/نمبر مانگیں اور ایل ڈی اے، سی ڈی اے، ایس بی سی اے یا متعلقہ اتھارٹی سے تصدیق کریں — ڈیلر سے نہیں۔",
          "Manzoori khat/number mangein aur LDA, CDA, SBCA ya mutaliqa authority se tasdeeq karein — dealer se nahi.",
        ),
        L(
          "Development authority or municipal / cantonment office",
          "ڈیولپمنٹ اتھارٹی یا میونسپل / کینٹ آفس",
          "Development authority ya municipal / cantt office",
        ),
      ),
    );
  }

  if (flag(answers, "all_heirs") === "no") {
    inconsistent.push(
      finding(
        "heirs",
        "inconsistent",
        "stop",
        L(
          "Not all heirs have agreed",
          "تمام ورثاء راضی نہیں",
          "Tamam waris razi nahi",
        ),
        L(
          "On inherited khata, missing sisters, widows, or brothers is a frequent source of later cases.",
          "وراثتی کھاتے پر بہن، بیوہ یا بھائی کا رہ جانا بعد کے مقدمات کی عام وجہ ہے۔",
          "Warasati khate par behn, bewah ya bhai ka reh jana baad ke muqadmat ki aam wajah hai.",
        ),
        L(
          "Mutation must include all legal heirs. Do not take token from one sibling alone.",
          "انتقال میں تمام قانونی ورثاء ہوں۔ اکیلے ایک بھائی/بہن سے ٹوکن نہ لیں/دیں۔",
          "Intiqal mein tamam qanooni waris hon. Akele ek bhai/behn se token na lein/dein.",
        ),
      ),
    );
  }

  if (
    (answers.counterparty === "poa" || answers.counterparty === "agent") &&
    flag(answers, "met_owner") !== "yes"
  ) {
    verify.push(
      finding(
        "no_owner_contact",
        "verify",
        "stop",
        L(
          "You have not verified with the actual owner",
          "اصل مالک سے تصدیق نہیں ہوئی",
          "Asal malik se tasdeeq nahi hui",
        ),
        L(
          "Fake agents and fake mukhtarnama cases are common. The person collecting token may have no authority.",
          "جعلی ایجنٹ اور جعلی مختارنامہ عام ہیں۔ ٹوکن لینے والے کے پاس اختیار نہ ہو۔",
          "Jalii agent aur jalii mukhtarnama aam hain. Token lene wale ke paas ikhtiyar na ho.",
        ),
        L(
          "Video-call the owner with CNIC. For POA, verify the document at the registrar and with the owner.",
          "مالک سے شناختی کارڈ کے ساتھ ویڈیو کال کریں۔ مختارنامہ رجسٹرار اور مالک دونوں سے چیک کریں۔",
          "Malik se CNIC ke sath video call karein. Mukhtarnama registrar aur malik dono se check karein.",
        ),
      ),
    );
  }

  if (answers.counterparty === "unknown") {
    inconsistent.push(
      finding(
        "unknown_party",
        "inconsistent",
        "stop",
        L(
          "You do not know who the other party is",
          "آپ کو معلوم نہیں دوسری پارٹی کون ہے",
          "Aap ko maloom nahi doosri party kaun hai",
        ),
        L(
          "Never pay token to 'someone from the society office' or a friend of a friend without identity.",
          "سوسائٹی آفس کے 'کسی' یا دوست کے دوست کو بغیر شناخت ٹوکن نہ دیں۔",
          "Society office ke 'kisi' ya dost ke dost ko baghair shanakht token na dein.",
        ),
        L(
          "Ask for CNIC, role (owner/agent/POA), and written authority before any money.",
          "پیسے سے پہلے شناختی کارڈ، کردار اور لکھا اختیار مانگیں۔",
          "Paise se pehle CNIC, kirdar aur likha ikhtiyar mangein.",
        ),
      ),
    );
  }

  if (answers.counterparty === "builder") {
    verify.push(
      finding(
        "builder",
        "verify",
        "watch",
        L(
          "Builder / developer deal needs extra checks",
          "بلڈر / ڈویلپر ڈیل میں اضافی چیک",
          "Builder / developer deal mein izafi check",
        ),
        L(
          "Ask for company registration, project approval, payment schedule, and what you get if the project delays.",
          "کمپنی رجسٹریشن، پروجیکٹ منظوری، ادائیگی شیڈول، اور تاخیر پر کیا ملے گا پوچھیں۔",
          "Company registration, project manzoori, adaiagi schedule, aur takheer par kya milega poochen.",
        ),
        L(
          "Pay into a company account with receipts. Avoid cash to a personal name.",
          "کمپنی اکاؤنٹ میں رسید کے ساتھ ادائیگی کریں۔ ذاتی نام پر نقد سے بچیں۔",
          "Company account mein raseed ke sath adaiagi karein. Zati naam par naqd se bachen.",
        ),
      ),
    );
  }

  if (flag(answers, "land_exists") === "no") {
    inconsistent.push(
      finding(
        "paper_file",
        "inconsistent",
        "stop",
        L(
          "Plot/unit existence is not shown",
          "پلاٹ/یونٹ کا وجود نہیں دکھایا گیا",
          "Plot/unit ka wujood nahi dikhaya gaya",
        ),
        L(
          "A file can be a number without land. Resale may be impossible.",
          "فائل زمین کے بغیر صرف نمبر ہو سکتی ہے۔ آگے فروخت ناممکن ہو سکتی ہے۔",
          "File zameen ke baghair sirf number ho sakti hai. Aage farokht namumkin ho sakti hai.",
        ),
        L(
          "Visit the site. Match file number with the developer's official list.",
          "سائٹ پر جائیں۔ فائل نمبر ڈویلپر کی سرکاری فہرست سے ملائیں۔",
          "Site par jaen. File number developer ki sarkari fehrist se milayen.",
        ),
      ),
    );
  }

  if (have(answers, "ownership") || have(answers, "fard") || have(answers, "original_file")) {
    if (missing(answers, "mutation") && answers.propertyKind !== "file" && answers.intent !== "rent") {
      verify.push(
        finding(
          "mutation_gap",
          "verify",
          "watch",
          L(
            "Mutation / intiqal still needs a check",
            "انتقال ابھی چیک کرنا ہے",
            "Intiqal abhi check karna hai",
          ),
          L(
            "A registry or old fard can exist while the current seller's name is not updated.",
            "رجسٹری یا پرانی فرد ہو اور موجودہ بیچنے والے کا نام اپڈیٹ نہ ہو۔",
            "Registry ya purani fard ho aur mojooda bechne wale ka naam update na ho.",
          ),
          L(
            "Get a fresh fard / society transfer status in the seller's name.",
            "بیچنے والے کے نام تازہ فرد / سوسائٹی ٹرانسفر سٹیٹس لیں۔",
            "Bechne wale ke naam taza fard / society transfer status lein.",
          ),
          officeFor(answers),
        ),
      );
    }
  }

  if (flag(answers, "walked_boundaries") === "no") {
    missingF.push(
      finding(
        "no_hadd",
        "missing",
        "watch",
        L(
          "You have not walked the four sides / hadd",
          "آپ نے چاروں حدیں چل کر نہیں دیکھیں",
          "Aap ne charun haddein chal kar nahi dekhin",
        ),
        L(
          "A brochure or WhatsApp pin can show the wrong edges. Neighbours often know overlapping land.",
          "بروشر یا واٹس ایپ پن غلط کنارے دکھا سکتا ہے۔ پڑوسی اکثر اوورلیپ جانتے ہیں۔",
          "Brochure ya WhatsApp pin ghalat kinare dikha sakta hai. Padosi aksar overlap jante hain.",
        ),
        L(
          "Walk the boundaries in daylight with someone who is not selling.",
          "دن کی روشنی میں حدود پر چلیں، کسی کے ساتھ جو بیچ نہ رہا ہو۔",
          "Din ki roshni mein hudood par chalein, kisi ke sath jo bech na raha ho.",
        ),
      ),
    );
  }

  if (
    (answers.intent === "buy" || answers.intent === "token") &&
    answers.settlement === "urban" &&
    answers.propertyKind !== "agri" &&
    !answers.plotNumber?.trim()
  ) {
    missingF.push(
      finding(
        "missing_plot_no",
        "missing",
        "watch",
        L(
          "Plot / file number is not written yet",
          "پلاٹ / فائل نمبر ابھی لکھا نہیں",
          "Plot / file number abhi likha nahi",
        ),
        L(
          "In Pakistani societies, 'this house' is how the wrong parcel is sold. Write the number from the map or file.",
          "پاکستانی سوسائٹیوں میں صرف 'یہ گھر' کہنا غلط پلاٹ بیچنے کا طریقہ ہے۔ نقشے یا فائل کا نمبر لکھیں۔",
          "Pakistani societies mein sirf 'yeh ghar' kehna ghalat plot bechne ka tareeqa hai. Naqshe ya file ka number likhein.",
        ),
        L(
          "Write the plot or file number before token.",
          "ٹوکن سے پہلے پلاٹ یا فائل نمبر لکھیں۔",
          "Token se pehle plot ya file number likhein.",
        ),
      ),
    );
  }

  if (
    (answers.settlement === "rural" || answers.propertyKind === "agri") &&
    !answers.khasraNumber?.trim() &&
    answers.intent !== "rent"
  ) {
    missingF.push(
      finding(
        "missing_khasra_no",
        "missing",
        "watch",
        L(
          "Khasra / khewat number is not written yet",
          "خسرہ / ختوت نمبر ابھی لکھا نہیں",
          "Khasra / khewat number abhi likha nahi",
        ),
        L(
          "Village land is identified by these numbers, not by a nickname of the field.",
          "گاؤں کی زمین ان نمبروں سے پہچانی جاتی ہے، کھیت کے عرفی نام سے نہیں۔",
          "Gaon ki zameen in numberon se pehchani jati hai, khet ke urfi naam se nahi.",
        ),
        L(
          "Copy the numbers from the fard and match them on the field.",
          "فرد سے نمبر نقل کریں اور کھیت پر ملائیں۔",
          "Fard se number naqal karein aur khet par milayen.",
        ),
      ),
    );
  }

  const price = parsePkr(answers.price);
  const token = parsePkr(answers.tokenAmount);
  if (price && token && token > price * 0.15 && answers.intent !== "rent") {
    inconsistent.push(
      finding(
        "high_token",
        "inconsistent",
        "watch",
        L(
          "Token amount is unusually high",
          "ٹوکن کی رقم غیر معمولی زیادہ ہے",
          "Token ki raqam ghair mamooli zyada hai",
        ),
        L(
          "A very large bayana increases loss if the deal is delayed or papers fail.",
          "بہت بڑا بیعانہ اس وقت نقصان بڑھاتا ہے جب ڈیل رکے یا کاغذات فیل ہوں۔",
          "Bohat bara bayana us waqt nuqsan barhata hai jab deal ruke ya kaghazat fail hon.",
        ),
        L(
          "Lower the token, write refund conditions, or wait until official verification.",
          "ٹوکن کم کریں، واپسی لکھیں، یا سرکاری تصدیق تک انتظار کریں۔",
          "Token kam karein, wapsi likhein, ya sarkari tasdeeq tak intezar karein.",
        ),
      ),
    );
  }

  // Note-scan extras
  for (const hit of noteHits) {
    if (hit.id === "cash") {
      inconsistent.push(
        finding(
          "cash_only_notes",
          "inconsistent",
          "watch",
          L("Cash-only talk in your notes", "آپ کی نوٹ میں صرف نقد کی بات", "Aap ki note mein sirf naqd ki baat"),
          L(
            "Cash without a bank trail makes refunds and tax documentation harder, and is used in some frauds.",
            "بینک ریکارڈ کے بغیر نقد واپسی اور ٹیکس کو مشکل بناتا ہے، اور کچھ فراڈ میں استعمال ہوتا ہے۔",
            "Bank record ke baghair naqd wapsi aur tax ko mushkil banata hai, aur kuch fraud mein istemal hota hai.",
          ),
          L(
            "Prefer a documented bank payment. Keep receipts either way.",
            "دستاویزی بینک ادائیگی بہتر ہے۔ ہر صورت رسید رکھیں۔",
            "Dastavezi bank adaiagi behtar hai. Har soorat raseed rakhein.",
          ),
        ),
      );
    }
    if (hit.id === "overseas") {
      verify.push(
        finding(
          "overseas_notes",
          "verify",
          "watch",
          L("Overseas owner mentioned", "بیرون ملک مالک کا ذکر", "Berun-e-mulk malik ka zikr"),
          L(
            "Overseas owners often use a relative or attorney. That person must have a valid, specific power.",
            "بیرون ملک مالک اکثر رشتہ دار یا مختار بھیجتے ہیں۔ اس کے پاس درست، مخصوص اختیار ہونا چاہیے۔",
            "Berun-e-mulk malik aksar rishtedar ya mukhtar bhejte hain. Us ke paas durust, makhsoos ikhtiyar hona chahiye.",
          ),
          L(
            "Video-call the owner. Confirm POA date, powers, and whether it allows sale.",
            "مالک سے ویڈیو کال۔ مختارنامہ کی تاریخ، اختیارات اور فروخت کی اجازت چیک کریں۔",
            "Malik se video call. Mukhtarnama ki tareekh, ikhtiyarat aur farokht ki ijazat check karein.",
          ),
        ),
      );
    }
    if (hit.id === "double") {
      inconsistent.push(
        finding(
          "double_sale_notes",
          "inconsistent",
          "stop",
          L("Possible double sale mentioned", "دوہری فروخت کا اشارہ", "Dohri farokht ka ishara"),
          L(
            "If anyone says it was promised to someone else, treat this as a live dispute.",
            "اگر کسی نے کہا یہ کسی اور کو وعدہ ہے تو اسے جاری جھگڑا سمجھیں۔",
            "Agar kisi ne kaha yeh kisi aur ko wada hai to ise jari jhagra samjhein.",
          ),
          L(
            "Do not pay. Check official record and ask neighbours.",
            "پیسے نہ دیں۔ سرکاری ریکارڈ اور پڑوسیوں سے پوچھیں۔",
            "Paise na dein. Sarkari record aur padosiyon se poochen.",
          ),
        ),
      );
    }
  }

  // Questions — always useful, tailored
  questions.push(
    ...buildQuestions(answers, anyOwnership),
  );

  if (answers.buyerLocation === "abroad") {
    known.push(
      finding(
        "overseas_buyer",
        "known",
        "info",
        L("You are checking this property from abroad", "آپ یہ چیک بیرون ملک سے کر رہے ہیں", "Aap yeh check bahar se kar rahe hain"),
        L(
          "You told us you are outside Pakistan. That is user-provided. Remote steps are a workflow, not official verification.",
          "آپ نے بتایا کہ پاکستان سے باہر ہیں۔ یہ آپ کی بتائی معلومات ہے۔ دور کے مراحل ایک راستہ ہیں، سرکاری تصدیق نہیں۔",
          "Aap ne bataya ke Pakistan se bahar hain. Yeh aap ki batayi maloomat hai. Door ke marhalay ek raasta hain, sarkari tasdeeq nahi.",
        ),
        L(
          "Follow the remote path. Do not send token until papers and identity are independently checked.",
          "دور والا راستہ چلیں۔ جب تک کاغذات اور شناخت الگ چیک نہ ہوں، ٹوکن نہ بھیجیں۔",
          "Door wala raasta chalain. Jab tak kaghazat aur shanakht alag check na hon, token na bhejein.",
        ),
        undefined,
        "user_provided",
      ),
    );
    const named = answers.representativeName.trim();
    if (named) {
      const relation = answers.representativeRelation.trim();
      known.push(
        finding(
          "overseas_representative",
          "known",
          "watch",
          L(
            relation ? `Named representative: ${named} (${relation})` : `Named representative: ${named}`,
            relation ? `نامزد نمائندہ: ${named} (${relation})` : `نامزد نمائندہ: ${named}`,
            relation ? `Namzad numainda: ${named} (${relation})` : `Namzad numainda: ${named}`,
          ),
          L(
            "This name is user-provided. This platform does not authorize them to sign, sell, or complete a registry.",
            "یہ نام آپ نے لکھا ہے۔ یہ پلیٹ فارم انہیں دستخط، فروخت یا رجسٹری مکمل کرنے کا اختیار نہیں دیتا۔",
            "Yeh naam aap ne likha hai. Yeh platform unhein dastakhat, farokht ya registry mukammal karne ka ikhtiyar nahi deta.",
          ),
          L(
            "Confirm who they are independently. Official verification required for any mukhtarnama or identity process.",
            "الگ سے تصدیق کریں وہ کون ہیں۔ کسی مختارنامہ یا شناخت کے لیے Official verification required.",
            "Alag se tasdeeq karein woh kaun hain. Kisi mukhtarnama ya shanakht ke liye Official verification required.",
          ),
          undefined,
          "user_provided",
        ),
      );
    }
    if (answers.representativePoa === "yes") {
      verify.push(
        finding(
          "overseas_poa",
          "verify",
          "watch",
          L("Mukhtarnama is not certified here", "مختارنامہ یہاں تصدیق شدہ نہیں", "Mukhtarnama yahan certified nahi"),
          L(
            "A copy you have is not a certified power of attorney or identity confirmation. Official verification required until an authoritative source confirms it through this platform.",
            "آپ کے پاس کاپی تصدیق شدہ مختارنامہ یا شناخت نہیں۔ Official verification required جب تک مستند ذریعہ اس پلیٹ فارم پر تصدیق نہ کرے۔",
            "Aap ke paas copy certified mukhtarnama ya shanakht nahi. Official verification required jab tak mustanad source is platform par tasdeeq na kare.",
          ),
          L(
            "Have a qualified professional and the relevant office confirm the document. Do not treat this app as that confirmation.",
            "اہل پیشہ ور اور متعلقہ دفتر دستاویز کی تصدیق کریں۔ اس ایپ کو وہ تصدیق نہ سمجھیں۔",
            "Ehl pesha war aur mutaliqa daftar dastavez ki tasdeeq karein. Is app ko woh tasdeeq na samjhein.",
          ),
          undefined,
          "needs_verification",
        ),
      );
    }
  }

  if (answers.intent === "sell") {
    known.push(
      finding(
        "seller_mode",
        "known",
        "info",
        L(
          "You are checking this as a seller",
          "آپ یہ چیک بیچنے والے کے طور پر کر رہے ہیں",
          "Aap yeh check bechne wale ke taur par kar rahe hain",
        ),
        L(
          "Buyers in Pakistan now ask for fard, CNIC match, and mutation. Missing papers lower price and cause last-minute collapse.",
          "خریدار اب فرد، شناختی میل اور انتقال مانگتے ہیں۔ کاغذات نہ ہوں تو قیمت کم اور ڈیل ٹوٹتی ہے۔",
          "Kharidar ab fard, CNIC match aur intiqal mange hain. Kaghazat na hon to qeemat kam aur deal toot ti hai.",
        ),
        L(
          "Gather fresh official copies before showing the property.",
          "جائیداد دکھانے سے پہلے تازہ سرکاری کاپیاں جمع کریں۔",
          "Jaedad dikhane se pehle taza sarkari copies jama karein.",
        ),
      ),
    );
  }

  // De-duplicate by id
  const uniq = (arr: Finding[]) => {
    const seen = new Set<string>();
    return arr.filter((f) => (seen.has(f.id) ? false : (seen.add(f.id), true)));
  };

  const reportParts = {
    known: uniq(known),
    missing: uniq(missingF),
    inconsistent: uniq(inconsistent),
    verify: uniq(verify),
    questions: uniq(questions),
  };

  const extras = extraWorkflow(answers, reportParts, noteHits);
  const duplicates = assessDuplicates(answers, {
    selfId: opts?.selfId,
    candidates: opts?.duplicateCandidates,
  });
  const risks = [
    ...assessRisk(answers, { paperHits, noteHits }),
    ...tokenChecklistRisks(answers),
    ...duplicateRisks(duplicates),
  ];
  const { verdict, headline, summary } = decideVerdict(reportParts);
  const infoStatus = assessInfoStatus(answers, reportParts, extras.completeness, risks);
  const all = [
    ...reportParts.known,
    ...reportParts.missing,
    ...reportParts.inconsistent,
    ...reportParts.verify,
    ...reportParts.questions,
    ...extras.lawyer,
    ...extras.recordBeforeMoney,
    ...extras.priceCheck,
  ];

  const official = officialSnapshot();
  const report: ClarityReport = {
    version: 1,
    createdAt: new Date().toISOString(),
    verdict,
    headline,
    summary,
    score: infoStatus.reasons.length,
    infoStatus,
    hasOfficialVerification: official.hasOfficialVerification,
    officialIntegrations: official,
    provenance: countProvenance(all),
    ...reportParts,
    lawyer: extras.lawyer,
    recordBeforeMoney: extras.recordBeforeMoney,
    priceCheck: extras.priceCheck,
    completeness: extras.completeness,
    nextOffices: nextOffices(answers),
    risks,
    tokenChecklist: tokenChecklistReport(answers),
    priceIntel: assessPriceIntel(answers),
    duplicates,
  };
  report.aiExplanation = explainReport(answers, report);
  return report;
}

function countProvenance(items: Finding[]): ProvenanceCounts {
  const provenance: ProvenanceCounts = {
    verified: 0,
    user_provided: 0,
    system_detected: 0,
    needs_verification: 0,
    unknown: 0,
  };
  for (const f of items) {
    provenance[f.source] += 1;
  }
  return provenance;
}

function criticalDoc(id: string) {
  return ["fard", "ownership", "owner_proof", "original_file", "cnic_owner", "bayana_written"].includes(
    id,
  );
}

function officeFor(a: CheckAnswers): Localized {
  if (a.province === "islamabad") {
    return L("CDA / relevant society transfer + sub-registrar", "سی ڈی اے / سوسائٹی ٹرانسفر + سب رجسٹرار", "CDA / society transfer + sub-registrar");
  }
  if (a.settlement === "rural" || a.propertyKind === "agri") {
    if (a.province === "punjab") {
      return L("Arazi Record Center / Patwari + sub-registrar", "اراضی ریکارڈ سینٹر / پٹواری + سب رجسٹرار", "Arazi Record Center / Patwari + sub-registrar");
    }
    return L("Revenue / patwari office + sub-registrar", "ریونیو / پٹواری + سب رجسٹرار", "Revenue / patwari + sub-registrar");
  }
  if (a.province === "sindh") {
    return L("Society office / SBCA or KDA + sub-registrar", "سوسائٹی آفس / ایس بی سی اے یا کے ڈی اے + رجسٹرار", "Society office / SBCA ya KDA + registrar");
  }
  return L("Society / development authority + sub-registrar", "سوسائٹی / ڈیولپمنٹ اتھارٹی + سب رجسٹرار", "Society / development authority + sub-registrar");
}

function nextOffices(a: CheckAnswers): Localized[] {
  const list: Localized[] = [officeFor(a)];
  if (a.intent !== "rent") {
    list.push(
      L(
        "Sub-registrar: never complete a sale only in a dealer's office",
        "سب رجسٹرار: فروخت صرف ڈیلر کے دفتر میں پوری نہ کریں",
        "Sub-registrar: farokht sirf dealer ke daftar mein poori na karein",
      ),
    );
  }
  return list;
}

function buildQuestions(a: CheckAnswers, hasOwnership: boolean): Finding[] {
  const q: Finding[] = [];

  q.push(
    finding(
      "q_identity",
      "question",
      "watch",
      L(
        "Ask: Please put original CNIC next to the original ownership paper.",
        "پوچھیں: اصل شناختی کارڈ اصل ملکیت کے کاغذ کے ساتھ رکھیں۔",
        "Poochen: asal CNIC asal malkiat ke kaghaz ke sath rakhein.",
      ),
      L(
        "You are checking that the human and the paper are the same person.",
        "آپ یہ دیکھ رہے ہیں کہ انسان اور کاغذ ایک ہی شخص کے ہیں۔",
        "Aap yeh dekh rahe hain ke insaan aur kaghaz ek hi shakhs ke hain.",
      ),
      L("Do this in daylight. Take a photo with permission.", "دن کی روشنی میں کریں۔ اجازت سے تصویر لیں۔", "Din ki roshni mein karein. Ijazat se tasveer lein."),
    ),
  );

  if (!hasOwnership) {
    q.push(
      finding(
        "q_fresh_record",
        "question",
        "stop",
        L(
          "Ask: Where do I get a fresh official copy this week?",
          "پوچھیں: اس ہفتے نئی سرکاری کاپی کہاں سے لے سکتا/سکتی ہوں؟",
          "Poochen: is hafte nayi sarkari copy kahan se le sakta/sakti hoon?",
        ),
        L(
          "A seller who cannot name the office is a warning.",
          "جو بیچنے والا دفتر کا نام نہ بتا سکے، وہ خطرے کی علامت ہے۔",
          "Jo bechne wala daftar ka naam na bata sake, woh khatre ki alamat hai.",
        ),
        L("Go yourself. Do not send only the dealer.", "خود جائیں۔ صرف ڈیلر کو نہ بھیجیں۔", "Khud jaen. Sirf dealer ko na bhejein."),
      ),
    );
  }

  if (a.settlement === "rural" || a.propertyKind === "agri") {
    q.push(
      finding(
        "q_khasra",
        "question",
        "watch",
        L(
          "Ask: Show khasra number on paper and on the field with a local who is not selling.",
          "پوچھیں: کاغذ کا خسرہ نمبر کھیت پر دکھائیں، کسی مقامی کے ساتھ جو بیچ نہ رہا ہو۔",
          "Poochen: kaghaz ka khasra number khet par dikhayen, kisi muqami ke sath jo bech na raha ho.",
        ),
        L(
          "Wrong field / overlapping murabba is a known rural fraud.",
          "غلط کھیت / اوورلیپ مربع دیہی فراڈ میں معروف ہے۔",
          "Ghalat khet / overlap murabba dehi fraud mein maroof hai.",
        ),
        L("Walk the boundaries. Ask two neighbours who owns this.", "حدود پر چلیں۔ دو پڑوسیوں سے پوچھیں یہ کس کی ہے۔", "Hudood par chalein. Do padosiyon se poochen yeh kis ki hai."),
      ),
    );
  } else if (a.intent !== "rent") {
    q.push(
      finding(
        "q_plot",
        "question",
        "watch",
        L(
          "Ask: What is the plot or file number on the society map, not only the street name?",
          "پوچھیں: سوسائٹی کے نقشے پر پلاٹ یا فائل نمبر کیا ہے، صرف گلی کا نام نہیں؟",
          "Poochen: society ke naqshe par plot ya file number kya hai, sirf gali ka naam nahi?",
        ),
        L(
          "Two houses on the same street can have different files.",
          "ایک گلی کے دو گھر الگ فائلیں ہو سکتے ہیں۔",
          "Ek gali ke do ghar alag files ho sakte hain.",
        ),
        L("Write the number before token.", "ٹوکن سے پہلے نمبر لکھیں۔", "Token se pehle number likhein."),
      ),
    );
  }

  if (a.propertyKind === "file") {
    q.push(
      finding(
        "q_dues",
        "question",
        "watch",
        L(
          "Ask: How much is still payable, and can I hear that from the society/developer office?",
          "پوچھیں: اب کتنی رقم باقی ہے، اور یہ بات سوسائٹی/ڈویلپر آفس سے سن سکتا ہوں؟",
          "Poochen: ab kitni raqam baqi hai, aur yeh baat society/developer office se sun sakta hoon?",
        ),
        L(
          "Hidden development charges appear after token.",
          "چھپی ڈیولپمنٹ چارجز ٹوکن کے بعد نکلتی ہیں۔",
          "Chhupi development charges token ke baad nikalti hain.",
        ),
        L("Get a written dues certificate.", "بقایا جات کا لکھا سرٹیفکیٹ لیں۔", "Baqaya jat ka likha certificate lein."),
      ),
    );
  }

  if (a.intent === "rent") {
    q.push(
      finding(
        "q_rent",
        "question",
        "watch",
        L(
          "Ask: Who receives rent, and is subletting / family sharing allowed?",
          "پوچھیں: کرایہ کسے جائے گا، اور سب لیٹ/خاندان کی رہائش کی اجازت ہے؟",
          "Poochen: kiraya kise jaye ga, aur sublet/khandan ki rehaish ki ijazat hai?",
        ),
        L(
          "Paying a non-owner is how tenants lose both house and money.",
          "غیر مالک کو کرایہ دینے سے مکان اور پیسہ دونوں جا سکتے ہیں۔",
          "Ghair malik ko kiraya dene se makan aur paisa dono ja sakte hain.",
        ),
        L("Write duration, increment, and who pays bills.", "مدت، اضافہ، اور بل کون بھرتا ہے لکھیں۔", "Muddat, izafa, aur bill kaun bharta hai likhein."),
      ),
    );
  } else {
    q.push(
      finding(
        "q_refund",
        "question",
        "watch",
        L(
          "Ask: If papers fail, how many days until my token is returned, and in which account?",
          "پوچھیں: اگر کاغذات فیل ہوں تو ٹوکن کتنے دن میں، کس اکاؤنٹ میں واپس ہوگا؟",
          "Poochen: agar kaghazat fail hon to token kitne din mein, kis account mein wapas hoga?",
        ),
        L(
          "If they cannot answer, you have no safety on bayana.",
          "اگر جواب نہ ہو تو بیعانہ بے حفاظ ہے۔",
          "Agar jawab na ho to bayana be-hifazat hai.",
        ),
        L("Write the refund clause before paying.", "ادائیگی سے پہلے واپسی کی شق لکھیں۔", "Adaiagi se pehle wapsi ki shiq likhein."),
      ),
    );
  }

  q.push(
    finding(
      "q_neighbours",
      "question",
      "info",
      L(
        "Ask two neighbours: Has this been sold before? Any fight?",
        "دو پڑوسیوں سے پوچھیں: یہ پہلے تو نہیں بکی؟ کوئی لڑائی تو نہیں؟",
        "Do padosiyon se poochen: yeh pehle to nahi biki? Koi larai to nahi?",
      ),
      L(
        "Neighbours often know qabza, double booking, and family fights before papers do.",
        "پڑوسی اکثر قبضہ، دوہری بکنگ اور خاندانی لڑائی کاغذات سے پہلے جانتے ہیں۔",
        "Padosi aksar qabza, dohri booking aur khandani larai kaghazat se pehle jante hain.",
      ),
      L("Do this without the dealer standing next to you.", "یہ ڈیلر کے بغیر کریں جو آپ کے ساتھ کھڑا نہ ہو۔", "Yeh dealer ke baghair karein jo aap ke sath khara na ho."),
    ),
  );

  return q;
}

function decideVerdict(
  parts: Pick<ClarityReport, "known" | "missing" | "inconsistent" | "verify" | "questions">,
): { verdict: Verdict; headline: Localized; summary: Localized } {
  const stopCount =
    parts.inconsistent.filter((f) => f.severity === "stop").length +
    parts.missing.filter((f) => f.severity === "stop").length +
    parts.verify.filter((f) => f.severity === "stop").length;

  const watchCount =
    parts.missing.filter((f) => f.severity === "watch").length +
    parts.verify.filter((f) => f.severity === "watch").length +
    parts.inconsistent.filter((f) => f.severity === "watch").length;

  let verdict: Verdict = "careful";
  if (stopCount > 0) verdict = "stop";
  else if (watchCount >= 2) verdict = "wait";

  if (verdict === "stop") {
    return {
      verdict,
      headline: L(
        "Do not pay token yet",
        "ابھی ٹوکن نہ دیں",
        "Abhi token na dein",
      ),
      summary: L(
        "Something important is missing, conflicting, or not officially checked. PropertyCheck Pakistan has not verified this property. Paying now is how people lose bayana.",
        "کوئی اہم چیز غائب، متضاد یا سرکاری طور پر چیک نہیں۔ پراپرٹی چیک پاکستان نے یہ جائیداد تصدیق نہیں کی۔ اب پیسے دینا بیعانہ ڈوبنے کا طریقہ ہے۔",
        "Koi ahem cheez ghaib, mutazad ya sarkari taur par check nahi. PropertyCheck Pakistan ne yeh jaedad tasdeeq nahi ki. Ab paise dena bayana doobne ka tareeqa hai.",
      ),
    };
  }

  if (verdict === "wait") {
    return {
      verdict,
      headline: L(
        "Ask and verify before money",
        "پیسے سے پہلے پوچھیں اور تصدیق کریں",
        "Paise se pehle poochen aur tasdeeq karein",
      ),
      summary: L(
        "You have some user-provided information. Official papers or identity still need verification from an office or qualified professional. This is not a legal clearance.",
        "کچھ آپ کی بتائی معلومات ہیں۔ سرکاری کاغذات یا شناخت اب بھی دفتر یا اہل پیشہ ور سے تصدیق چاہیے۔ یہ قانونی کلیئرنس نہیں۔",
        "Kuch aap ki batayi maloomat hain. Sarkari kaghazat ya shanakht ab bhi daftar ya ehl pesha war se tasdeeq chahiye. Yeh qanooni clearance nahi.",
      ),
    };
  }

  return {
    verdict,
    headline: L(
      "Keep checking — this is not official verification",
      "چیک جاری رکھیں — یہ سرکاری تصدیق نہیں",
      "Check jari rakhein — yeh sarkari tasdeeq nahi",
    ),
    summary: L(
      "PropertyCheck Pakistan has not verified this property from a government office or a qualified professional. Nothing in this report means the deal is legally safe.",
      "پراپرٹی چیک پاکستان نے یہ جائیداد کسی سرکاری دفتر یا اہل پیشہ ور سے تصدیق نہیں کی۔ اس رپورٹ کا مطلب قانونی طور پر محفوظ ڈیل نہیں۔",
      "PropertyCheck Pakistan ne yeh jaedad kisi sarkari daftar ya ehl pesha war se tasdeeq nahi ki. Is report ka matlab qanooni taur par mehfooz deal nahi.",
    ),
  };
}

export function makeSavedCheck(id: string, answers: CheckAnswers, opts?: EvaluateOptions): SavedCheck {
  return {
    id,
    createdAt: new Date().toISOString(),
    answers,
    report: evaluate(answers, { ...opts, selfId: id }),
  };
}
