import type { Lang, Localized, SavedCheck, TokenChecklistReport } from "@/types/check";
import type { DealerPage, DealerPerson, DealerPersonRole, DealerVisit, VisitPurpose } from "@/types/dealer";
import { TOKEN_CHECKLIST } from "@/lib/engine/tokenChecklist";
import { documentsFor } from "@/lib/engine/documents";
import { dealerPageTitle, publicPagePath } from "@/lib/dealer/status";
import { stripCnics } from "@/lib/docai/sensitive";
import { publicReportPath } from "./sheet";

function L(en: string, ur: string, roman: string): Localized {
  return { en, ur, roman };
}

const FOOTER = L(
  "Not a verified listing. PropertyCheck Pakistan has not marked this legally safe. Official verification through this platform: 0. This app never reads WhatsApp chats or groups.",
  "verified لسٹنگ نہیں۔ پراپرٹی چیک پاکستان نے اسے قانونی محفوظ نہیں کہا۔ اس پلیٹ فارم سے سرکاری تصدیق: ۰۔ یہ ایپ واٹس ایپ چیٹس یا گروپس نہیں پڑھتی۔",
  "Verified listing nahi. PropertyCheck Pakistan ne ise qanooni mehfooz nahi kaha. Is platform se sarkari tasdeeq: 0. Yeh app WhatsApp chats ya groups nahi parhti.",
);

const PURPOSE: Record<VisitPurpose, Localized> = {
  see_property: L("See the property", "جائیداد دیکھیں", "Jaedad dekhein"),
  see_papers: L("See papers", "کاغذات دیکھیں", "Kaghazat dekhein"),
  office: L("Office / registrar", "دفتر / رجسٹرار", "Daftar / registrar"),
};

const ROLE: Record<DealerPersonRole, Localized> = {
  buyer: L("Buyer", "خریدار", "Kharidar"),
  seller: L("Seller", "بیچنے والا", "Bechne wala"),
  owner: L("Owner", "مالک", "Malik"),
  other: L("Other", "دوسرا", "Doosra"),
};

const MARK: Record<string, Localized> = {
  confirmed: L("Confirmed (you saw it)", "تصدیق شدہ (آپ نے دیکھا)", "Confirmed (aap ne dekha)"),
  verify: L("Need to verify", "تصدیق درکار", "Tasdeeq darkar"),
  missing: L("Missing", "غائب", "Ghaib"),
  na: L("N/A", "لاگو نہیں", "Lagu nahi"),
  unanswered: L("Not marked", "نشان نہیں", "Nishaan nahi"),
};

function loc(x: Localized, lang: Lang): string {
  return x[lang];
}

function scrub(text: string): string {
  return stripCnics(text).trim();
}

function withFooter(lines: string[], lang: Lang): string {
  return scrub([...lines.filter(Boolean), "", loc(FOOTER, lang)].join("\n"));
}

/** Short property link — not a certificate. */
export function formatLinkWhatsApp(title: string, url: string, lang: Lang): string {
  const heading =
    lang === "ur" ? "پراپرٹی لنک" : lang === "roman" ? "Property link" : "Property link";
  return withFooter([heading, title, url], lang);
}

export function formatReportLinkWhatsApp(check: SavedCheck, origin: string, lang: Lang): string {
  const title = check.report.headline[lang];
  return formatLinkWhatsApp(title, `${origin}${publicReportPath(check.id, check.shareKey)}`, lang);
}

/** Due-diligence / token checklist. Filled marks if a report exists; otherwise the 12 points. */
export function formatChecklistWhatsApp(opts: {
  lang: Lang;
  url: string;
  sheet?: TokenChecklistReport | null;
}): string {
  const { lang, url, sheet } = opts;
  const heading =
    lang === "ur"
      ? "ٹوکن سے پہلے due-diligence فہرست"
      : lang === "roman"
        ? "Token se pehle due-diligence checklist"
        : "Due-diligence checklist before token";
  const intro =
    lang === "ur"
      ? "Confirmed کا مطلب آپ نے دیکھا — یہاں سرکاری تصدیق نہیں۔"
      : lang === "roman"
        ? "Confirmed ka matlab aap ne dekha — yahan sarkari tasdeeq nahi."
        : "Confirmed means you saw it — not official verification here.";
  const items = sheet
    ? sheet.items.map((item, i) => `${i + 1}. ${item.title[lang]} — ${loc(MARK[item.mark] ?? MARK.unanswered, lang)}`)
    : TOKEN_CHECKLIST.map((item, i) => `${i + 1}. ${item.title[lang]}`);
  return withFooter([heading, intro, ...items, url], lang);
}

