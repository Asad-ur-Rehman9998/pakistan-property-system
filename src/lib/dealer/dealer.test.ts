import { describe, expect, it } from "vitest";
import { emptyAnswers } from "@/types/check";
import { parseDealerImport } from "./import";
import { dealerReportStatus, dealerPageTitle, whatsappShareText } from "./status";
import { answersFromDealerPage, emptyDealerPage } from "./store";
import { makeSavedCheck } from "@/lib/engine/evaluate";

describe("dealer import", () => {
  it("reads city, society, plot, size, and asking price without inventing missing prices", () => {
    const rows = parseDealerImport(`
City, Area, Plot, Size, Price
Lahore, DHA Phase 6, 412, 10 marla, 2.5 crore
Sahiwal, Chak 42, khasra 12/4, 4 kanal
`);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      city: "Lahore",
      area: "DHA Phase 6",
      plotNumber: "412",
      areaSize: "10",
      areaUnit: "marla",
      price: "2.5 crore",
    });
    expect(rows[1].khasraNumber).toBe("12/4");
    expect(rows[1].price).toBe("");
    expect(rows[1].areaUnit).toBe("kanal");
  });

  it("returns nothing for empty paste", () => {
    expect(parseDealerImport("  \n")).toEqual([]);
  });
});

describe("dealer information page status", () => {
  it("is not a verified listing even when a report exists", () => {
    const page = emptyDealerPage({
      id: "d1",
      city: "Lahore",
      area: "DHA Phase 6",
      plotNumber: "412",
      checkId: "c1",
    });
    const check = makeSavedCheck("c1", {
      ...emptyAnswers(),
      intent: "sell",
      city: "Lahore",
      area: "DHA Phase 6",
      plotNumber: "412",
      propertyKind: "plot",
      locationMethod: "manual",
      counterparty: "owner",
      hasDocuments: "yes",
    });
    const status = dealerReportStatus(page, check);
    expect(status.id).not.toBe("none");
    const copy = `${status.label.en} ${status.hint.en}`.toLowerCase();
    expect(copy).toMatch(/not officially verified|not official verification|not marked it legally safe|not verified/);
    expect(copy).not.toMatch(/this is a verified listing/);
    expect(dealerPageTitle(page)).toContain("412");
    expect(check.report.hasOfficialVerification).toBe(false);
  });

  it("WhatsApp copy says the page is not a verified listing", () => {
    const page = emptyDealerPage({ checkId: "abc12345abcd", city: "Lahore", area: "Gulberg" });
    const text = whatsappShareText(page, "http://localhost:3000", "en");
    expect(text.toLowerCase()).toContain("not a verified listing");
    expect(text).toContain("/r/abc12345abcd");
    expect(text).toContain("has not marked this legally safe");
  });

  it("does not invent a report when there is no check", () => {
    const status = dealerReportStatus(emptyDealerPage(), null);
    expect(status.id).toBe("none");
    expect(status.label.en).toBe("No report yet");
  });
});

describe("dealer page answers", () => {
  it("copies typed fields into the check and leaves an empty price empty", () => {
    const page = emptyDealerPage({
      city: "Lahore",
      area: "DHA Phase 6",
      plotNumber: "412",
      areaSize: "10",
      areaUnit: "marla",
      price: "",
    });
    const answers = answersFromDealerPage(page);
    expect(answers.intent).toBe("sell");
    expect(answers.city).toBe("Lahore");
    expect(answers.plotNumber).toBe("412");
    expect(answers.price).toBe("");
    expect(answers.foundVia).toBe("dealer");
  });
});
