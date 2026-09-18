import type { Localized, ProvinceId } from "@/types/check";

export interface OfficialOffice {
  id: string;
  name: Localized;
  does: Localized;
  typicalFor: Localized;
  provinces?: ProvinceId[];
  caution: Localized;
}

export const offices: OfficialOffice[] = [
  {
    id: "plra",
    name: {
      en: "PLRA / Arazi Record Center",
      ur: "پی ایل آر اے / اراضی ریکارڈ سینٹر",
      roman: "PLRA / Arazi Record Center",
    },
    does: {
      en: "Issues fard and related land-record copies in much of Punjab.",
      ur: "پنجاب کے زیادہ حصے میں فرد اور لینڈ ریکارڈ کی کاپیاں دیتا ہے۔",
      roman: "Punjab ke zyada hisse mein fard aur land record ki copies deta hai.",
    },
    typicalFor: {
      en: "Fard, ownership name, khewat/khasra details.",
      ur: "فرد، مالک کا نام، ختوت/خسرہ تفصیل۔",
      roman: "Fard, malik ka naam, khewat/khasra tafseel.",
    },
    provinces: ["punjab"],
    caution: {
      en: "Take original CNIC. Process and fees change — confirm at the center the same week.",
      ur: "اصل شناختی کارڈ لے کر جائیں۔ طریقہ اور فیس بدل سکتی ہے — اسی ہفتے تصدیق کریں۔",
      roman: "Asal CNIC le kar jaen. Tareeqa aur fees badal sakti hai — usi hafte tasdeeq karein.",
    },
  },
  {
    id: "patwari",
    name: {
      en: "Patwari / Tehsil revenue office",
      ur: "پٹواری / تحصیل ریونیو",
      roman: "Patwari / Tehsil revenue",
    },
    does: {
      en: "Local land record keeper. Still important in many rural areas and for mutation follow-up.",
      ur: "مقامی لینڈ ریکارڈ۔ دیہی علاقوں اور انتقال کے تعاقب میں اب بھی اہم۔",
      roman: "Muqami land record. Dehi ilaqon aur intiqal ke taaqqub mein ab bhi ahem.",
    },
    typicalFor: {
      en: "Khasra location, jamabandi, mutation status, who is in possession.",
      ur: "خسرہ کی جگہ، جمع بندی، انتقال، قبضہ کس کا ہے۔",
      roman: "Khasra ki jagah, jamabandi, intiqal, qabza kis ka hai.",
    },
    caution: {
      en: "Do not pay unofficial 'speed money'. Ask for a written copy and keep a receipt.",
      ur: "غیر سرکاری 'جلدی کی رقم' نہ دیں۔ لکھی کاپی اور رسید رکھیں۔",
      roman: "Ghair sarkari 'jaldi ki raqam' na dein. Likhi copy aur raseed rakhein.",
    },
  },
  {
    id: "registrar",
    name: {
      en: "Sub-Registrar office",
      ur: "سب رجسٹرار آفس",
      roman: "Sub-Registrar office",
    },
    does: {
      en: "Registers sale deeds, some powers of attorney, and related instruments.",
      ur: "بیع نامہ، کچھ مختارنامے اور متعلقہ دستاویز رجسٹر کرتا ہے۔",
      roman: "Sale deed, kuch mukhtarnamay aur mutaliqa documents register karta hai.",
    },
    typicalFor: {
      en: "Registry, biometric of seller, stamp duty process.",
      ur: "رجسٹری، بیچنے والے کی بائیو میٹرک، اسٹامپ ڈیوٹی۔",
      roman: "Registry, bechne wale ki biometric, stamp duty.",
    },
    caution: {
      en: "If the other party refuses to go to the registrar, pause the deal.",
      ur: "اگر دوسری پارٹی رجسٹرار جانے سے انکار کرے تو ڈیل روک دیں۔",
      roman: "Agar doosri party registrar jane se inkar kare to deal rok dein.",
    },
  },
  {
    id: "cda",
    name: {
      en: "CDA (Islamabad)",
      ur: "سی ڈی اے (اسلام آباد)",
      roman: "CDA (Islamabad)",
    },
    does: {
      en: "Allotment, transfer, and building control for much of Islamabad.",
      ur: "اسلام آباد کے زیادہ حصے میں الاٹمنٹ، ٹرانسفر اور بلڈنگ کنٹرول۔",
      roman: "Islamabad ke zyada hisse mein allotment, transfer aur building control.",
    },
    typicalFor: {
      en: "CDA plots/houses, transfer letter, building approval.",
      ur: "سی ڈی اے پلاٹ/گھر، ٹرانسفر لیٹر، نقشہ منظوری۔",
      roman: "CDA plot/ghar, transfer letter, naqsha manzoori.",
    },
    provinces: ["islamabad"],
    caution: {
      en: "Photocopies are not enough. Confirm the plot status from CDA channels.",
      ur: "فوٹو کاپی کافی نہیں۔ پلاٹ کی حیثیت سی ڈی اے سے تصدیق کریں۔",
      roman: "Photocopy kaafi nahi. Plot ki haisiyat CDA se tasdeeq karein.",
    },
  },
  {
    id: "lda",
    name: {
      en: "LDA / development authority (Punjab cities)",
      ur: "ایل ڈی اے / ڈیولپمنٹ اتھارٹی",
      roman: "LDA / development authority",
    },
    does: {
      en: "Scheme plots, building plan approval, and some private housing oversight in Punjab cities.",
      ur: "اسکیم پلاٹ، نقشہ منظوری، اور پنجاب کے شہروں میں کچھ پرائیویٹ ہاؤسنگ نگرانی۔",
      roman: "Scheme plot, naqsha manzoori, aur Punjab ke shehron mein kuch private housing nigrani.",
    },
    typicalFor: {
      en: "Approved vs unapproved society, building plan, conversion issues.",
      ur: "منظور/غیر منظور سوسائٹی، نقشہ، تبدیلی استعمال۔",
      roman: "Manzoor/ghair manzoor society, naqsha, tabdeeli istemal.",
    },
    provinces: ["punjab"],
    caution: {
      en: "Many 'new societies' advertise without approval. Ask for the approval number and verify it.",
      ur: "بہت سی نئی سوسائٹیز بغیر منظوری کے اشتہار دیتی ہیں۔ منظوری نمبر مانگیں اور چیک کریں۔",
      roman: "Bohat si nayi societies baghair manzoori ke ishtehar deti hain. Manzoori number mangein aur check karein.",
    },
  },
  {
    id: "sbca",
    name: {
      en: "SBCA / KDA (Karachi / Sindh urban)",
      ur: "ایس بی سی اے / کے ڈی اے",
      roman: "SBCA / KDA",
    },
    does: {
      en: "Building control and some land/scheme matters in Karachi and parts of Sindh.",
      ur: "کراچی اور سندھ کے کچھ حصوں میں بلڈنگ کنٹرول اور اسکیم معاملات۔",
      roman: "Karachi aur Sindh ke kuch hisson mein building control aur scheme muamlat.",
    },
    typicalFor: {
      en: "Building approval, occupancy, illegal floors, some plot questions.",
      ur: "نقشہ منظوری، قبضہ سرٹیفکیٹ، غیر قانونی منزل، کچھ پلاٹ سوالات۔",
      roman: "Naqsha manzoori, qabza certificate, ghair qanooni manzil, kuch plot sawal.",
    },
    provinces: ["sindh"],
    caution: {
      en: "A 'file' or builder brochure is not SBCA approval.",
      ur: "فائل یا بلڈر کا بروشر ایس بی سی اے کی منظوری نہیں۔",
      roman: "File ya builder ka brochure SBCA ki manzoori nahi.",
    },
  },
  {
    id: "society",
    name: {
      en: "Society / DHA / Bahria transfer office",
      ur: "سوسائٹی / ڈی ایچ اے / بحریہ ٹرانسفر آفس",
      roman: "Society / DHA / Bahria transfer office",
    },
    does: {
      en: "Transfers membership/allotment according to that society's own rules and dues.",
      ur: "اس سوسائٹی کے اپنے قواعد اور بقایا جات کے مطابق رکنیت/الاٹمنٹ منتقل کرتا ہے۔",
      roman: "Us society ke apne qawaid aur baqaya ke mutabiq membership/allotment transfer karta hai.",
    },
    typicalFor: {
      en: "Transfer form, dues clearance, original allotment, membership.",
      ur: "ٹرانسفر فارم، بقایا کلیئرنس، اصل الاٹمنٹ، ممبرشپ۔",
      roman: "Transfer form, baqaya clearance, asal allotment, membership.",
    },
    caution: {
      en: "Each society has different rules. A dealer cannot 'do transfer from the office' without you.",
      ur: "ہر سوسائٹی کے قواعد الگ ہیں۔ ڈیلر آپ کے بغیر دفتر سے ٹرانسفر نہیں کر سکتا۔",
      roman: "Har society ke qawaid alag. Dealer aap ke baghair daftar se transfer nahi kar sakta.",
    },
  },
  {
    id: "cantt",
    name: {
      en: "Cantonment Board",
      ur: "کینٹونمنٹ بورڈ",
      roman: "Cantonment Board",
    },
    does: {
      en: "Property tax, some building control, and transfer formalities inside cantonment limits.",
      ur: "کینٹ حدود میں پراپرٹی ٹیکس، کچھ بلڈنگ کنٹرول، ٹرانسفر کارروائی۔",
      roman: "Cant limits mein property tax, kuch building control, transfer karwai.",
    },
    typicalFor: {
      en: "Cantt houses/plots, tax paid status, building violations.",
      ur: "کینٹ گھر/پلاٹ، ٹیکس ادا، تعمیر کی خلاف ورزی۔",
      roman: "Cantt ghar/plot, tax ada, tamer ki khilaf warzi.",
    },
    caution: {
      en: "Military land and old leases have extra restrictions. Ask the board, not only the agent.",
      ur: "ملٹری لینڈ اور پرانی لیز پر اضافی پابندیاں ہو سکتی ہیں۔ ایجنٹ نہیں، بورڈ سے پوچھیں۔",
      roman: "Military land aur purani lease par izafi pabandiyan ho sakti hain. Agent nahi, board se poochen.",
    },
  },
  {
    id: "excise",
    name: {
      en: "Excise & Taxation / property tax",
      ur: "ایکساائز اینڈ ٹیکسیشن",
      roman: "Excise & Taxation",
    },
    does: {
      en: "Urban immovable property tax in many districts.",
      ur: "بہت سے اضلاع میں شہری پراپرٹی ٹیکس۔",
      roman: "Bohat se azlaa mein shehri property tax.",
    },
    typicalFor: {
      en: "Whether tax is paid in the seller's name and address.",
      ur: "ٹیکس بیچنے والے کے نام اور پتے پر ادا ہے یا نہیں۔",
      roman: "Tax bechne wale ke naam aur pate par ada hai ya nahi.",
    },
    caution: {
      en: "Paid tax is a clue, not full proof of ownership.",
      ur: "ادا شدہ ٹیکس اشارہ ہے، مکمل ملکیت نہیں۔",
      roman: "Ada shuda tax ishara hai, mukammal malkiat nahi.",
    },
  },
  {
    id: "fbr",
    name: {
      en: "FBR (withholding on property)",
      ur: "ایف بی آر (پراپرٹی ودہولڈنگ)",
      roman: "FBR (property withholding)",
    },
    does: {
      en: "Income-tax withholding and some property transaction reporting at registry time.",
      ur: "رجسٹری کے وقت انکم ٹیکس ودہولڈنگ اور کچھ رپورٹنگ۔",
      roman: "Registry ke waqt income tax withholding aur kuch reporting.",
    },
    typicalFor: {
      en: "Buyer/seller tax, filer vs non-filer cost, documented payment trail.",
      ur: "خریدار/فروخت کنندہ ٹیکس، فائلر/نان فائلر لاگت، ادائیگی کا ریکارڈ۔",
      roman: "Kharidar/farokht kuninda tax, filer/non-filer lagat, adaiagi ka record.",
    },
    caution: {
      en: "Cash-only deals that skip tax process are a legal and fraud risk.",
      ur: "صرف نقد اور ٹیکس سے بچنے والی ڈیل قانونی اور فراڈ کا خطرہ ہے۔",
      roman: "Sirf naqd aur tax se bachne wali deal qanooni aur fraud ka khatra hai.",
    },
  },
];