/** Ask someone for papers that are still missing. Not an accusation. */
export function formatMissingDocsWhatsApp(check: SavedCheck, origin: string, lang: Lang): string {
  const heading =
    lang === "ur"
      ? "غائب کاغذات کی درخواست"
      : lang === "roman"
        ? "Ghaib kaghazat ki darkhwast"
        : "Missing-document request";
  const ask =
    lang === "ur"
      ? "براہ کرم اصل کاغذات دکھائیں — صرف واٹس ایپ تصویر کافی نہیں۔"
      : lang === "roman"
        ? "Barae karam asal kaghazat dikhayen — sirf WhatsApp tasveer kafi nahi."
        : "Please show original papers — a WhatsApp photo is not enough.";
  const names = missingDocNames(check, lang);
  const list =
    names.length > 0
      ? names.map((n, i) => `${i + 1}. ${n}`)
      : [
          lang === "ur"
            ? "فہرست خالی ہے — پھر بھی اصل کاغذات مانگیں۔"
            : lang === "roman"
              ? "Fehrist khali hai — phir bhi asal kaghazat mangein."
              : "The list is empty — still ask for original papers.",
        ];
  return withFooter([heading, check.report.headline[lang], ask, ...list, `${origin}${publicReportPath(check.id, check.shareKey)}`], lang);
}

export function missingDocNames(check: SavedCheck, lang: Lang): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (name: string) => {
    const n = name.trim();
    if (!n || seen.has(n)) return;
    seen.add(n);
    out.push(n);
  };
  for (const f of check.report.missing) push(f.title[lang]);
  for (const d of documentsFor(check.answers)) {
    if (check.answers.documents[d.id] === "missing") push(d.title[lang]);
  }
  return out;
}

/** Visit / appointment reminder. Not a CRM pipeline message. */
export function formatAppointmentWhatsApp(opts: {
  page: DealerPage;
  visit: DealerVisit;
  origin: string;
  lang: Lang;
  shareKey?: string;
}): string {
  const { page, visit, origin, lang, shareKey } = opts;
  const heading = lang === "ur" ? "تصدیق کا دورہ" : lang === "roman" ? "Tasdeeq ka daura" : "Verification visit";
  const path = publicPagePath(page, shareKey);
  const url = path ? `${origin}${path}` : "";
  return withFooter(
    [
      heading,
      dealerPageTitle(page),
      visit.when,
      loc(PURPOSE[visit.purpose], lang),
      url,
    ],
    lang,
  );
}

/** Share a person the user typed on this phone. Never scraped from WhatsApp. */
export function formatDealerContactWhatsApp(person: DealerPerson, lang: Lang): string {
  const heading = lang === "ur" ? "ڈیلر / رابطہ" : lang === "roman" ? "Dealer / rabta" : "Dealer contact";
  const typed =
    lang === "ur"
      ? "یہ نمبر اس فون پر لکھا گیا — واٹس ایپ سے نہیں کھینچا۔ NADRA تصدیق نہیں۔"
      : lang === "roman"
        ? "Yeh number is phone par likha gaya — WhatsApp se nahi kheencha. NADRA tasdeeq nahi."
        : "This number was typed on this phone — not pulled from WhatsApp. Not NADRA-verified.";
  const bits = [person.name, loc(ROLE[person.role], lang), person.phone].filter(Boolean);
  return withFooter([heading, bits.join(" · "), typed], lang);
}

/**
 * Short SMS body for cheap phones. Not a certificate.
 * The app only opens `sms:`; it never sends the message itself.
 */
export function formatSmsFallback(url: string, lang: Lang): string {
  const line =
    lang === "ur"
      ? `پراپرٹی چیک ${url} قانونی محفوظ نہیں۔ سرکاری تصدیق: 0۔`
      : lang === "roman"
        ? `PropertyCheck ${url} qanooni mehfooz nahi. Sarkari tasdeeq: 0.`
        : `PropertyCheck ${url} Not legally safe. Official verification: 0.`;
  return stripCnics(line).replace(/\s+/g, " ").trim().slice(0, 280);
}
