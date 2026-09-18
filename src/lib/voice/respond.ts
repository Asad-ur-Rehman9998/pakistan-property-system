import type { Lang, Localized } from "@/types/check";
import { TOKEN_CHECKLIST } from "@/lib/engine/tokenChecklist";
import { formatArea } from "@/lib/pakistan/area";
import { parseVoice, voiceCheckHref, type VoiceParse } from "./parse";

export type VoiceReply = {
  parsed: VoiceParse;
  title: string;
  body: string;
  spoken: string;
  href: string | null;
  cta: "start_check" | "open_token" | "open_how" | null;
};

function L(en: string, ur: string, roman: string): Localized {
  return { en, ur, roman };
}

const tokenIntro = L(
  "Before token / bayana, walk this list yourself. Confirmed means you saw it — not that a government office verified it here.",
  "ٹوکن / بیعانہ سے پہلے یہ فہرست خود چلیں۔ Confirmed کا مطلب آپ نے دیکھا — یہاں سرکاری تصدیق نہیں۔",
  "Token / bayana se pehle yeh fehrist khud chalain. Confirmed ka matlab aap ne dekha — yahan sarkari tasdeeq nahi.",
);

const tokenClose = L(
  "None of this calls the deal legally safe. Open the full 12-point checklist.",
  "اس سے سودا قانونی طور پر محفوظ نہیں کہلائے گا۔ پوری ۱۲ نکاتی فہرست کھولیں۔",
  "Is se soda qanooni taur par mehfooz nahi kehlayega. Poori 12-nuqti checklist kholen.",
);

const startTitle = L("Start this property check", "یہ پراپرٹی چیک شروع کریں", "Yeh property check shuru karein");

const startBody = L(
  "We heard a property to check. Type is filled where we understood it. You still answer the remaining screens. This is not a listing and not official verification.",
  "جائیداد چیک کی بات سنی۔ جو سمجھا وہ بھر دیا۔ باقی اسکرین آپ جواب دیں۔ یہ لسٹنگ نہیں اور سرکاری تصدیق نہیں۔",
  "Jaedad check ki baat suni. Jo samjha woh bhar diya. Baqi screen aap jawab dein. Yeh listing nahi aur sarkari tasdeeq nahi.",
);

const howTitle = L("How this app helps", "یہ ایپ کیسے مدد کرتی ہے", "Yeh app kaise madad karti hai");

const howBody = L(
  "You answer simple questions. A rule engine on this phone shows what is known, missing, and still needs official verification. It is not a chatbot and it does not sell property.",
  "آپ آسان سوالوں کے جواب دیں۔ اس فون کے قواعد بتاتے ہیں کیا معلوم ہے، کیا غائب ہے، اور کسے سرکاری تصدیق درکار ہے۔ یہ چیٹ بوٹ نہیں اور پراپرٹی نہیں بیچتی۔",
  "Aap asaan sawalon ke jawab dein. Is phone ke qawaid batate hain kya maloom hai, kya ghaib hai, aur kise sarkari tasdeeq darkar hai. Yeh chatbot nahi aur property nahi bechti.",
);

const unknownTitle = L("Unable to determine", "تعین نہیں ہو سکا", "Taeen nahi ho saka");

const unknownBody = L(
  "That spoken line is not one of this app’s check or token questions. Type it another way, or use the buttons. We do not invent an answer.",
  "یہ بات اس ایپ کے چیک یا ٹوکن سوالوں میں نہیں ملی۔ دوسری طرح لکھیں، یا بٹن استعمال کریں۔ جواب نہیں گھڑتے۔",
  "Yeh baat is app ke check ya token sawalon mein nahi mili. Doosri tarah likhein, ya button istemal karein. Jawab nahi gharhte.",
);

const kindLabel: Record<string, Localized> = {
  house: L("House", "گھر", "Ghar"),
  plot: L("Plot", "پلاٹ", "Plot"),
  flat: L("Apartment", "فلیٹ", "Apartment"),
  shop: L("Commercial", "کمرشل", "Commercial"),
  agri: L("Agricultural land", "زرعی زمین", "Zaraee zameen"),
  industrial: L("Industrial", "صنعتی", "Industrial"),
  file: L("Society file", "سوسائٹی فائل", "Society file"),
};

function tokenList(lang: Lang): { display: string; spoken: string } {
  const titles = TOKEN_CHECKLIST.map((item, i) => `${i + 1}. ${item.title[lang]}`);
  const display = [tokenIntro[lang], ...titles, tokenClose[lang]].join("\n");
  const spoken = [
    tokenIntro[lang],
    ...TOKEN_CHECKLIST.slice(0, 5).map((item, i) => `${i + 1}. ${item.title[lang]}`),
    tokenClose[lang],
  ].join(" ");
  return { display, spoken };
}

function filledBits(parsed: VoiceParse, lang: Lang): string {
  const bits: string[] = [];
  if (parsed.kind) bits.push(kindLabel[parsed.kind]?.[lang] ?? parsed.kind);
  const area = formatArea(parsed.areaSize, parsed.areaUnit, lang);
  if (area) bits.push(area);
  return bits.join(" · ");
}

export function interpretVoice(raw: string, lang: Lang): VoiceReply {
  const parsed = parseVoice(raw);
  if (parsed.action === "ask_token") {
    const list = tokenList(lang);
    return {
      parsed,
      title: tokenIntro[lang],
      body: list.display,
      spoken: list.spoken,
      href: "/token",
      cta: "open_token",
    };
  }
  if (parsed.action === "ask_how") {
    return {
      parsed,
      title: howTitle[lang],
      body: howBody[lang],
      spoken: howBody[lang],
      href: "/how",
      cta: "open_how",
    };
  }
  if (parsed.action === "start_check") {
    const bits = filledBits(parsed, lang);
    const body = bits ? `${bits}. ${startBody[lang]}` : startBody[lang];
    const spoken = bits ? `${bits}. ${startBody[lang]}` : startBody[lang];
    return {
      parsed,
      title: startTitle[lang],
      body,
      spoken,
      href: voiceCheckHref(parsed),
      cta: "start_check",
    };
  }
  return {
    parsed,
    title: unknownTitle[lang],
    body: unknownBody[lang],
    spoken: unknownBody[lang],
    href: null,
    cta: null,
  };
}
