import type { Localized, SavedCheck } from "@/types/check";
import type { DealerPage } from "@/types/dealer";
import { reportSharePath } from "@/lib/share/token";

function L(en: string, ur: string, roman: string): Localized {
  return { en, ur, roman };
}

export type DealerReportStatusId = "none" | "insufficient" | "verify" | "high" | "ready";

export interface DealerReportStatus {
  id: DealerReportStatusId;
  label: Localized;
  hint: Localized;
}

/** Status of the information page. Never "verified listing". */
export function dealerReportStatus(page: DealerPage, check: SavedCheck | null): DealerReportStatus {
  if (!page.checkId || !check) {
    return {
      id: "none",
      label: L("No report yet", "ابھی رپورٹ نہیں", "Abhi report nahi"),
      hint: L(
        "Run the due-diligence check to build this information page. It will not be officially verified.",
        "یہ معلوماتی صفحہ بنانے کے لیے چیک چلائیں۔ سرکاری تصدیق نہیں ہو گی۔",
        "Yeh maloomati page banane ke liye check chalayen. Sarkari tasdeeq nahi hogi.",
      ),
    };
  }
  const level = check.report.infoStatus?.level;
  if (level === "insufficient") {
    return {
      id: "insufficient",
      label: L("Insufficient information", "ناکافی معلومات", "Nakafi maloomat"),
      hint: L(
        "Too little was answered. Share only as a draft. Not officially verified.",
        "اتنی کم معلومات ہیں۔ صرف مسودہ سمجھیں۔ سرکاری تصدیق نہیں۔",
        "Itni kam maloomat hain. Sirf musawwada samjhein. Sarkari tasdeeq nahi.",
      ),
    };
  }
  if (level === "high") {
    return {
      id: "high",
      label: L("High attention — page can still be shared", "زیادہ توجہ — صفحہ پھر بھی بھیج سکتے ہیں", "Zyada tawajjoh — page phir bhi bhej sakte hain"),
      hint: L(
        "The report has high-attention flags. Sharing it is allowed. It is not a finding of fraud and not official verification.",
        "رپورٹ میں زیادہ توجہ کے اشارے۔ بھیجنا منع نہیں۔ فراڈ کا الزام نہیں، سرکاری تصدیق بھی نہیں۔",
        "Report mein zyada tawajjoh ke ishare. Bhejna mana nahi. Fraud ka ilzam nahi, sarkari tasdeeq bhi nahi.",
      ),
    };
  }
  if (level === "verify") {
    return {
      id: "verify",
      label: L("Needs verification", "تصدیق درکار", "Tasdeeq darkar"),
      hint: L(
        "Something still needs an office or a qualified professional. This page is user-provided information.",
        "ابھی دفتر یا اہل پیشہ ور چاہیے۔ یہ صفحہ آپ کی بتائی معلومات ہے۔",
        "Abhi daftar ya ehl pesha war chahiye. Yeh page aap ki batayi maloomat hai.",
      ),
    };
  }
  return {
    id: "ready",
    label: L("Ready to share as information — not verified", "معلومات کے طور پر بھیجیں — verified نہیں", "Maloomat ke taur par bhejein — verified nahi"),
    hint: L(
      "You may share this page so a buyer sees gaps and questions. PropertyCheck has not marked it legally safe.",
      "خریدار کو خلا اور سوال دکھانے کے لیے بھیج سکتے ہیں۔ پراپرٹی چیک نے اسے قانونی محفوظ نہیں کہا۔",
      "Kharidar ko khala aur sawal dikhane ke liye bhej sakte hain. PropertyCheck ne ise qanooni mehfooz nahi kaha.",
    ),
  };
}

export function dealerPageTitle(page: DealerPage): string {
  const bits = [page.area, page.city, page.plotNumber && `Plot ${page.plotNumber}`, page.khasraNumber && `Khasra ${page.khasraNumber}`].filter(
    Boolean,
  );
  return bits.join(" · ") || "Property page";
}

export function publicPagePath(page: DealerPage, shareKey?: string): string | null {
  return page.checkId ? reportSharePath(page.checkId, shareKey) : null;
}

export function whatsappShareText(page: DealerPage, origin: string, lang: "en" | "ur" | "roman", shareKey?: string): string {
  const path = publicPagePath(page, shareKey);
  const url = path ? `${origin}${path}` : origin;
  const title = dealerPageTitle(page);
  if (lang === "ur") {
    return `پراپرٹی کی معلوماتی صفحہ — verified لسٹنگ نہیں۔\n${title}\n${url}\nپراپرٹی چیک پاکستان نے اسے قانونی محفوظ نہیں کہا۔`;
  }
  if (lang === "roman") {
    return `Property ki maloomati page — verified listing nahi.\n${title}\n${url}\nPropertyCheck Pakistan ne ise qanooni mehfooz nahi kaha.`;
  }
  return `Property information page — not a verified listing.\n${title}\n${url}\nPropertyCheck Pakistan has not marked this legally safe.`;
}
