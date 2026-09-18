import type { AreaUnit, Intent, PropertyKind } from "@/types/check";
import { parseAreaPhrase } from "@/lib/pakistan/area";

export type VoiceAction = "start_check" | "ask_token" | "ask_how" | "unknown";

export type VoiceParse = {
  action: VoiceAction;
  raw: string;
  intent: Intent | null;
  kind: PropertyKind | null;
  areaSize: string;
  areaUnit: AreaUnit | null;
  abroad: boolean;
};

const EASTERN = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";

export function normalizeUtterance(raw: string): string {
  let s = String(raw || "");
  s = s.replace(/[۰-۹]/g, (d) => String(EASTERN.indexOf(d)));
  s = s.replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC.indexOf(d)));
  return s
    .toLowerCase()
    .replace(/[؟?!.،,;:"""''۔]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAny(text: string, needles: string[]): boolean {
  return needles.some((n) => text.includes(n));
}

function parseKind(text: string): PropertyKind | null {
  if (hasAny(text, ["industrial", "factory", "صنعتی", "صنعتي"])) return "industrial";
  if (hasAny(text, ["file", "فائل", "society file"])) return "file";
  if (hasAny(text, ["agri", "agricultural", "zameen", "khet", "کھیت", "زمین", "killa"])) return "agri";
  if (hasAny(text, ["shop", "dukaan", "commercial", "دکان", "کامرس"])) return "shop";
  if (hasAny(text, ["flat", "apartment", "فلیٹ", "اپارٹ"])) return "flat";
  if (hasAny(text, ["plot", "پلاٹ"])) return "plot";
  if (hasAny(text, ["ghar", "house", "home", "گھر"])) return "house";
  return null;
}

function parseAbroad(text: string): boolean {
  return hasAny(text, [
    "abroad",
    "overseas",
    "bahar hoon",
    "bahar se",
    "bahir",
    "dubai",
    "بیرون",
    "باہر سے",
    "bahar rehta",
    "bahar rehti",
  ]);
}

function parseIntent(text: string): Intent | null {
  if (hasAny(text, ["bayana", "token", "بیعانہ", "ٹوکن"])) return "token";
  if (hasAny(text, ["kiraya", "rent", "کرایہ", "kiray"])) return "rent";
  if (hasAny(text, ["bech", "sell", "فروخت", "sale"])) return "sell";
  if (hasAny(text, ["kharid", "buy", "purchase", "خرید"])) return "buy";
  return null;
}

function isTokenQuestion(text: string): boolean {
  const token = hasAny(text, [
    "token",
    "bayana",
    "بیعانہ",
    "ٹوکن",
    "توکن",
  ]);
  if (!token) return false;
  return hasAny(text, [
    "se pehle",
    "before",
    "chahiye",
    "kya check",
    "kya dekh",
    "what should",
    "what do i check",
    "پہلے",
    "چاہیے",
    "چاهیے",
    "کیا چیک",
  ]);
}

function isHowQuestion(text: string): boolean {
  return hasAny(text, [
    "kaise kaam",
    "how does this",
    "how it works",
    "yeh app kya",
    "کیسے کام",
    "یہ ایپ کیا",
  ]);
}

function isStartCheck(text: string): boolean {
  return hasAny(text, [
    "check karna",
    "check karni",
    "check karain",
    "check karein",
    "property check",
    "jaedad check",
    "want to check",
    "check a ",
    "چیک کرنا",
    "چیک کریں",
    "چیک کرنی",
  ]);
}

function parseSize(text: string): { areaSize: string; areaUnit: AreaUnit | null } {
  const hit = parseAreaPhrase(text);
  if (!hit) return { areaSize: "", areaUnit: null };
  const areaSize = Number.isInteger(hit.amount) ? String(hit.amount) : String(hit.amount);
  return { areaSize, areaUnit: hit.unit };
}

/** Rule parse of speech/text. Not an LLM. Never invents a legal verdict. */
export function parseVoice(raw: string): VoiceParse {
  const text = normalizeUtterance(raw);
  const empty: VoiceParse = {
    action: "unknown",
    raw: raw.trim(),
    intent: null,
    kind: null,
    areaSize: "",
    areaUnit: null,
    abroad: false,
  };
  if (!text) return empty;

  const kind = parseKind(text);
  const { areaSize, areaUnit } = parseSize(text);
  const intent = parseIntent(text);
  const abroad = parseAbroad(text);

  if (isTokenQuestion(text)) {
    return { ...empty, action: "ask_token", intent: "token" };
  }
  if (isHowQuestion(text) && !kind && !areaSize) {
    return { ...empty, action: "ask_how" };
  }
  if (isStartCheck(text) || kind || areaSize) {
    return {
      action: "start_check",
      raw: raw.trim(),
      intent,
      kind,
      areaSize,
      areaUnit,
      abroad,
    };
  }
  if (intent === "token") {
    return { ...empty, action: "ask_token", intent: "token" };
  }
  return empty;
}

export function voiceCheckHref(parsed: VoiceParse): string {
  const q = new URLSearchParams();
  q.set("from", "voice");
  if (parsed.intent) q.set("intent", parsed.intent);
  if (parsed.kind) q.set("kind", parsed.kind);
  if (parsed.areaSize) q.set("size", parsed.areaSize);
  if (parsed.areaUnit) q.set("unit", parsed.areaUnit);
  if (parsed.abroad) q.set("abroad", "1");
  return `/check?${q.toString()}`;
}
