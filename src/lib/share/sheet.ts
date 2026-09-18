import type { Lang, Localized, PropertyKind, SavedCheck } from "@/types/check";
import { isConsistencyFinding } from "@/lib/docai/consistency";
import { documentsFor } from "@/lib/engine/documents";
import { assessPriceIntel, isPriceUnavailable } from "@/lib/engine/priceIntel";
import { formatArea } from "@/lib/pakistan/area";
import { formatPkr, parsePkr } from "@/lib/pakistan/money";

function L(en: string, ur: string, roman: string): Localized {
  return { en, ur, roman };
}

const KIND: Record<PropertyKind, Localized> = {
  house: L("House", "گھر", "Ghar"),
  plot: L("Plot", "پلاٹ", "Plot"),
  flat: L("Apartment", "اپارٹمنٹ", "Apartment"),
  shop: L("Shop", "دکان", "Dukaan"),
  agri: L("Agricultural land", "زرعی زمین", "Zaraee zameen"),
  industrial: L("Industrial", "صنعتی", "Industrial"),
  file: L("Society file", "فائل", "File"),
};

const NOT_GIVEN = L("Not given", "نہیں بتایا", "Nahi bataya");

export const SHEET_IMPORTANT = L(
  "This report is not a legal certificate. Independent verification is recommended. PropertyCheck Pakistan has not marked this legally safe. Official verification through this platform: 0. Official verification required.",
  "یہ رپورٹ قانونی سرٹیفکیٹ نہیں۔ خود تصدیق کی صلاح ہے۔ پراپرٹی چیک پاکستان نے اسے قانونی محفوظ نہیں کہا۔ اس پلیٹ فارم سے سرکاری تصدیق: ۰۔ سرکاری تصدیق درکار ہے۔",
  "Yeh report qanooni certificate nahi. Khud tasdeeq ki salah hai. PropertyCheck Pakistan ne ise qanooni mehfooz nahi kaha. Is platform se sarkari tasdeeq: 0. Official verification required.",
);

export type SheetMark = "ok" | "warn" | "unknown";

export interface SheetLine {
  mark: SheetMark;
  text: Localized;
}

export interface ShareableSheetModel {
  property: Localized;
  location: Localized;
  asking: Localized;
  statusEmoji: string;
  statusLabel: Localized;
  documents: SheetLine[];
  consistency: SheetLine[];
  priceLines: Localized[];
}

function across(fn: (lang: Lang) => string): Localized {
  return L(fn("en"), fn("ur"), fn("roman"));
}

import { reportSharePath, sheetSharePath } from "@/lib/share/token";
import { LEGAL_DISCLAIMER } from "@/lib/legal/disclaimer";
import { DEMO_DATA_LABEL, isDemoCheckId } from "@/lib/demo/data";

export function shareableSheetPath(checkId: string, shareKey?: string): string {
  return sheetSharePath(checkId, shareKey);
}

export function publicReportPath(checkId: string, shareKey?: string): string {
  return reportSharePath(checkId, shareKey);
}

