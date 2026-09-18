import type { PaperField, PaperFieldKey } from "@/types/check";
import { cnicLast4, findCnics, stripCnics } from "./sensitive";

function field(key: PaperFieldKey, value: string, sensitive = false): PaperField {
  return { key, value: value.trim(), sensitive, confirmed: null };
}

function first(text: string, re: RegExp): string | null {
  const m = re.exec(text);
  return m?.[1]?.trim() || null;
}

function take(text: string, re: RegExp, key: PaperFieldKey, sensitive = false): PaperField | null {
  const v = first(text, re);
  if (!v || v.length < 2) return null;
  return field(key, stripCnics(v).slice(0, 80), sensitive);
}

const NAME = "([A-Za-z\\u0600-\\u06FF][A-Za-z\\u0600-\\u06FF.\\s']{2,48})";

export function extractFields(ocrText: string): PaperField[] {
  const text = stripCnics(ocrText || "");
  const original = ocrText || "";
  const out: PaperField[] = [];
  const add = (f: PaperField | null) => {
    if (!f) return;
    if (out.some((x) => x.key === f.key && x.value.toLowerCase() === f.value.toLowerCase())) return;
    out.push(f);
  };

  for (const digits of findCnics(original)) {
    add(field("cnicLast4", cnicLast4(digits), true));
  }

  add(take(text, new RegExp(`(?:owner|allottee|malik|vendee|vendor|موبائع|مالک)\\s*[:.\\-]?\\s*${NAME}`, "i"), "ownerName"));
  add(take(text, new RegExp(`(?:seller|buyer|purchaser|مشتری|بیچنے)\\s*[:.\\-]?\\s*${NAME}`, "i"), "otherPartyName"));
  add(take(text, new RegExp(`(?:s\\/o|d\\/o|w\\/o|son of|daughter of|ولد)\\s*${NAME}`, "i"), "ownerName"));

  add(take(text, /(?:plot|file|unit|villa)\s*(?:no\.?|number|#)?\s*[:.]?\s*([A-Z0-9][A-Z0-9\\/\-]{0,16})/i, "plotNumber"));
  add(take(text, /(?:khasra|خسرہ)\s*(?:no\.?|number|#)?\s*[:.]?\s*([\d][\d\\/\-]{0,16})/i, "khasraNumber"));
  add(take(text, /(?:khewat|کھیوت)\s*(?:no\.?|number)?\s*[:.]?\s*([\d][\d\\/\-]{0,12})/i, "khewat"));
  add(take(text, /(?:khatooni|khatauni|کھتونی)\s*(?:no\.?|number)?\s*[:.]?\s*([\d][\d\\/\-]{0,12})/i, "khatooni"));
  add(take(text, /(?:mouza|mauza|موضع|موضحہ)\s*[:.]?\s*([A-Za-z\u0600-\u06FF0-9][A-Za-z\u0600-\u06FF0-9\s]{1,28})/i, "mouza"));
  const area = text.match(/(\d+(?:\.\d+)?)\s*(marla|kanal|acre|sq\.?\s*yd|square\s*yards?|sq\.?\s*ft|مرلہ|کنال)/i);
  if (area) add(field("areaSize", `${area[1]} ${area[2]}`.replace(/\s+/g, " ")));
  add(take(text, /(\d+\s*[xX×]\s*\d+\s*(?:ft|feet|gaz)?)/i, "dimensions"));
  add(take(text, /(?:registry|bahi|wasika|document|doc(?:ument)?)\s*(?:no\.?|number)?\s*[:.]?\s*([A-Z0-9\\-]{3,20})/i, "documentNumber"));
  add(take(text, /\b(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4})\b/, "issueDate"));
  add(take(text, /(DHA(?:\s+Phase\s+\d+)?|Bahria(?:\s+Town)?|CDA|LDA|Askari(?:\s+\d+)?|Wapda Town|Gulberg(?:\s+[A-Z0-9]+)?)/i, "societyName"));
  add(take(text, /(?:developer|builder)\s*[:.]?\s*([A-Za-z][A-Za-z\s]{2,40})/i, "developerName"));
  add(take(text, /(?:tehsil|district|zila|تحصیل|ضلع)\s*[:.]?\s*([A-Za-z\u0600-\u06FF][A-Za-z\u0600-\u06FF\s]{2,24})/i, "location"));

  return out.slice(0, 12);
}

export function fieldValue(fields: PaperField[], key: PaperFieldKey, confirmedOnly = false): string | null {
  const hits = fields.filter((f) => f.key === key && f.value && (!confirmedOnly || f.confirmed === true));
  return hits[0]?.value ?? null;
}
