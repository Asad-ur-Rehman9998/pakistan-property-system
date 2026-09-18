import type { CheckAnswers, Localized } from "@/types/check";

export interface DocumentDef {
  id: string;
  title: Localized;
  hint: Localized;
  termId?: string;
}

export function documentsFor(a: Partial<CheckAnswers>): DocumentDef[] {
  const { intent, settlement, propertyKind } = a;

  if (intent === "rent") {
    return [
      doc(
        "owner_proof",
        "Ownership proof (registry / allotment / fard)",
        "ملکیت کا ثبوت (رجسٹری / الاٹمنٹ / فرد)",
        "Malkiat ka suboot (registry / allotment / fard)",
        "The landlord should show they are the owner or an authorised agent.",
        "مالک دکھائے کہ وہ مالک ہے یا مجاز ایجنٹ ہے۔",
        "Malik dikhaye ke woh malik hai ya mujaz agent hai.",
        "ownership",
      ),
      doc(
        "cnic_owner",
        "Owner CNIC copy",
        "مالک کا شناختی کارڈ",
        "Malik ka CNIC",
        "Match the name on papers with the CNIC.",
        "کاغذات کا نام شناختی کارڈ سے ملایں۔",
        "Kaghazat ka naam CNIC se milayen.",
      ),
      doc(
        "utility_bills",
        "Recent utility bills of this house",
        "اس گھر کے حالیہ بل",
        "Is ghar ke haliya bills",
        "Bills help confirm the address and who has been living there.",
        "بل پتہ اور رہائش کی تصدیق میں مدد دیتے ہیں۔",
        "Bill pata aur rehaish ki tasdeeq mein madad dete hain.",
      ),
      doc(
        "rent_agreement",
        "Written rent agreement (even a draft)",
        "کرایہ نامہ (مسودہ بھی)",
        "Kiraya nama (masawada bhi)",
        "Verbal rent is how disputes start.",
        "زبانی کرایہ سے جھگڑے شروع ہوتے ہیں۔",
        "Zabani kiraya se jhagray shuru hote hain.",
      ),
      doc(
        "society_noc",
        "Society permission if the house is in a society",
        "اگر سوسائٹی میں ہے تو اجازت",
        "Agar society mein hai to ijazat",
        "Some societies restrict renting without notice.",
        "کچھ سوسائٹیز بغیر اطلاع کرایہ روکتی ہیں۔",
        "Kuch societies baghair ittila kiraya rok ti hain.",
        "society",
      ),
    ];
  }

  if (propertyKind === "file") {
    return [
      doc(
        "original_file",
        "Original file / allotment papers",
        "اصل فائل / الاٹمنٹ",
        "Asal file / allotment",
        "Photocopy-only files are high risk.",
        "صرف فوٹو کاپی فائل زیادہ خطرہ ہے۔",
        "Sirf photocopy file zyada khatra hai.",
        "file",
      ),
      doc(
        "payment_receipts",
        "Payment receipts / remaining dues statement",
        "ادائیگی رسیدیں / باقی رقم",
        "Adaiagi raseedein / baqi raqam",
        "Ask how much is still payable to the developer or society.",
        "پوچھیں ڈویلپر یا سوسائٹی کو اب کتنی رقم دینی ہے۔",
        "Poochen developer ya society ko ab kitni raqam deni hai.",
      ),
      doc(
        "transfer_rules",
        "Society transfer rules / NOC process",
        "سوسائٹی ٹرانسفر قواعد",
        "Society transfer qawaid",
        "You need the official transfer path, not a dealer promise.",
        "سرکاری ٹرانسفر طریقہ چاہیے، ڈیلر کا وعدہ نہیں۔",
        "Sarkari transfer tareeqa chahiye, dealer ka wada nahi.",
        "noc",
      ),
      doc(
        "cnic_owner",
        "Seller CNIC",
        "بیچنے والے کا شناختی کارڈ",
        "Bechne wale ka CNIC",
        "Name must match the file.",
        "نام فائل سے ملنا چاہیے۔",
        "Naam file se milna chahiye.",
      ),
      doc(
        "bayana_written",
        "Written token / sale agreement",
        "لکھا ہوا ٹوکن / معاہدہ",
        "Likha hua token / muahida",
        "Write amount, dates, and what happens if transfer fails.",
        "رقم، تاریخیں، اور ٹرانسفر نہ ہونے کی صورت لکھیں۔",
        "Raqam, tareekhein, aur transfer na hone ki soorat likhein.",
        "bayana",
      ),
    ];
  }

  if (settlement === "rural" || propertyKind === "agri") {
    return [
      doc(
        "fard",
        "Fard — government paper of whose land this is",
        "فرد — سرکاری کاغذ کہ زمین کس کے نام ہے",
        "Fard — sarkari kaghaz ke zameen kis ke naam hai",
        "This is the basic rural ownership paper. Get a fresh copy from the record office, not only the seller's old photocopy.",
        "یہ بنیادی دیہی ملکیت کا کاغذ ہے۔ بیچنے والے کی پرانی فوٹو کاپی نہیں، ریکارڈ آفس سے نئی کاپی لیں۔",
        "Yeh bunyadi dehi malkiat ka kaghaz hai. Bechne wale ki purani photocopy nahi, record office se nayi copy lein.",
        "fard",
      ),
      doc(
        "khasra",
        "Khasra / khewat / khatooni numbers",
        "خسرہ / ختوت / کھتونی",
        "Khasra / khewat / khatooni",
        "These numbers must match the field you stood on.",
        "یہ نمبر اسی کھیت سے ملنے چاہییں جس پر آپ کھڑے ہوئے۔",
        "Yeh number usi khet se milne chahiye jis par aap khare hue.",
        "khasra",
      ),
      doc(
        "aks_shajra",
        "Aks Shajra (map extract)",
        "عکس شجرہ",
        "Aks Shajra",
        "Helps confirm location and boundaries.",
        "جگہ اور حدود کی تصدیق میں مدد۔",
        "Jagah aur hudood ki tasdeeq mein madad.",
        "aks",
      ),
      doc(
        "mutation",
        "Latest intiqal / mutation",
        "تازہ انتقال",
        "Taza intiqal",
        "If the last sale or inheritance is not mutated, the record may still show the old owner.",
        "اگر پچھلی فروخت یا وراثت کا انتقال نہ ہوا ہو تو پرانا نام رہ سکتا ہے۔",
        "Agar pichli farokht ya warasat ka intiqal na hua ho to purana naam reh sakta hai.",
        "intiqal",
      ),
      doc(
        "cnic_owner",
        "Seller / heirs CNIC",
        "بیچنے والے / ورثاء کا شناختی کارڈ",
        "Bechne wale / waris ka CNIC",
        "All people who must sign should be identified.",
        "جن کے دستخط ضروری ہیں ان کی شناخت ہو۔",
        "Jin ke dastakhat zaroori hain un ki shanakht ho.",
      ),
      doc(
        "registry",
        "Previous registry if the land was sold before",
        "اگر پہلے فروخت ہوئی ہو تو رجسٹری",
        "Agar pehle farokht hui ho to registry",
        "Useful to trace the chain of title.",
        "ملکیت کی کڑی ملانے کے لیے مفید۔",
        "Malkiat ki kadi milane ke liye mufeed.",
        "registry",
      ),
      doc(
        "bayana_written",
        "Written bayana / agreement",
        "لکھا بیعانہ / معاہدہ",
        "Likha bayana / muahida",
        "Do not pay token on talk only.",
        "صرف بات پر ٹوکن نہ دیں۔",
        "Sirf baat par token na dein.",
        "bayana",
      ),
      doc(
        "warasat",
        "Inheritance papers if owner is deceased",
        "اگر مالک فوت ہو تو وراثت کاغذات",
        "Agar malik fot ho to warasat kaghazat",
        "All heirs generally need to be on the mutation.",
        "عام طور پر تمام ورثاء کا انتقال چاہیے۔",
        "Aam taur par tamam waris ka intiqal chahiye.",
        "warasat",
      ),
    ];
  }

  // urban house / plot / flat / shop
  const list: DocumentDef[] = [
    doc(
      "ownership",
      "Ownership paper (registry, allotment, or fard)",
      "ملکیت کا کاغذ (رجسٹری، الاٹمنٹ یا فرد)",
      "Malkiat ka kaghaz (registry, allotment ya fard)",
      "There must be a government or authority paper, not only an agent printout.",
      "سرکاری یا اتھارٹی کا کاغذ ہونا چاہیے، صرف ایجنٹ پرنٹ نہیں۔",
      "Sarkari ya authority ka kaghaz hona chahiye, sirf agent print nahi.",
      "ownership",
    ),
    doc(
      "cnic_owner",
      "Seller CNIC",
      "بیچنے والے کا شناختی کارڈ",
      "Bechne wale ka CNIC",
      "Name and photo should match the person you are dealing with.",
      "نام اور تصویر سامنے والے شخص سے ملنی چاہیے۔",
      "Naam aur tasveer samne wale shakhs se milni chahiye.",
    ),
    doc(
      "mutation",
      "Mutation / transfer in current seller's name",
      "موجودہ بیچنے والے کے نام انتقال",
      "Mojooda bechne wale ke naam intiqal",
      "Previous owner's name on record is a common trap.",
      "ریکارڈ پر پچھلے مالک کا نام عام مسئلہ ہے۔",
      "Record par pichle malik ka naam aam masla hai.",
      "intiqal",
    ),
    doc(
      "society_noc",
      "Society / authority NOC or transfer letter",
      "سوسائٹی / اتھارٹی این او سی یا ٹرانسفر",
      "Society / authority NOC ya transfer",
      "Needed in DHA, Bahria, CDA, LDA and most private societies.",
      "ڈی ایچ اے، بحریہ، سی ڈی اے، ایل ڈی اے اور زیادہ تر سوسائٹیوں میں۔",
      "DHA, Bahria, CDA, LDA aur zyada tar societies mein.",
      "noc",
    ),
    doc(
      "utility_bills",
      "Utility bills / tax receipt",
      "یوٹیلیٹی بل / ٹیکس رسید",
      "Utility bill / tax raseed",
      "A supporting clue of address and occupation — not full ownership.",
      "پتہ اور رہائش کا اشارہ — مکمل ملکیت نہیں۔",
      "Pata aur rehaish ka ishara — mukammal malkiat nahi.",
    ),
    doc(
      "bayana_written",
      "Written token / sale agreement",
      "لکھا ٹوکن / فروخت معاہدہ",
      "Likha token / farokht muahida",
      "Must include amount, dates, property identity, and refund terms.",
      "رقم، تاریخ، جائیداد کی پہچان اور واپسی کی شرائط ضرور ہوں۔",
      "Raqam, tareekh, jaedad ki pehchan aur wapsi ki sharaet zaroor hon.",
      "bayana",
    ),
  ];

  if (propertyKind === "house" || propertyKind === "flat" || propertyKind === "shop" || propertyKind === "industrial") {
    list.splice(
      4,
      0,
      doc(
        "approved_plan",
        "Approved building plan / completion (if built)",
        "منظور شدہ نقشہ / تکمیل (اگر تعمیر شدہ)",
        "Manzoor shuda naqsha / takmeel (agar tamer shuda)",
        "Illegal floors and map violations can bring notices or demolition risk.",
        "غیر قانونی منزل اور نقشہ خلاف ورزی نوٹس یا انہدام کا خطرہ۔",
        "Ghair qanooni manzil aur naqsha khilaf warzi notice ya inhidaam ka khatra.",
      ),
    );
  }

  return list;
}