export function buildShareableSheet(check: SavedCheck): ShareableSheetModel {
  const a = check.answers;
  const status = check.report.infoStatus;
  const intel = check.report.priceIntel ?? assessPriceIntel(a);

  const property = across((lang) => {
    const area = formatArea(a.areaSize, a.areaUnit, lang);
    const kind = a.propertyKind ? KIND[a.propertyKind][lang] : "";
    return [area, kind].filter(Boolean).join(" ") || "—";
  });

  const location = across((lang) => {
    const label = (a.locationLabel || [a.area, a.city].filter(Boolean).join(", ")).trim();
    const plot = a.plotNumber ? (lang === "ur" ? `پلاٹ ${a.plotNumber}` : `Plot ${a.plotNumber}`) : "";
    const khasra = a.khasraNumber ? (lang === "ur" ? `خسرہ ${a.khasraNumber}` : `Khasra ${a.khasraNumber}`) : "";
    return [label, plot, khasra].filter(Boolean).join(" · ") || NOT_GIVEN[lang];
  });

  const pkr = parsePkr(a.price);
  const asking = pkr
    ? across((lang) => formatPkr(pkr, lang))
    : L(
        "Not given — a price was not invented",
        "نہیں بتائی — قیمت نہیں گھڑی",
        "Nahi batayi — qeemat nahi gharhi",
      );

  const documents: SheetLine[] = documentsFor(a)
    .slice(0, 8)
    .map((d) => {
      const state = a.documents[d.id];
      if (state === "have") {
        return {
          mark: "ok" as const,
          text: L(
            `${d.title.en} uploaded (user-provided, not a government check)`,
            `${d.title.ur} اپلوڈ (آپ نے بتایا، سرکاری چیک نہیں)`,
            `${d.title.roman} upload (aap ne bataya, sarkari check nahi)`,
          ),
        };
      }
      if (state === "missing") {
        return { mark: "warn" as const, text: L(`${d.title.en} missing`, `${d.title.ur} غائب`, `${d.title.roman} ghaib`) };
      }
      return {
        mark: "warn" as const,
        text: L(`${d.title.en} not confirmed`, `${d.title.ur} تصدیق نہیں`, `${d.title.roman} tasdeeq nahi`),
      };
    });

  const photos = (a.paperReads ?? []).filter((p) => p.ocrStatus !== "error").length;
  if (photos) {
    documents.unshift({
      mark: "ok",
      text: L(
        `${photos} paper photo${photos === 1 ? "" : "s"} on this phone`,
        `اس فون پر ${photos} کاغذ کی تصویر`,
        `Is phone par ${photos} kaghaz ki tasveer`,
      ),
    });
  }

  const consistency = consistencyLines(check);

  const priceLines: Localized[] = [];
  if (intel.asking) {
    priceLines.push(
      across(
        (lang) =>
          `${lang === "ur" ? "منگی (لکھی ہوئی)" : lang === "roman" ? "Mangi (likhi hui)" : "Asking (typed)"}: ${formatPkr(intel.asking!.pkr, lang)}`,
      ),
    );
  }
  if (!isPriceUnavailable(intel.perMarla)) {
    priceLines.push(
      across(
        (lang) =>
          `${lang === "ur" ? "فی مرلہ منگی ÷ رقبہ" : lang === "roman" ? "Fi marla mangi ÷ raqba" : "Asking per marla (asking ÷ size)"}: ${formatPkr(intel.perMarla.pkr, lang)}`,
      ),
    );
  }
  if (!isPriceUnavailable(intel.perKanal)) {
    priceLines.push(
      across(
        (lang) =>
          `${lang === "ur" ? "فی کنال منگی ÷ رقبہ" : lang === "roman" ? "Fi kanal mangi ÷ raqba" : "Asking per kanal (asking ÷ size)"}: ${formatPkr(intel.perKanal.pkr, lang)}`,
      ),
    );
  }
  priceLines.push(
    L(
      "Sale / market range: insufficient reliable data. Not invented.",
      "فروخت / مارکیٹ حد: کافی مستند ڈیٹا نہیں۔ گھڑی نہیں۔",
      "Farokht / market had: kafi mustanad data nahi. Gharhi nahi.",
    ),
  );

  return {
    property,
    location,
    asking,
    statusEmoji: status?.emoji || "⚪",
    statusLabel: status?.label ?? L("Insufficient information", "ناکافی معلومات", "Nakafi maloomat"),
    documents,
    consistency,
    priceLines,
  };
}

