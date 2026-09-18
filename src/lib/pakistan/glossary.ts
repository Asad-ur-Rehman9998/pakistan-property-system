import type { Localized } from "@/types/check";

export type TermGroup = "papers" | "place" | "size" | "money" | "deal";

export interface GlossaryTerm {
  id: string;
  group: TermGroup;
  term: Localized;
  alsoCalled?: Localized;
  /** One-line neighbour explanation — shown wherever the word appears. */
  plain: Localized;
  meaning: Localized;
  whenNeeded: Localized;
}

function T(
  id: string,
  group: TermGroup,
  term: Localized,
  plain: Localized,
  meaning: Localized,
  whenNeeded: Localized,
  alsoCalled?: Localized,
): GlossaryTerm {
  return { id, group, term, plain, meaning, whenNeeded, alsoCalled };
}

export const glossary: GlossaryTerm[] = [
  T(
    "fard",
    "papers",
    { en: "Fard", ur: "فرد", roman: "Fard" },
    {
      en: "The government paper that says whose land this is.",
      ur: "سرکاری کاغذ جو بتاتا ہے زمین کس کے نام ہے۔",
      roman: "Sarkari kaghaz jo batata hai zameen kis ke naam hai.",
    },
    {
      en: "A land record that shows who is written as owner in the government record. In Punjab this often comes from PLRA / Arazi Record Center.",
      ur: "سرکاری ریکارڈ جس میں لکھا ہوتا ہے کہ زمین کس کے نام ہے۔ پنجاب میں یہ اکثر اراضی ریکارڈ سینٹر سے ملتی ہے۔",
      roman: "Sarkari record jisme likha hota hai zameen kis ke naam hai. Punjab mein aksar Arazi Record Center se milti hai.",
    },
    {
      en: "Before buying land, a house on land, or paying token for rural or many urban properties.",
      ur: "زمین، پلاٹ یا گھر خریدنے اور ٹوکن دینے سے پہلے۔",
      roman: "Zameen, plot ya ghar kharidne aur token dene se pehle.",
    },
    { en: "Record of rights", ur: "حقوق کی دستاویز", roman: "Record of rights" },
  ),
  T(
    "intiqal",
    "papers",
    { en: "Intiqal / Mutation", ur: "انتقال", roman: "Intiqal / Mutation" },
    {
      en: "Updating the government record so the new owner's name actually appears.",
      ur: "سرکاری ریکارڈ میں نئے مالک کا نام چڑھانا۔",
      roman: "Sarkari record mein naye malik ka naam charhana.",
    },
    {
      en: "The update in land records after a sale or inheritance so the new owner's name actually appears. A registry without mutation can leave the old name on record.",
      ur: "خرید یا وراثت کے بعد ریکارڈ میں نئے مالک کا نام چڑھانا۔ رجسٹری ہو اور انتقال نہ ہو تو پرانا نام رہ سکتا ہے۔",
      roman: "Kharid ya warasat ke baad record mein naye malik ka naam charhana. Registry ho aur intiqal na ho to purana naam reh sakta hai.",
    },
    {
      en: "After every sale or inheritance, and before you trust that the seller is the recorded owner.",
      ur: "ہر فروخت یا وراثت کے بعد، اور اس سے پہلے کہ آپ بیچنے والے کو ریکارڈ کا مالک مانیں۔",
      roman: "Har farokht ya warasat ke baad, aur is se pehle ke aap bechne wale ko record ka malik mane.",
    },
  ),
  T(
    "registry",
    "papers",
    { en: "Registry", ur: "رجسٹری", roman: "Registry" },
    {
      en: "The sale written at the government registrar's office — not only a stamp paper at a dealer.",
      ur: "سرکاری رجسٹرار کے دفتر میں لکھی فروخت — صرف ڈیلر کے سٹام پیپر پر نہیں۔",
      roman: "Sarkari registrar ke daftar mein likhi farokht — sirf dealer ke stamp paper par nahi.",
    },
    {
      en: "The registered sale document at the sub-registrar. An agreement on stamp paper is not the same as a completed registry.",
      ur: "سب رجسٹرار کے دفتر میں درج فروخت کا دستاویز۔ صرف سٹام پیپر پر معاہدہ رجسٹری نہیں ہے۔",
      roman: "Sub-registrar ke daftar mein darj farokht ka document. Sirf stamp paper par muahida registry nahi hai.",
    },
    {
      en: "To actually transfer ownership of immovable property, not only to 'book' it.",
      ur: "ملکیت منتقل کرنے کے لیے، صرف بکنگ کے لیے نہیں۔",
      roman: "Malkiat transfer karne ke liye, sirf booking ke liye nahi.",
    },
  ),
  T(
    "sale_deed",
    "papers",
    { en: "Sale deed / Bai nama", ur: "بیع نامہ", roman: "Sale deed / Bai nama" },
    {
      en: "The written sale paper. After it is registered, people usually call it registry.",
      ur: "لکھا ہوا فروخت کا کاغذ۔ رجسٹر ہونے کے بعد اسے عام طور پر رجسٹری کہتے ہیں۔",
      roman: "Likha hua farokht ka kaghaz. Register hone ke baad ise aam taur par registry kehte hain.",
    },
    {
      en: "The deed that records buyer, seller, price, and property. Unsigned drafts and WhatsApp deals are not a sale deed.",
      ur: "وہ دستاویز جس میں خریدار، بیچنے والا، قیمت اور جائیداد لکھی ہو۔ بغیر دستخط مسودہ یا واٹس ایپ ڈیل بیع نامہ نہیں۔",
      roman: "Woh dastavez jisme kharidar, bechne wala, qeemat aur jaedad likhi ho. Baghair dastakhat masawada ya WhatsApp deal bai nama nahi.",
    },
    {
      en: "Before paying more than a small token, and always before final payment.",
      ur: "چھوٹے ٹوکن سے زیادہ ادائیگی سے پہلے، اور حتمی ادائیگی سے پہلے ضرور۔",
      roman: "Chhote token se zyada adaiagi se pehle, aur hatmi adaiagi se pehle zaroor.",
    },
  ),
  T(
    "bayana",
    "deal",
    { en: "Bayana / Token money", ur: "بیعانہ / ٹوکن", roman: "Bayana / Token" },
    {
      en: "Advance money to hold the deal. Easy to lose if it is not written.",
      ur: "ڈیل روکنے کی پیشگی رقم۔ نہ لکھی ہو تو ڈوبنا آسان ہے۔",
      roman: "Deal rokne ki peshgi raqam. Na likhi ho to doobna asaan hai.",
    },
    {
      en: "Advance money to show seriousness. If it is not written clearly (amount, date, what happens if deal fails), it is easy to lose money.",
      ur: "سنجیدگی کے لیے پیشگی رقم۔ اگر رقم، تاریخ اور ڈیل ٹوٹنے کی صورت نہ لکھی ہو تو پیسہ ڈوب سکتا ہے۔",
      roman: "Sanjidagi ke liye peshgi raqam. Agar raqam, tareekh aur deal tootne ki soorat na likhi ho to paisa doob sakta hai.",
    },
    {
      en: "Always put token terms in writing before paying. Do not pay only on WhatsApp talk.",
      ur: "ٹوکن سے پہلے شرائط لکھوا لیں۔ صرف واٹس ایپ بات پر پیسے نہ دیں۔",
      roman: "Token se pehle sharaet likhwa lein. Sirf WhatsApp baat par paise na dein.",
    },
  ),
  T(
    "mukhtarnama",
    "papers",
    { en: "Mukhtarnama / Power of attorney", ur: "مختارنامہ", roman: "Mukhtarnama / POA" },
    {
      en: "A paper that lets someone else sell or deal in the owner's place.",
      ur: "ایسا کاغذ جس سے دوسرا شخص مالک کی جگہ بیچ سکتا ہے۔",
      roman: "Aisa kaghaz jis se doosra shakhs malik ki jagah bech sakta hai.",
    },
    {
      en: "A paper that lets someone else sell or deal on the owner's behalf. Fake or old powers of attorney are a common fraud.",
      ur: "ایسا کاغذ جس سے دوسرا شخص مالک کی جگہ بیچ سکتا ہے۔ جعلی یا پرانا مختارنامہ عام فراڈ ہے۔",
      roman: "Aisa kaghaz jis se doosra shakhs malik ki jagah bech sakta hai. Jalii ya purana mukhtarnama aam fraud hai.",
    },
    {
      en: "If the person in front of you is not the owner, verify the power of attorney from the owner and often from the registrar.",
      ur: "اگر سامنے والا مالک نہیں، تو مختارنامہ مالک اور اکثر رجسٹرار سے تصدیق کروائیں۔",
      roman: "Agar samne wala malik nahi, to mukhtarnama malik aur aksar registrar se tasdeeq karwaen.",
    },
  ),
  T(
    "khasra",
    "place",
    { en: "Khasra / Khewat / Khatooni", ur: "خسرہ / ختوت / کھتونی", roman: "Khasra / Khewat / Khatooni" },
    {
      en: "The numbers that say which exact piece of village land this is.",
      ur: "نمبر جو بتاتے ہیں گاؤں کی کون سی زمین یہ ہے۔",
      roman: "Number jo batate hain gaon ki kaun si zameen yeh hai.",
    },
    {
      en: "Numbers that identify a specific rural land parcel and its ownership entry. Without them, 'this killa' can mean the wrong field.",
      ur: "دیہی زمین کے ٹکڑے اور ملکیت کی شناخت کے نمبر۔ ان کے بغیر 'یہ مربع' غلط کھیت بھی ہو سکتا ہے۔",
      roman: "Dehi zameen ke tukray aur malkiat ki shanakht ke number. In ke baghair 'yeh murabba' ghalat khet bhi ho sakta hai.",
    },
    {
      en: "Before buying agricultural land or a village plot. Match numbers on paper with the field.",
      ur: "زرعی زمین یا گاؤں کا پلاٹ لینے سے پہلے۔ کاغذ کے نمبر کھیت سے ملائیں۔",
      roman: "Zaraee zameen ya gaon ka plot lene se pehle. Kaghaz ke number khet se milayen.",
    },
  ),
  T(
    "aks",
    "place",
    { en: "Aks Shajra", ur: "عکس شجرہ", roman: "Aks Shajra" },
    {
      en: "A small map of the land pieces, to see you are on the right field.",
      ur: "زمین کے ٹکڑوں کا چھوٹا نقشہ، تاکہ پتہ چلے آپ صحیح کھیت پر ہیں۔",
      roman: "Zameen ke tukron ka chhota naqsha, taake pata chale aap sahi khet par hain.",
    },
    {
      en: "A map extract of land parcels. It helps confirm you are looking at the same land written in the fard.",
      ur: "زمین کے قطعات کا نقشہ۔ اس سے پتہ چلتا ہے کہ فرد والی زمین وہی ہے جو آپ دیکھ رہے ہیں۔",
      roman: "Zameen ke qataat ka naqsha. Is se pata chalta hai ke fard wali zameen wohi hai jo aap dekh rahe hain.",
    },
    {
      en: "Rural land purchases, boundary disputes, and before token if location is unclear.",
      ur: "دیہی خرید، حد بندی جھگڑے، اور اگر جگہ واضح نہ ہو تو ٹوکن سے پہلے۔",
      roman: "Dehi kharid, hadbandi jhagray, aur agar jagah wazeh na ho to token se pehle.",
    },
  ),
  T(
    "mouza",
    "place",
    { en: "Mouza", ur: "موضع", roman: "Mouza" },
    {
      en: "The official village name in the land record — not only the nickname people use.",
      ur: "لینڈ ریکارڈ میں گاؤں کا سرکاری نام — صرف وہ عرفی نام نہیں جو لوگ بولتے ہیں۔",
      roman: "Land record mein gaon ka sarkari naam — sirf woh urfi naam nahi jo log bolte hain.",
    },
    {
      en: "A revenue village. Two nearby fields can be in different mouza names. The fard must match the land you stood on.",
      ur: "ریونیو گاؤں۔ قریبی دو کھیت الگ موضع میں ہو سکتے ہیں۔ فرد اسی زمین سے ملنی چاہیے جہاں آپ کھڑے ہوئے۔",
      roman: "Revenue gaon. Qareebi do khet alag mouza mein ho sakte hain. Fard usi zameen se milni chahiye jahan aap khare hue.",
    },
    {
      en: "Write it before token on village land. Ask the patwari or Arazi office if unsure.",
      ur: "گاؤں کی زمین پر ٹوکن سے پہلے لکھیں۔ شک ہو تو پٹواری یا اراضی آفس سے پوچھیں۔",
      roman: "Gaon ki zameen par token se pehle likhein. Shak ho to patwari ya Arazi office se poochen.",
    },
  ),
  T(
    "plot",
    "place",
    { en: "Plot number", ur: "پلاٹ نمبر", roman: "Plot number" },
    {
      en: "The society's number for that exact plot — 'this house' is not enough.",
      ur: "سوسائٹی کا نمبر اسی پلاٹ کا — صرف 'یہ گھر' کافی نہیں۔",
      roman: "Society ka number usi plot ka — sirf 'yeh ghar' kaafi nahi.",
    },
    {
      en: "In DHA, Bahria, LDA and most societies each plot has a number on a map. A file number is different from a registered plot number.",
      ur: "ڈی ایچ اے، بحریہ، ایل ڈی اے اور زیادہ تر سوسائٹیوں میں ہر پلاٹ کا نقشے پر نمبر ہوتا ہے۔ فائل نمبر رجسٹرڈ پلاٹ نمبر سے الگ ہے۔",
      roman: "DHA, Bahria, LDA aur zyada tar societies mein har plot ka naqshe par number hota hai. File number registered plot number se alag hai.",
    },
    {
      en: "Write it before paying token. Match it on the ground and on the paper.",
      ur: "ٹوکن سے پہلے لکھیں۔ زمین اور کاغذ دونوں پر ملائیں۔",
      roman: "Token se pehle likhein. Zameen aur kaghaz dono par milayen.",
    },
  ),
  T(
    "hadd",
    "place",
    { en: "Hadd / Boundaries", ur: "حد / حدود", roman: "Hadd / Boundaries" },
    {
      en: "The four sides of the land. A brochure can show the wrong edges.",
      ur: "زمین کی چار سمتیں۔ بروشر غلط کنارے دکھا سکتا ہے۔",
      roman: "Zameen ki char simtein. Brochure ghalat kinare dikha sakta hai.",
    },
    {
      en: "Walk the sides. Ask two neighbours whose land this is. Overlapping murabba and shifted walls are known disputes.",
      ur: "چاروں طرف چلیں۔ دو پڑوسیوں سے پوچھیں یہ کس کی ہے۔ اوورلیپ مربع اور ہٹی ہوئی دیوار معروف جھگڑے ہیں۔",
      roman: "Charun taraf chalein. Do padosiyon se poochen yeh kis ki hai. Overlap murabba aur hati hui deewar maroof jhagray hain.",
    },
    {
      en: "Before token, especially on village land, corner plots, and new societies.",
      ur: "ٹوکن سے پہلے، خاص طور پر گاؤں کی زمین، کونے کے پلاٹ اور نئی سوسائٹیوں میں۔",
      roman: "Token se pehle, khaas taur par gaon ki zameen, kone ke plot aur nayi societies mein.",
    },
  ),
  T(
    "noc",
    "papers",
    { en: "NOC", ur: "این او سی", roman: "NOC" },
    {
      en: "A letter saying the society or office does not object to the transfer. It is not ownership by itself.",
      ur: "خط کہ سوسائٹی یا دفتر منتقلی پر اعتراض نہیں کرتا۔ یہ اکیلے ملکیت نہیں۔",
      roman: "Khat ke society ya daftar transfer par etiraz nahi karta. Yeh akele malkiat nahi.",
    },
    {
      en: "A letter from a society, cantonment, or authority saying they do not object to transfer or construction. It is not by itself proof of ownership.",
      ur: "سوسائٹی یا اتھارٹی کا خط کہ منتقلی یا تعمیر پر اعتراض نہیں۔ یہ اکیلے ملکیت ثابت نہیں کرتا۔",
      roman: "Society ya authority ka khat ke transfer ya tamer par etiraz nahi. Yeh akele malkiat sabit nahi karta.",
    },
    {
      en: "Most housing societies, DHA/Bahria-style transfers, and some construction.",
      ur: "زیادہ تر ہاؤسنگ سوسائٹیز، ڈی ایچ اے/بحریہ قسم کی منتقلی، اور کچھ تعمیرات۔",
      roman: "Zyada tar housing societies, DHA/Bahria type transfer, aur kuch tamirat.",
    },
    { en: "No objection certificate", ur: "عدم اعتراض سرٹیفکیٹ", roman: "No objection certificate" },
  ),
  T(
    "file",
    "papers",
    { en: "File", ur: "فائل", roman: "File" },
    {
      en: "A booking paper for a plot that may not yet be land in your name.",
      ur: "پلاٹ کی بکنگ کا کاغذ جو ابھی آپ کے نام کی زمین نہ ہو۔",
      roman: "Plot ki booking ka kaghaz jo abhi aap ke naam ki zameen na ho.",
    },
    {
      en: "A booking/allotment paper for a plot or unit that may not yet be a registered plot in your name. A file is not the same as possession of land.",
      ur: "بکنگ/الاٹمنٹ کا کاغذ جو ابھی آپ کے نام کی رجسٹرڈ زمین نہ ہو۔ فائل قبضہ نہیں ہے۔",
      roman: "Booking/allotment ka kaghaz jo abhi aap ke naam ki registered zameen na ho. File qabza nahi hai.",
    },
    {
      en: "When someone is selling a 'file' in a society or project. Ask: allotment, remaining dues, transfer rules, and whether land exists.",
      ur: "جب کوئی سوسائٹی یا پروجیکٹ کی 'فائل' بیچے۔ پوچھیں: الاٹمنٹ، باقی رقم، ٹرانسفر، اور زمین موجود ہے یا نہیں۔",
      roman: "Jab koi society ya project ki 'file' beche. Poochen: allotment, baqi raqam, transfer, aur zameen mojood hai ya nahi.",
    },
  ),
  T(
    "warasat",
    "deal",
    { en: "Warasat / Inheritance", ur: "وراثت", roman: "Warasat" },
    {
      en: "When the owner has died, usually every heir must be on the record — not one brother alone.",
      ur: "مالک فوت ہو تو عام طور پر ہر وارث ریکارڈ پر ہو — اکیلے ایک بھائی نہیں۔",
      roman: "Malik fot ho to aam taur par har waris record par ho — akele ek bhai nahi.",
    },
    {
      en: "When the recorded owner has died, all legal heirs usually must be on the mutation. One brother selling 'family land' is a frequent dispute.",
      ur: "اگر ریکارڈ کا مالک فوت ہو چکا ہو تو عام طور پر تمام ورثاء کا انتقال ضروری ہے۔ ایک بھائی کا 'خاندانی زمین' بیچنا عام جھگڑا ہے۔",
      roman: "Agar record ka malik fot ho chuka ho to aam taur par tamam waris ka intiqal zaroori hai. Ek bhai ka 'khandani zameen' bechna aam jhagrah hai.",
    },
    {
      en: "Any property whose owner is deceased, or which is still in a parent or grandparent's name.",
      ur: "جس ملکیت کا مالک فوت ہو، یا جو اب بھی والدین/دادا کے نام ہو۔",
      roman: "Jis malkiat ka malik fot ho, ya jo ab bhi walidain/dada ke naam hon.",
    },
  ),
  T(
    "qabza",
    "deal",
    { en: "Qabza / Possession", ur: "قبضہ", roman: "Qabza / Possession" },
    {
      en: "Who is actually sitting on the house or land — papers and possession can be different people.",
      ur: "عملی طور پر گھر یا زمین پر کون بیٹھا ہے — کاغذ اور قبضہ الگ لوگوں کے ہو سکتے ہیں۔",
      roman: "Amali taur par ghar ya zameen par kaun baitha hai — kaghaz aur qabza alag logon ke ho sakte hain.",
    },
    {
      en: "Who actually occupies the property. Papers without vacant or agreed possession can become a long fight, even if documents look fine.",
      ur: "عملی طور پر کون رہ رہا ہے۔ کاغذات ٹھیک ہوں اور قبضہ نہ ہو تو لمبی لڑائی ہو سکتی ہے۔",
      roman: "Amali taur par kaun reh raha hai. Kaghazat theek hon aur qabza na ho to lambi larai ho sakti hai.",
    },
    {
      en: "Visit yourself. Ask neighbours. Do not buy only from photos or a dealer's office.",
      ur: "خود جائیں۔ پڑوسیوں سے پوچھیں۔ صرف فوٹو یا ڈیلر کے دفتر سے نہ خریدیں۔",
      roman: "Khud jaen. Padosiyon se poochen. Sirf photo ya dealer ke daftar se na khariden.",
    },
  ),
  T(
    "ownership",
    "deal",
    { en: "Ownership", ur: "ملکیت", roman: "Malkiat / Ownership" },
    {
      en: "Whose name is on the government or society paper — not who is showing you the house.",
      ur: "سرکاری یا سوسائٹی کے کاغذ پر کس کا نام ہے — جو گھر دکھا رہا ہے وہ مالک نہ بھی ہو۔",
      roman: "Sarkari ya society ke kaghaz par kis ka naam hai — jo ghar dikha raha hai woh malik na bhi ho.",
    },
    {
      en: "Legal ownership in Pakistan usually needs a fard, registry, allotment, or society transfer in the seller's name. A visiting card or WhatsApp status is not ownership.",
      ur: "پاکستان میں قانونی ملکیت عام طور پر فرد، رجسٹری، الاٹمنٹ یا سوسائٹی ٹرانسفر سے ہوتی ہے۔ وزٹنگ کارڈ یا واٹس ایپ ملکیت نہیں۔",
      roman: "Pakistan mein qanooni malkiat aam taur par fard, registry, allotment ya society transfer se hoti hai. Visiting card ya WhatsApp malkiat nahi.",
    },
    {
      en: "Before any token. Match the name on paper with the person's CNIC, without storing the CNIC number in this app.",
      ur: "کسی ٹوکن سے پہلے۔ کاغذ کا نام شناختی کارڈ سے ملائیں، اس ایپ میں شناختی نمبر نہ لکھیں۔",
      roman: "Kisi token se pehle. Kaghaz ka naam CNIC se milayen, is app mein CNIC number na likhein.",
    },
  ),
  T(
    "society",
    "place",
    { en: "Society / developer", ur: "سوسائٹی / ڈویلپر", roman: "Society / developer" },
    {
      en: "The housing scheme or builder whose office must confirm transfer — not only the dealer.",
      ur: "ہاؤسنگ اسکیم یا بلڈر جس کے دفتر سے ٹرانسفر کی تصدیق ہو — صرف ڈیلر نہیں۔",
      roman: "Housing scheme ya builder jiske daftar se transfer ki tasdeeq ho — sirf dealer nahi.",
    },
    {
      en: "Many city plots sit in DHA, CDA, LDA, cooperative, or private schemes. Unapproved societies are a major Pakistan buyer trap.",
      ur: "شہر کے بہت سے پلاٹ ڈی ایچ اے، سی ڈی اے، ایل ڈی اے، کوآپریٹو یا پرائیویٹ اسکیم میں ہوتے ہیں۔ غیر منظور سوسائٹی بڑا جال ہے۔",
      roman: "Shehar ke bohat se plot DHA, CDA, LDA, cooperative ya private scheme mein hote hain. Ghair manzoor society bara jaal hai.",
    },
    {
      en: "Ask the official society/developer office about dues, NOC, and whether the scheme is approved.",
      ur: "سوسائٹی/ڈویلپر کے سرکاری دفتر سے بقایا، این او سی، اور منظوری پوچھیں۔",
      roman: "Society/developer ke sarkari daftar se baqaya, NOC, aur manzoori poochen.",
    },
  ),
  T(
    "stay",
    "deal",
    { en: "Stay order / Court case", ur: "سٹے آرڈر / مقدمہ", roman: "Stay order / Muqadma" },
    {
      en: "A court can freeze the sale. Dealers may not mention it.",
      ur: "عدالت فروخت روک سکتی ہے۔ ڈیلر نہ بتائیں۔",
      roman: "Adalat farokht rok sakti hai. Dealer na batayen.",
    },
    {
      en: "A court can stop sale or construction. Dealers may hide this. You must ask and, where possible, check with a lawyer or court search.",
      ur: "عدالت فروخت یا تعمیر روک سکتی ہے۔ ڈیلر چھپا سکتے ہیں۔ پوچھیں اور ممکن ہو تو وکیل/عدالت سے چیک کریں۔",
      roman: "Adalat farokht ya tamer rok sakti hai. Dealer chhupa sakte hain. Poochen aur mumkin ho to wakeel/adalat se check karein.",
    },
    {
      en: "Before token, especially if the price is 'urgent' or 'too good'.",
      ur: "ٹوکن سے پہلے، خاص طور پر اگر قیمت 'جلدی' یا 'بہت سستی' ہو۔",
      roman: "Token se pehle, khaas taur par agar qeemat 'jaldi' ya 'bohat sasti' ho.",
    },
  ),
  T(
    "plra",
    "papers",
    { en: "PLRA / Arazi Record Center", ur: "پی ایل آر اے / اراضی ریکارڈ سینٹر", roman: "PLRA / Arazi Record Center" },
    {
      en: "Punjab offices where you can often get a fresh fard, for a fee.",
      ur: "پنجاب کے دفاتر جہاں اکثر نئی فرد ملتی ہے، فیس دے کر۔",
      roman: "Punjab ke dafter jahan aksar nayi fard milti hai, fees de kar.",
    },
    {
      en: "Punjab's land record offices where you can often get fard and related copies for a fee. Hours and process can change — confirm locally.",
      ur: "پنجاب کے دفاتر جہاں فرد وغیرہ ملتی ہے۔ وقت اور طریقہ بدل سکتا ہے — مقامی تصدیق کریں۔",
      roman: "Punjab ke dafter jahan fard waghera milti hai. Waqt aur tareeqa badal sakta hai — muqami tasdeeq karein.",
    },
    {
      en: "Punjab land and many village/urban properties still on land records.",
      ur: "پنجاب کی زمین اور بہت سی جائیدادیں جو لینڈ ریکارڈ پر ہیں۔",
      roman: "Punjab ki zameen aur bohat si jaedadain jo land record par hain.",
    },
  ),
  T(
    "biometric",
    "deal",
    { en: "Biometric at registrar", ur: "رجسٹرار پر بائیو میٹرک", roman: "Registrar par biometric" },
    {
      en: "Fingerprint / CNIC check of the seller at the registrar — a dealer office is not this.",
      ur: "رجسٹرار پر بیچنے والے کی انگلی / شناختی چیک — ڈیلر کا دفتر یہ نہیں۔",
      roman: "Registrar par bechne wale ki ungli / shanakhti check — dealer ka daftar yeh nahi.",
    },
    {
      en: "In many districts the seller's fingerprint/CNIC check is required at registry. If someone avoids the registrar, treat that as a warning.",
      ur: "بہت سے اضلاع میں رجسٹری پر بیچنے والے کی بائیو میٹرک ہوتی ہے۔ جو رجسٹرار سے بچے، اس سے ہوشیار رہیں۔",
      roman: "Bohat se azlaa mein registry par bechne wale ki biometric hoti hai. Jo registrar se bache, us se hoshiyar rahein.",
    },
    {
      en: "At the time of registry, not only at a dealer's office.",
      ur: "رجسٹری کے وقت، صرف ڈیلر کے دفتر میں نہیں۔",
      roman: "Registry ke waqt, sirf dealer ke daftar mein nahi.",
    },
  ),
  T(
    "allotment",
    "papers",
    { en: "Allotment / Transfer letter", ur: "الاٹمنٹ / ٹرانسفر لیٹر", roman: "Allotment / Transfer letter" },
    {
      en: "The society's own paper that a plot is in someone's name.",
      ur: "سوسائٹی کا اپنا کاغذ کہ پلاٹ کسی کے نام ہے۔",
      roman: "Society ka apna kaghaz ke plot kisi ke naam hai.",
    },
    {
      en: "In many societies the authority's allotment or transfer letter is the main paper, not a rural fard. Confirm it from that same office, not only a photocopy.",
      ur: "بہت سی سوسائٹیوں میں اتھارٹی کا الاٹمنٹ یا ٹرانسفر لیٹر بنیادی کاغذ ہوتا ہے، دیہی فرد نہیں۔ فوٹو کاپی نہیں، اسی دفتر سے تصدیق کریں۔",
      roman: "Bohat si societies mein authority ka allotment ya transfer letter bunyadi kaghaz hota hai, dehi fard nahi. Photocopy nahi, usi daftar se tasdeeq karein.",
    },
    {
      en: "DHA, CDA, LDA schemes, cooperative societies, and similar.",
      ur: "ڈی ایچ اے، سی ڈی اے، ایل ڈی اے اسکیمز، کوآپریٹو سوسائٹیز۔",
      roman: "DHA, CDA, LDA schemes, cooperative societies.",
    },
  ),
  T(
    "marla",
    "size",
    { en: "Marla", ur: "مرلہ", roman: "Marla" },
    {
      en: "The usual city-plot size in much of Punjab. Square feet in one marla is not the same in every city.",
      ur: "پنجاب کے بہت سے شہروں میں پلاٹ کا عام ناپ۔ ایک مرلہ کے فٹ ہر شہر میں ایک نہیں۔",
      roman: "Punjab ke bohat se shehron mein plot ka aam naap. Ek marla ke feet har shehar mein ek nahi.",
    },
    {
      en: "People say 5 marla, 10 marla, 1 kanal. Some towns use about 272 sq ft per marla, others 225. This app does not convert as if one rule is official.",
      ur: "لوگ ۵ مرلہ، ۱۰ مرلہ، ۱ کنال کہتے ہیں۔ کچھ شہر تقریباً ۲۷۲ فٹ فی مرلہ، کچھ ۲۲۵۔ یہ ایپ ایک سرکاری فارمولا نہیں لگاتی۔",
      roman: "Log 5 marla, 10 marla, 1 kanal kehte hain. Kuch shehar taqreeban 272 feet fi marla, kuch 225. Yeh app ek sarkari formula nahi lagati.",
    },
    {
      en: "Write the size the seller used, then confirm at the society or with neighbours.",
      ur: "بیچنے والے والا ناپ لکھیں، پھر سوسائٹی یا پڑوسیوں سے پوچھیں۔",
      roman: "Bechne wale wala naap likhein, phir society ya padosiyon se poochen.",
    },
  ),
  T(
    "kanal",
    "size",
    { en: "Kanal", ur: "کنال", roman: "Kanal" },
    {
      en: "A bigger plot size. In most of Pakistan 1 kanal is 20 marla.",
      ur: "بڑا پلاٹ۔ زیادہ تر پاکستان میں ۱ کنال = ۲۰ مرلہ۔",
      roman: "Bara plot. Zyada tar Pakistan mein 1 kanal = 20 marla.",
    },
    {
      en: "Older city houses are often 1 or 2 kanal. Still write the plot number and walk the boundaries.",
      ur: "پرانے شہر کے گھر اکثر ۱ یا ۲ کنال۔ پھر بھی پلاٹ نمبر لکھیں اور حدود پر چلیں۔",
      roman: "Purane shehar ke ghar aksar 1 ya 2 kanal. Phir bhi plot number likhein aur hudood par chalein.",
    },
    {
      en: "When the dealer says kanal, ask how many marla they mean in this city.",
      ur: "جب ڈیلر کنال کہے تو پوچھیں اس شہر میں کتنے مرلہ۔",
      roman: "Jab dealer kanal kahe to poochen is shehar mein kitne marla.",
    },
  ),
  T(
    "sqyd",
    "size",
    { en: "Square yards (gaz)", ur: "مربع گز", roman: "Square yards (gaz)" },
    {
      en: "How Karachi and many Sindh plots are measured. People also say gaz.",
      ur: "کراچی اور سندھ کے بہت سے پلاٹ اسی میں ناپے جاتے ہیں۔ لوگ گز بھی کہتے ہیں۔",
      roman: "Karachi aur Sindh ke bohat se plot isi mein naape jate hain. Log gaz bhi kehte hain.",
    },
    {
      en: "One square yard is 9 square feet. Do not mix gaz with marla unless someone explains both.",
      ur: "ایک مربع گز = ۹ مربع فٹ۔ گز اور مرلہ ملا کر نہ سمجھیں جب تک دونوں نہ بتائیں۔",
      roman: "Ek murabba gaz = 9 murabba feet. Gaz aur marla mila kar na samjhein jab tak dono na batayen.",
    },
    {
      en: "Karachi, Hyderabad, and many builder ads. Write the number as on the map.",
      ur: "کراچی، حیدرآباد، اور بہت سے بلڈر اشتہار۔ نقشے والا نمبر لکھیں۔",
      roman: "Karachi, Hyderabad, aur bohat se builder ishtehar. Naqshe wala number likhein.",
    },
  ),
  T(
    "sqft",
    "size",
    { en: "Square feet", ur: "مربع فٹ", roman: "Square feet" },
    {
      en: "Common for flats and shops. Still not a substitute for plot or file number.",
      ur: "فلیٹ اور دکان کے لیے عام۔ پلاٹ یا فائل نمبر کی جگہ نہیں۔",
      roman: "Flat aur dukaan ke liye aam. Plot ya file number ki jagah nahi.",
    },
    {
      en: "Covered area and plot area can be different. Ask which number they mean.",
      ur: "ڈھکی ہوئی جگہ اور پلاٹ کی جگہ الگ ہو سکتی ہے۔ پوچھیں کون سا نمبر ہے۔",
      roman: "Dhaki hui jagah aur plot ki jagah alag ho sakti hai. Poochen kaun sa number hai.",
    },
    {
      en: "Apartments, shops, and some maps. Write both covered and plot size if they differ.",
      ur: "فلیٹ، دکانیں، کچھ نقشے۔ اگر دونوں الگ ہوں تو دونوں لکھیں۔",
      roman: "Flat, dukanein, kuch naqshe. Agar dono alag hon to dono likhein.",
    },
  ),
  T(
    "acre",
    "size",
    { en: "Acre", ur: "ایکڑ", roman: "Acre" },
    {
      en: "Farm and village land size. Still match the khasra on the field.",
      ur: "کھیت اور گاؤں کی زمین کا ناپ۔ پھر بھی خسرہ کھیت پر ملائیں۔",
      roman: "Khet aur gaon ki zameen ka naap. Phir bhi khasra khet par milayen.",
    },
    {
      en: "In many areas 1 acre is about 8 kanal. This is a rule of thumb, not a court measurement.",
      ur: "بہت سی جگہ ۱ ایکڑ تقریباً ۸ کنال۔ یہ اندازہ ہے، عدالتی ناپ نہیں۔",
      roman: "Bohat si jagah 1 acre taqreeban 8 kanal. Yeh andaza hai, adalati naap nahi.",
    },
    {
      en: "Agricultural deals. Walk the land. Do not buy acreage only from a WhatsApp pin.",
      ur: "زرعی ڈیل۔ زمین پر چلیں۔ صرف واٹس ایپ پن سے ایکڑ نہ خریدیں۔",
      roman: "Zaraee deal. Zameen par chalein. Sirf WhatsApp pin se acre na khariden.",
    },
  ),
  T(
    "pkr",
    "money",
    { en: "PKR / Rupees", ur: "روپے", roman: "PKR / Rupay" },
    {
      en: "Pakistani rupees. This check does not use dollars.",
      ur: "پاکستانی روپے۔ یہ چیک ڈالر نہیں مانگتا۔",
      roman: "Pakistani rupay. Yeh check dollar nahi mangta.",
    },
    {
      en: "Write amounts in rupees, lakh, or crore. A listing in USD is not how most local deals are spoken.",
      ur: "رقم روپے، لاکھ یا کروڑ میں لکھیں۔ ڈالر والی لسٹنگ مقامی ڈیل کی عام زبان نہیں۔",
      roman: "Raqam rupay, lakh ya crore mein likhein. Dollar wali listing muqami deal ki aam zaban nahi.",
    },
    {
      en: "Every price and token field in this app.",
      ur: "اس ایپ کی ہر قیمت اور ٹوکن۔",
      roman: "Is app ki har qeemat aur token.",
    },
  ),
  T(
    "lakh",
    "money",
    { en: "Lakh", ur: "لاکھ", roman: "Lakh" },
    {
      en: "One lakh is 1,00,000 rupees.",
      ur: "ایک لاکھ = ۱،۰۰،۰۰۰ روپے۔",
      roman: "Ek lakh = 1,00,000 rupay.",
    },
    {
      en: "People say 80 lakh, not 8 million. Token money is often spoken in lakh.",
      ur: "لوگ ۸۰ لاکھ کہتے ہیں، ۸ ملین نہیں۔ ٹوکن اکثر لاکھ میں بولا جاتا ہے۔",
      roman: "Log 80 lakh kehte hain, 8 million nahi. Token aksar lakh mein bola jata hai.",
    },
    {
      en: "When writing bayana and smaller prices.",
      ur: "بیعانہ اور چھوٹی قیمت لکھتے وقت۔",
      roman: "Bayana aur chhoti qeemat likhte waqt.",
    },
  ),
  T(
    "crore",
    "money",
    { en: "Crore", ur: "کروڑ", roman: "Crore" },
    {
      en: "One crore is 1,00,00,000 rupees (100 lakh).",
      ur: "ایک کروڑ = ۱،۰۰،۰۰،۰۰۰ روپے (۱۰۰ لاکھ)۔",
      roman: "Ek crore = 1,00,00,000 rupay (100 lakh).",
    },
    {
      en: "House and plot prices in cities are usually spoken in crore, not millions of dollars.",
      ur: "شہر کے گھر اور پلاٹ عام طور پر کروڑ میں بولے جاتے ہیں، ڈالر ملین میں نہیں۔",
      roman: "Shehar ke ghar aur plot aam taur par crore mein bole jate hain, dollar million mein nahi.",
    },
    {
      en: "Asking price. You can type 2.5 crore in this app.",
      ur: "منگی قیمت۔ اس ایپ میں ۲.۵ کروڑ لکھ سکتے ہیں۔",
      roman: "Mangi qeemat. Is app mein 2.5 crore likh sakte hain.",
    },
  ),
];

const DOC_TERM: Record<string, string> = {
  fard: "fard",
  khasra: "khasra",
  aks_shajra: "aks",
  mutation: "intiqal",
  registry: "registry",
  bayana_written: "bayana",
  warasat: "warasat",
  society_noc: "noc",
  original_file: "file",
  ownership: "ownership",
  owner_proof: "ownership",
  transfer_rules: "noc",
  rent_agreement: "bayana",
};

export function termById(id: string): GlossaryTerm | undefined {
  return glossary.find((g) => g.id === id);
}

export function termIdForDoc(docId: string): string | undefined {
  return DOC_TERM[docId];
}

export const groupOrder: { id: TermGroup; title: Localized }[] = [
  { id: "size", title: { en: "Size of land", ur: "زمین کا ناپ", roman: "Zameen ka naap" } },
  { id: "money", title: { en: "Money", ur: "پیسہ", roman: "Paisa" } },
  { id: "place", title: { en: "Place names", ur: "جگہ کے نام", roman: "Jagah ke naam" } },
  { id: "papers", title: { en: "Papers", ur: "کاغذات", roman: "Kaghazat" } },
  { id: "deal", title: { en: "The deal", ur: "ڈیل", roman: "Deal" } },
];
