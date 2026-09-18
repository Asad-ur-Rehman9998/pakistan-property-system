import { describe, expect, it } from "vitest";
import { emptyAnswers } from "@/types/check";
import { examples } from "@/lib/engine/examples";
import { makeSavedCheck } from "@/lib/engine/evaluate";
import { emptyDealerPage } from "@/lib/dealer/store";
import { isOfficialWhatsAppHref, pakistanWaDigits, whatsappHref } from "./whatsapp";
import {
  formatAppointmentWhatsApp,
  formatChecklistWhatsApp,
  formatDealerContactWhatsApp,
  formatLinkWhatsApp,
  formatMissingDocsWhatsApp,
  missingDocNames,
} from "./messages";

describe("official WhatsApp click-to-chat", () => {
  it("only builds https://wa.me links", () => {
    const href = whatsappHref("Property link\nhttp://localhost:3000/r/ex-urban");
    expect(href.startsWith("https://wa.me/?text=")).toBe(true);
    expect(isOfficialWhatsAppHref(href)).toBe(true);
    expect(href).not.toMatch(/whatsapp\.com\/send|web\.whatsapp|api\.whatsapp/);
  });

  it("uses a typed Pakistan mobile on wa.me and refuses a 13-digit CNIC", () => {
    expect(pakistanWaDigits("03001234567")).toBe("923001234567");
    expect(whatsappHref("hi", "03001234567")).toContain("https://wa.me/923001234567?text=");
    expect(pakistanWaDigits("3520212345671")).toBeNull();
    expect(whatsappHref("hi", "3520212345671")).toBe(whatsappHref("hi"));
  });

  it("strips a CNIC from the prefilled message", () => {
    const href = whatsappHref("Owner 35202-1234567-1 please send fard");
    const text = decodeURIComponent(href.split("text=")[1] || "");
    expect(text).not.toContain("35202");
    expect(text.toLowerCase()).toContain("cnic");
  });
});

describe("WhatsApp share copy", () => {
  it("property link is not a verified listing", () => {
    const text = formatLinkWhatsApp("DHA Phase 6", "http://localhost:3000/r/ex-urban", "en");
    expect(text).toContain("Property link");
    expect(text).toContain("/r/ex-urban");
    expect(text.toLowerCase()).toContain("not a verified listing");
    expect(text.toLowerCase()).toContain("never reads whatsapp chats");
    expect(text.toLowerCase()).toContain("has not marked this legally safe");
    expect(text.toLowerCase()).not.toContain("this is a verified listing");
  });

  it("checklist shares the 12 points in the selected language", () => {
    const roman = formatChecklistWhatsApp({ lang: "roman", url: "http://localhost:3000/token" });
    expect(roman).toContain("Bechne wale ki shanakht");
    expect(roman).toContain("Farokht ka muahida");
    expect(roman).toContain("/token");
    expect(roman).toContain("sarkari tasdeeq nahi");
    const ur = formatChecklistWhatsApp({ lang: "ur", url: "http://localhost:3000/token" });
    expect(ur).toContain("بیچنے والے کی شناخت");
    const filled = formatChecklistWhatsApp({
      lang: "en",
      url: "http://localhost:3000/r/ex-token#checklist",
      sheet: examples.token.report.tokenChecklist,
    });
    expect(filled).toMatch(/Seller identity/i);
    expect(filled.toLowerCase()).toContain("has not marked this legally safe");
    expect(filled.toLowerCase()).not.toContain("this is a verified listing");
  });

  it("missing-document request lists gaps and asks for originals", () => {
    const check = examples.urban;
    const names = missingDocNames(check, "en");
    expect(names.length).toBeGreaterThan(0);
    const text = formatMissingDocsWhatsApp(check, "http://localhost:3000", "roman");
    expect(text).toContain("Ghaib kaghazat ki darkhwast");
    expect(text.toLowerCase()).toContain("asal kaghazat");
    expect(text).toContain("/r/ex-urban");
    expect(text.toLowerCase()).not.toContain("fraud");
  });

  it("appointment text uses the visit date and is not a listing", () => {
    const page = emptyDealerPage({ city: "Lahore", area: "DHA Phase 6", plotNumber: "412", checkId: "abc" });
    const text = formatAppointmentWhatsApp({
      page,
      visit: { id: "v1", personId: "", when: "2026-09-01", purpose: "see_papers", done: false },
      origin: "http://localhost:3000",
      lang: "roman",
    });
    expect(text).toContain("Tasdeeq ka daura");
    expect(text).toContain("2026-09-01");
    expect(text).toContain("Kaghazat dekhein");
    expect(text).toContain("DHA Phase 6");
    expect(text).toContain("/r/abc");
    expect(text.toLowerCase()).toContain("verified listing nahi");
  });

  it("dealer contact is the number typed here, not scraped from WhatsApp", () => {
    const text = formatDealerContactWhatsApp(
      { id: "p1", name: "Ali", phone: "03001234567", role: "seller", note: "" },
      "en",
    );
    expect(text).toContain("Ali");
    expect(text).toContain("03001234567");
    expect(text.toLowerCase()).toContain("not pulled from whatsapp");
    expect(text.toLowerCase()).toContain("not nadra-verified");
  });

  it("does not invent a price in a missing-document request", () => {
    const check = makeSavedCheck("empty01", { ...emptyAnswers(), intent: "buy", propertyKind: "house" });
    const text = formatMissingDocsWhatsApp(check, "http://localhost:3000", "en");
    expect(text.toLowerCase()).toContain("original papers");
    expect(text).not.toMatch(/sold for|market average|Rs\.\s*X/i);
  });
});
