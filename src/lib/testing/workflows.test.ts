import { describe, expect, it } from "vitest";
import { emptyAnswers } from "@/types/check";
import { evaluate, makeSavedCheck } from "@/lib/engine/evaluate";
import { extractFields } from "@/lib/docai/extract";
import { scanUploadBytes } from "@/lib/docai/scanUpload";
import { sanitizeCheckForShare } from "@/lib/docai/sanitize";
import { emptyDealerPage, answersFromDealerPage } from "@/lib/dealer/store";
import { dealerReportStatus, whatsappShareText } from "@/lib/dealer/status";
import { hashPassword, verifyPassword } from "@/lib/server/password";
import { signSession, verifySession } from "@/lib/server/jwt";
import { professionalUnlocked } from "@/lib/server/roles";
import { validateSharedCheckJson } from "@/lib/api/checkPayload";

describe("authentication integration", () => {
  it("registers a password hash and a session without unlocking professional 2FA", async () => {
    const stored = await hashPassword("longenough1");
    expect(await verifyPassword("longenough1", stored)).toBe(true);
    const token = signSession({ sub: "userflow01a", role: "professional", amr: ["pwd"] }, 60);
    expect(verifySession(token)?.role).toBe("professional");
    expect(professionalUnlocked("professional", ["pwd"])).toBe(false);
  });
});

describe("uploads integration", () => {
  it("accepts a jpeg paper photo and refuses a document dump on a shared report", () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    expect(scanUploadBytes(jpeg, "fard.jpg", "image/jpeg").ok).toBe(true);
    expect(scanUploadBytes(new TextEncoder().encode("%PDF-1.4"), "fard.pdf").ok).toBe(false);
    const saved = makeSavedCheck("uploadflow01", { ...emptyAnswers(), intent: "buy" });
    expect(validateSharedCheckJson({ ...saved, photo: "data:image/png;base64,xx" }).ok).toBe(false);
    const clean = sanitizeCheckForShare({ ...saved, shareKey: "secret-share-key" });
    expect(clean.shareKey).toBeUndefined();
    expect(JSON.stringify(clean)).not.toMatch(/data:image/);
  });
});

describe("reports integration", () => {
  it("builds a report JSON that the share API would accept, with verified still 0", () => {
    const saved = makeSavedCheck("reportflow01", {
      ...emptyAnswers(),
      intent: "token",
      propertyKind: "house",
      hasDocuments: "no",
      price: "2.5 crore",
    });
    expect(saved.report.hasOfficialVerification).toBe(false);
    expect(saved.report.provenance.verified).toBe(0);
    expect(validateSharedCheckJson(saved).ok).toBe(true);
    expect(JSON.stringify(saved.report).toLowerCase()).toMatch(/not a finding of fraud|fraud ka ilzam nahi/);
  });
});

describe("property workflow", () => {
  it("extracts paper fields, then risk, then a report — guest, no account", () => {
    const fields = extractFields("DHA Phase 6 Lahore Allotment Letter Plot no. 412 Allottee: Ahmed Ali Khan Area 10 marla");
    expect(fields.find((f) => f.key === "plotNumber")?.value).toBe("412");
    const report = evaluate({
      ...emptyAnswers(),
      intent: "buy",
      propertyKind: "plot",
      hasDocuments: "yes",
      plotNumber: "412",
      areaSize: "10",
      areaUnit: "marla",
      ownerNameOnPaper: "Ahmed Ali Khan",
    });
    expect(report.hasOfficialVerification).toBe(false);
    expect(["stop", "wait", "careful"]).toContain(report.verdict);
  });
});

describe("dealer workflow", () => {
  it("adds a page, builds a report, and shares it as information — not a verified listing", () => {
    const page = emptyDealerPage({
      city: "Lahore",
      area: "DHA Phase 6",
      plotNumber: "412",
      areaSize: "10",
      areaUnit: "marla",
      price: "2.5 crore",
    });
    const check = makeSavedCheck("dealerflow01", answersFromDealerPage(page));
    const linked = { ...page, checkId: check.id };
    const status = dealerReportStatus(linked, check);
    expect(status.id).not.toBe("none");
    const text = whatsappShareText(linked, "http://localhost:3000", "en");
    expect(text).toContain("/r/dealerflow01");
    expect(text.toLowerCase()).toContain("not a verified listing");
    expect(check.report.hasOfficialVerification).toBe(false);
  });
});
