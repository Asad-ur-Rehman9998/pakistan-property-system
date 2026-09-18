import type { CheckAnswers, Finding, Localized } from "@/types/check";
import { documentsFor } from "./documents";
import type { NoteHit } from "./scanNotes";
import { parsePkr } from "@/lib/pakistan/money";

function L(en: string, ur: string, roman: string): Localized {
  return { en, ur, roman };
}

function item(
  id: string,
  kind: Finding["kind"],
  severity: Finding["severity"],
  source: Finding["source"],
  title: Localized,
  why: Localized,
  doNow: Localized,
): Finding {
  return { id, kind, severity, source, title, why, doNow };
}

const LAWYER_IDS = new Set([
  "court",
  "name_mismatch",
  "heirs",
  "occupied",
  "unapproved",
  "unknown_party",
  "no_owner_contact",
  "double_sale_notes",
  "paper_file",
  "no_ownership_proof",
]);

export function extraWorkflow(
  answers: CheckAnswers,
  parts: {
    known: Finding[];
    missing: Finding[];
    inconsistent: Finding[];
    verify: Finding[];
  },
  noteHits: NoteHit[],
): {
  lawyer: Finding[];
  recordBeforeMoney: Finding[];
  priceCheck: Finding[];
  completeness: { seen: number; missing: number; unknown: number; total: number };
} {
  const pooled = [...parts.known, ...parts.missing, ...parts.inconsistent, ...parts.verify];
  const flagged = pooled.filter((f) => LAWYER_IDS.has(f.id) && f.severity !== "info");

  const lawyer: Finding[] = flagged.map((f) => ({ ...f, kind: "verify" }));
  if (flagged.length === 0) {
    lawyer.push(
      item(
        "lawyer_none_flagged",
        "known",
        "info",
        "system_detected",
        L(
          "No lawyer-level red flag from your answers — this is not legal advice",
          "آپ کے جوابوں سے وکیل والا سرخ اشارہ نہیں — یہ قانونی مشورہ نہیں",
          "Aap ke jawabon se wakeel wala surkh ishara nahi — yeh qanooni mashwara nahi",
        ),
        L(
          "Court cases, name mismatch, fake mukhtarnama, warasat fights, qabza, and unapproved societies are usual reasons to sit with a lawyer before token.",
          "مقدمہ، نام نہ ملنا، جعلی مختارنامہ، وراثت، قبضہ اور غیر منظور سوسائٹی ٹوکن سے پہلے وکیل کے عام اسباب ہیں۔",
          "Muqadma, naam na milna, jalii mukhtarnama, warasat, qabza aur ghair manzoor society token se pehle wakeel ke aam asbaab hain.",
        ),
        L(
          "Still take this report to a lawyer before registry. This platform is not a lawyer.",
          "رجسٹری سے پہلے یہ رپورٹ وکیل کو دکھائیں۔ یہ پلیٹ فارم وکیل نہیں۔",
          "Registry se pehle yeh report wakeel ko dikhayen. Yeh platform wakeel nahi.",
        ),
      ),
    );
  } else {
    lawyer.unshift(
      item(
        "lawyer_needed",
        "verify",
        "stop",
        "system_detected",
        L(
          "Sit with a lawyer before paying token",
          "ٹوکن سے پہلے وکیل کے پاس بیٹھیں",
          "Token se pehle wakeel ke paas baithen",
        ),
        L(
          "Your answers include a dispute, identity, possession, or authority problem. A dealer WhatsApp chat does not fix this.",
          "آپ کے جوابوں میں جھگڑا، شناخت، قبضہ یا اختیار کا مسئلہ ہے۔ ڈیلر کا واٹس ایپ اسے حل نہیں کرتا۔",
          "Aap ke jawabon mein jhagra, shanakht, qabza ya ikhtiyar ka masla hai. Dealer ka WhatsApp ise hal nahi karta.",
        ),
        L(
          "Show the papers and this report. Do not pay token on ‘lawyer baad mein’.",
          "کاغذات اور یہ رپورٹ دکھائیں۔ 'وکیل بعد میں' پر ٹوکن نہ دیں۔",
          "Kaghazat aur yeh report dikhayen. 'Wakeel baad mein' par token na dein.",
        ),
      ),
    );
  }

  const ads = ["whatsapp", "facebook", "signboard", "newspaper", "listing", "community"];
  const knownPeople = ["dealer", "friend", "agent"];
  if (answers.foundVia && ads.includes(answers.foundVia)) {
    lawyer.push(
      item(
        "informal_channel",
        "verify",
        "watch",
        "user_provided",
        L(
          "This lead came through an informal channel",
          "یہ لیڈ غیر رسمی ذریعے سے آئی",
          "Yeh lead ghair rasmi zariye se aayi",
        ),
        L(
          "WhatsApp, Facebook, a board, a newspaper, or an online ad is often how people first hear of a property. That is not a document check.",
          "واٹس ایپ، فیس بک، بورڈ، اخبار یا آن لائن اشتہار سے اکثر پہلی خبر ملتی ہے۔ یہ کاغذات کی جانچ نہیں۔",
          "WhatsApp, Facebook, board, akhbar ya online ishtehar se aksar pehli khabar milti hai. Yeh kaghazat ki jaanch nahi.",
        ),
        L(
          "Ask for original papers. Visit the land. Do not pay because the message looks urgent.",
          "اصل کاغذات مانگیں۔ زمین پر جائیں۔ صرف جلدی والے میسج پر پیسے نہ دیں۔",
          "Asal kaghazat mangein. Zameen par jaen. Sirf jaldi wale message par paise na dein.",
        ),
      ),
    );
  } else if (answers.foundVia && knownPeople.includes(answers.foundVia)) {
    lawyer.push(
      item(
        "known_person_channel",
        "verify",
        "watch",
        "user_provided",
        L(
          "A known person is not a paper check",
          "جانے پہچانے شخص کا مطلب کاغذات چیک نہیں",
          "Jane pehchane shakhs ka matlab kaghazat check nahi",
        ),
        L(
          "Dealer, local agent, and friend/family intros are how most Pakistan deals start. Trust does not replace fard, mutation, or a written token.",
          "ڈیلر، مقامی ایجنٹ اور دوست/خاندان سے زیادہ تر ڈیل شروع ہوتی ہے۔ اعتماد فرد، انتقال یا لکھا ٹوکن نہیں بنتا۔",
          "Dealer, muqami agent aur dost/khandan se zyada tar deal shuru hoti hai. Aitmad fard, intiqal ya likha token nahi banta.",
        ),
        L(
          "Still see original papers and match names. Family pressure is a common reason people skip this.",
          "پھر بھی اصل کاغذات دیکھیں اور نام ملائیں۔ خاندانی دباؤ اکثر یہ چھوڑواتا ہے۔",
          "Phir bhi asal kaghazat dekhein aur naam milayen. Khandani dabao aksar yeh chhorwata hai.",
        ),
      ),
    );
  }

  const recordBeforeMoney: Finding[] = [
    item(
      "rec_identity",
      "question",
      "watch",
      "system_detected",
      L(
        "Write the seller’s name exactly as on the CNIC, next to the name on the ownership paper",
        "بیچنے والے کا نام شناختی کارڈ جیسا لکھیں، ملکیت کے کاغذ کے نام کے ساتھ",
        "Bechne wale ka naam CNIC jaisa likhein, malkiat ke kaghaz ke naam ke sath",
      ),
      L(
        "If the two names differ, stop.",
        "اگر دونوں نام الگ ہوں تو رک جائیں۔",
        "Agar dono naam alag hon to ruk jaen.",
      ),
      L(
        "Photograph both papers together, with permission.",
        "اجازت سے دونوں کاغذات کی ساتھ تصویر لیں۔",
        "Ijazat se dono kaghazat ki sath tasveer lein.",
      ),
    ),
    item(
      "rec_property_id",
      "question",
      "watch",
      "system_detected",
      L(
        "Write the plot / file / khasra number and the society or mauza name",
        "پلاٹ / فائل / خسرہ نمبر اور سوسائٹی یا موضع کا نام لکھیں",
        "Plot / file / khasra number aur society ya mauza ka naam likhein",
      ),
      L(
        "Vague ‘this house’ is how the wrong parcel is sold.",
        "صرف 'یہ گھر' کہنا غلط زمین بیچنے کا طریقہ ہے۔",
        "Sirf 'yeh ghar' kehna ghalat zameen bechne ka tareeqa hai.",
      ),
      L(
        "Match the number on paper with the place you stood on.",
        "کاغذ کا نمبر اس جگہ سے ملایں جہاں آپ کھڑے ہوئے۔",
        "Kaghaz ka number us jagah se milayen jahan aap khare hue.",
      ),
    ),
    item(
      "rec_token_terms",
      "question",
      "stop",
      "system_detected",
      L(
        "Write token amount, date, and refund if papers fail (days + account)",
        "ٹوکن کی رقم، تاریخ، اور کاغذات فیل ہونے پر واپسی (دن + اکاؤنٹ) لکھیں",
        "Token ki raqam, tareekh, aur kaghazat fail hone par wapsi (din + account) likhein",
      ),
      L(
        "Spoken bayana on WhatsApp is weak if the deal breaks.",
        "واٹس ایپ پر زبانی بیعانہ ڈیل ٹوٹنے پر کمزور ہے۔",
        "WhatsApp par zabani bayana deal tootne par kamzor hai.",
      ),
      L(
        "Do not pay until this is on paper and signed.",
        "جب تک یہ کاغذ پر دستخط نہ ہو، پیسے نہ دیں۔",
        "Jab tak yeh kaghaz par dastakhat na ho, paise na dein.",
      ),
    ),
    item(
      "rec_witness",
      "question",
      "watch",
      "system_detected",
      L(
        "Write names of two witnesses who are not the dealer’s staff",
        "دو گواہوں کے نام لکھیں جو ڈیلر کے عملے میں نہ ہوں",
        "Do gawahon ke naam likhein jo dealer ke amle mein na hon",
      ),
      L(
        "A family member or neighbour is better than nobody.",
        "گھر کا فرد یا پڑوسی نہ ہونے سے بہتر ہے۔",
        "Ghar ka fard ya padosi na hone se behtar hai.",
      ),
      L(
        "They should see the same papers you saw.",
        "وہ وہی کاغذات دیکھیں جو آپ نے دیکھے۔",
        "Woh wohi kaghazat dekhen jo aap ne dekhe.",
      ),
    ),
    item(
      "rec_office",
      "question",
      "watch",
      "needs_verification",
      L(
        "Write which official office you will visit this week — go yourself",
        "اس ہفتے کون سا سرکاری دفتر جائیں گے — خود جائیں",
        "Is hafte kaun sa sarkari daftar jaen ge — khud jaen",
      ),
      L(
        "Sending only the dealer is a common way papers get swapped.",
        "صرف ڈیلر بھیجنا کاغذات بدل جانے کا عام طریقہ ہے۔",
        "Sirf dealer bhejna kaghazat badal jane ka aam tareeqa hai.",
      ),
      L(
        "Use the office list in this report.",
        "اس رپورٹ کی دفتر والی فہرست استعمال کریں۔",
        "Is report ki daftar wali fehrist istemal karein.",
      ),
    ),
    item(
      "rec_receipt",
      "question",
      "watch",
      "system_detected",
      L(
        "If any money moves, take a signed receipt. Avoid cash-only with no trail",
        "اگر پیسے جائیں تو دستخط شدہ رسید لیں۔ بغیر ریکارڈ نقد سے بچیں",
        "Agar paise jaen to dastakhat shuda raseed lein. Baghair record naqd se bachen",
      ),
      L(
        "No receipt makes a refund fight much harder.",
        "رسید نہ ہو تو واپسی کی لڑائی مشکل ہو جاتی ہے۔",
        "Raseed na ho to wapsi ki larai mushkil ho jati hai.",
      ),
      L(
        "Prefer a bank transfer you can show later.",
        "ایسی بینک منتقلی بہتر ہے جو بعد میں دکھا سکیں۔",
        "Aisi bank intiqali behtar hai jo baad mein dikha saken.",
      ),
    ),
  ];

  const price = parsePkr(answers.price);
  const hasPrice = price !== null;
  const cheapTalk = noteHits.some((h) => h.id === "cheap");
  const priceCheck: Finding[] = [
    item(
      "price_no_market_tape",
      "verify",
      cheapTalk ? "watch" : "info",
      hasPrice ? "needs_verification" : "unknown",
      hasPrice
        ? L(
            "We do not have a verified market price for this property",
            "اس جائیداد کی verified مارکیٹ قیمت ہمارے پاس نہیں",
            "Is jaedad ki verified market qeemat hamare paas nahi",
          )
        : L(
            "Asking price is unknown — write it before any token",
            "منگی قیمت نامعلوم ہے — ٹوکن سے پہلے لکھیں",
            "Mangi qeemat namaloom hai — token se pehle likhein",
          ),
      L(
        "This platform does not run a live price feed. A number from a dealer, WhatsApp, or listing is user-provided, not a valuation. Far-below-area talk plus urgency is a risk signal, not a bargain certificate.",
        "یہ پلیٹ فارم لائیو قیمت نہیں دیتا۔ ڈیلر، واٹس ایپ یا لسٹنگ کی رقم آپ کی بتائی ہے، ویلیو ایشن نہیں۔ علاقے سے بہت کم اور جلدی خطرے کا اشارہ ہے، سستی کا سرٹیفکیٹ نہیں۔",
        "Yeh platform live qeemat nahi deta. Dealer, WhatsApp ya listing ki raqam aap ki batayi hai, valuation nahi. Ilaqe se bohat kam aur jaldi khatre ka ishara hai, sasti ka certificate nahi.",
      ),
      L(
        "Ask for 2–3 similar nearby deals and society transfer values. Then still verify papers.",
        "۲–۳ قریبی ملتی جلتی ڈیلز اور سوسائٹی ٹرانسفر ویلیو پوچھیں۔ پھر بھی کاغذات چیک کریں۔",
        "2–3 qareebi milti julti deals aur society transfer value poochen. Phir bhi kaghazat check karein.",
      ),
    ),
  ];

  const docs = documentsFor(answers);
  let seen = 0;
  let missing = 0;
  let unknown = 0;
  for (const d of docs) {
    const state = answers.documents[d.id];
    if (state === "have") seen += 1;
    else if (state === "missing") missing += 1;
    else unknown += 1;
  }

  return {
    lawyer,
    recordBeforeMoney,
    priceCheck,
    completeness: { seen, missing, unknown, total: docs.length },
  };
}