function consistencyLines(check: SavedCheck): SheetLine[] {
  const a = check.answers;
  const hits = [...check.report.inconsistent, ...check.report.verify].filter(isConsistencyFinding);
  const lines: SheetLine[] = [];
  const seen = new Set<string>();

  const push = (key: string, line: SheetLine) => {
    if (seen.has(key)) return;
    seen.add(key);
    lines.push(line);
  };

  if (hits.some((f) => f.id.includes("area"))) {
    push("area", {
      mark: "warn",
      text: L(
        "Area requires clarification. Possible inconsistency — not a finding of fraud.",
        "رقبہ وضاحت چاہتا ہے۔ ممکنہ تضاد — فراڈ کا الزام نہیں۔",
        "Raqba wazahat chahta hai. Mumkina tazad — fraud ka ilzam nahi.",
      ),
    });
  }
  if (hits.some((f) => /owner|name/i.test(f.id))) {
    push("owner", {
      mark: "warn",
      text: L(
        "Owner name requires clarification. Possible inconsistency — not a finding of fraud.",
        "مالک کا نام وضاحت چاہتا ہے۔ ممکنہ تضاد — فراڈ کا الزام نہیں۔",
        "Malik ka naam wazahat chahta hai. Mumkina tazad — fraud ka ilzam nahi.",
      ),
    });
  }
  if (hits.some((f) => /plot|khasra/i.test(f.id))) {
    push("plot", {
      mark: "warn",
      text: L(
        "Plot / khasra requires clarification. Possible inconsistency — not a finding of fraud.",
        "پلاٹ / خسرہ وضاحت چاہتا ہے۔ ممکنہ تضاد — فراڈ کا الزام نہیں۔",
        "Plot / khasra wazahat chahta hai. Mumkina tazad — fraud ka ilzam nahi.",
      ),
    });
  }

  const name = a.flags.name_match;
  if (!seen.has("owner")) {
    if (name === "yes") {
      push("owner", {
        mark: "ok",
        text: L(
          "Owner name consistent (user-provided, not official verification)",
          "مالک کا نام میل کھاتا ہے (آپ نے بتایا، سرکاری تصدیق نہیں)",
          "Malik ka naam mil khata hai (aap ne bataya, sarkari tasdeeq nahi)",
        ),
      });
    } else if (name === "no") {
      push("owner", {
        mark: "warn",
        text: L(
          "Owner name does not match papers. Requires verification. Not a finding of fraud.",
          "مالک کا نام کاغذات سے نہیں ملتا۔ تصدیق درکار۔ فراڈ کا الزام نہیں۔",
          "Malik ka naam kaghazat se nahi milta. Tasdeeq darkar. Fraud ka ilzam nahi.",
        ),
      });
    } else if (name === "unsure") {
      push("owner", {
        mark: "warn",
        text: L(
          "Owner name still needs to be matched with papers",
          "مالک کا نام ابھی کاغذات سے ملانا ہے",
          "Malik ka naam abhi kaghazat se milana hai",
        ),
      });
    }
  }

  if (!lines.length) {
    lines.push({
      mark: "unknown",
      text: L(
        "Unable to determine consistency — not enough papers compared",
        "میل معلوم نہیں — اتنے کاغذات نہیں کہ موازنہ ہو",
        "Mel maloom nahi — itne kaghazat nahi ke muwazna ho",
      ),
    });
  }
  return lines.slice(0, 6);
}

const MARK = { ok: "✓", warn: "⚠", unknown: "○" };

export function formatShareableWhatsApp(
  sheet: ShareableSheetModel,
  lang: Lang,
  url: string,
  opts?: { checkId?: string },
): string {
  const loc = (x: Localized) => x[lang];
  const docs = sheet.documents.map((d) => `${MARK[d.mark]} ${loc(d.text)}`).join("\n");
  const consist = sheet.consistency.map((d) => `${MARK[d.mark]} ${loc(d.text)}`).join("\n");
  const prices = sheet.priceLines.map((p) => loc(p)).join("\n");
  const heading =
    lang === "ur" ? "پراپرٹی چیک رپورٹ" : lang === "roman" ? "PropertyCheck report" : "PropertyCheck report";
  const labels =
    lang === "ur"
      ? ["جائیداد", "جگہ", "منگی قیمت", "معلومات کی حیثیت", "کاغذات", "معلومات کا میل", "قیمت کی معلومات", "ضروری"]
      : lang === "roman"
        ? ["Property", "Location", "Mangi qeemat", "Maloomat ki haisiyat", "Kaghazat", "Maloomat ka mel", "Qeemat ki maloomat", "Zaroori"]
        : ["Property", "Location", "Asking price", "Information status", "Documents", "Information consistency", "Price information", "IMPORTANT"];
  return [
    heading,
    ...(isDemoCheckId(opts?.checkId) ? ["", DEMO_DATA_LABEL] : []),
    "",
    `${labels[0]}:`,
    loc(sheet.property),
    "",
    `${labels[1]}:`,
    loc(sheet.location),
    "",
    `${labels[2]}:`,
    loc(sheet.asking),
    "",
    `${labels[3]}:`,
    `${sheet.statusEmoji} ${loc(sheet.statusLabel)}`,
    "",
    `${labels[4]}:`,
    docs,
    "",
    `${labels[5]}:`,
    consist,
    "",
    `${labels[6]}:`,
    prices,
    "",
    `${labels[7]}:`,
    loc(SHEET_IMPORTANT),
    "",
    loc(LEGAL_DISCLAIMER),
    "",
    url,
  ].join("\n");
}