function doc(
  id: string,
  enT: string,
  urT: string,
  romanT: string,
  enH: string,
  urH: string,
  romanH: string,
  termId?: string,
): DocumentDef {
  return {
    id,
    title: { en: enT, ur: urT, roman: romanT },
    hint: { en: enH, ur: urH, roman: romanH },
    termId,
  };
}

export function flagDefs(a: Partial<CheckAnswers>): {
  id: string;
  title: Localized;
  hint: Localized;
  termId?: string;
}[] {
  const base = [
    {
      id: "seen_in_person",
      title: {
        en: "Have you stood at this property yourself?",
        ur: "کیا آپ خود اس جگہ جا کر کھڑے ہوئے ہیں؟",
        roman: "Kya aap khud is jagah ja kar khare hue hain?",
      },
      hint: {
        en: "Photos and a dealer office are not enough.",
        ur: "تصاویر اور ڈیلر کا دفتر کافی نہیں۔",
        roman: "Tasaveer aur dealer ka daftar kaafi nahi.",
      },
    },
    {
      id: "occupied",
      title: {
        en: "Is someone else living there or using the land (qabza / possession)?",
        ur: "کیا وہاں کوئی اور رہ رہا ہے یا زمین استعمال کر رہا ہے (قبضہ)؟",
        roman: "Kya wahan koi aur reh raha hai ya zameen istemal kar raha hai (qabza)?",
      },
      hint: {
        en: "Possession problems can take years.",
        ur: "قبضے کے جھگڑے سالوں چل سکتے ہیں۔",
        roman: "Qabze ke jhagray salon chal sakte hain.",
      },
      termId: "qabza",
    },
    {
      id: "walked_boundaries",
      title: {
        en: "Have you walked the four sides / hadd of this land?",
        ur: "کیا آپ نے اس زمین کی چاروں حدیں خود چل کر دیکھی ہیں؟",
        roman: "Kya aap ne is zameen ki charun haddein khud chal kar dekhi hain?",
      },
      hint: {
        en: "A brochure can show the wrong edges. Neighbours often know.",
        ur: "بروشر غلط کنارے دکھا سکتا ہے۔ پڑوسی اکثر جانتے ہیں۔",
        roman: "Brochure ghalat kinare dikha sakta hai. Padosi aksar jante hain.",
      },
      termId: "hadd",
    },
    {
      id: "pressure_today",
      title: {
        en: "Are they rushing you to pay token today?",
        ur: "کیا وہ آج ہی ٹوکن دینے پر زور دے رہے ہیں؟",
        roman: "Kya woh aaj hi token dene par zor de rahe hain?",
      },
      hint: {
        en: "Urgency is a common pressure tactic.",
        ur: "جلدی کرانا عام دباؤ ہے۔",
        roman: "Jaldi karana aam dabao hai.",
      },
    },
    {
      id: "name_match",
      title: {
        en: "Does the seller's name match the papers you have seen?",
        ur: "کیا بیچنے والے کا نام کاغذات سے ملتا ہے؟",
        roman: "Kya bechne wale ka naam kaghazat se milta hai?",
      },
      hint: {
        en: "If you have not seen papers yet, choose Not sure.",
        ur: "اگر کاغذات نہیں دیکھے تو 'پتہ نہیں' دبائیں۔",
        roman: "Agar kaghazat nahi dekhe to 'Pata nahi' dabain.",
      },
    },
    {
      id: "court_case",
      title: {
        en: "Is there a court case, stay order, or family dispute?",
        ur: "کیا مقدمہ، سٹے آرڈر یا خاندانی جھگڑا ہے؟",
        roman: "Kya muqadma, stay order ya khandani jhagra hai?",
      },
      hint: {
        en: "If anyone in the family objects, pause.",
        ur: "اگر گھر کا کوئی اعتراض کرے تو رک جائیں۔",
        roman: "Agar ghar ka koi etiraz kare to ruk jaen.",
      },
      termId: "stay",
    },
  ];

  if (a.settlement === "urban" && a.propertyKind !== "file") {
    base.push({
      id: "society_approved",
      title: {
        en: "Is this a government-approved society / scheme?",
        ur: "کیا یہ منظور شدہ سوسائٹی / اسکیم ہے؟",
        roman: "Kya yeh manzoor shuda society / scheme hai?",
      },
      hint: {
        en: "Unapproved societies are a major Pakistan risk.",
        ur: "غیر منظور سوسائٹیز پاکستان کا بڑا خطرہ ہیں۔",
        roman: "Ghair manzoor societies Pakistan ka bara khatra hain.",
      },
      termId: "society",
    });
  }

  if (a.settlement === "rural" || a.propertyKind === "agri") {
    base.push({
      id: "all_heirs",
      title: {
        en: "If this is inherited land, have all heirs agreed?",
        ur: "اگر وراثتی زمین ہے تو کیا تمام ورثاء راضی ہیں؟",
        roman: "Agar warasati zameen hai to kya tamam waris razi hain?",
      },
      hint: {
        en: "One brother cannot usually sell the whole khata.",
        ur: "ایک بھائی عام طور پر سارا کھاتہ نہیں بیچ سکتا۔",
        roman: "Ek bhai aam taur par sara khata nahi bech sakta.",
      },
      termId: "warasat",
    });
  }

  if (a.counterparty === "poa" || a.counterparty === "agent") {
    base.push({
      id: "met_owner",
      title: {
        en: "Have you spoken to the actual owner (call/video is ok)?",
        ur: "کیا آپ نے اصل مالک سے بات کی ہے (کال/ویڈیو ٹھیک)؟",
        roman: "Kya aap ne asal malik se baat ki hai (call/video theek)?",
      },
      hint: {
        en: "Agents and attorneys must be checked with the owner.",
        ur: "ایجنٹ اور مختار کی تصدیق مالک سے ہونی چاہیے۔",
        roman: "Agent aur mukhtar ki tasdeeq malik se honi chahiye.",
      },
    });
  }

  if (a.propertyKind === "file") {
    base.push({
      id: "land_exists",
      title: {
        en: "Has the developer shown that this plot/unit actually exists?",
        ur: "کیا ڈویلپر نے دکھایا کہ یہ پلاٹ/یونٹ واقعی موجود ہے؟",
        roman: "Kya developer ne dikhaya ke yeh plot/unit waqai mojood hai?",
      },
      hint: {
        en: "Some files are only a number on paper.",
        ur: "کچھ فائلیں صرف کاغذ کا نمبر ہوتی ہیں۔",
        roman: "Kuch files sirf kaghaz ka number hoti hain.",
      },
      termId: "file",
    });
  }

  return base;
}
