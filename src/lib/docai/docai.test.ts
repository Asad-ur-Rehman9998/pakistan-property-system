import { describe, expect, it } from "vitest";
import { emptyAnswers, type PaperRead } from "@/types/check";
import { classifyPaper } from "./classify";
import { comparePapers } from "./compare";
import { encryptBytes, decryptBytes, generatePaperKey, looksEncrypted } from "./crypto";
import { extractFields } from "./extract";
import { namesConflict, namesLikelySame } from "./names";
import { sanitizeAnswersForShare } from "./sanitize";
import { cnicLast4, findCnics, formatCnicLast4, stripCnics } from "./sensitive";
import { areasCompare, parseAreaPhrase } from "@/lib/pakistan/area";
import { evaluate } from "@/lib/engine/evaluate";
import { wizardPath } from "@/lib/engine/wizard";

const fardText = `
PUNJAB LAND RECORD
FARD JAMABANDI
Patwari: Chak 42
Mauza Chak 42 Tehsil Chichawatni District Sahiwal
Khasra no. 12/4 Khewat 88 Khatooni 12
Owner: Muhammad Aslam s/o Bashir Ahmed
Area 4 kanal
CNIC 35202-1234567-1
Date 12/03/2024
`;

const allotmentText = `
DHA Phase 6 Lahore
Allotment Letter
Plot no. 412
Allottee: Ahmed Ali Khan
Area 10 marla
`;

function read(partial: Partial<PaperRead> & { photoKey: string }): PaperRead {
  return {
    kind: "unknown",
    kindConfidence: 0.5,
    fields: [],
    ocrStatus: "done",
    encrypted: true,
    createdAt: "2026-08-27T00:00:00.000Z",
    ...partial,
  };
}

describe("document type", () => {
  it("recognises fard and allotment from typical words", () => {
    expect(classifyPaper(fardText).kind).toBe("fard");
    expect(classifyPaper(allotmentText).kind).toBe("allotment");
    expect(classifyPaper("").kind).toBe("unknown");
  });
});

describe("field extract", () => {
  it("pulls khasra, mauza, area, owner, and masks CNIC to last 4", () => {
    const fields = extractFields(fardText);
    expect(fields.find((f) => f.key === "khasraNumber")?.value).toBe("12/4");
    expect(fields.find((f) => f.key === "mouza")?.value.toLowerCase()).toContain("chak");
    expect(fields.find((f) => f.key === "areaSize")?.value.toLowerCase()).toContain("kanal");
    expect(fields.find((f) => f.key === "ownerName")?.value.toLowerCase()).toContain("aslam");
    const cnic = fields.find((f) => f.key === "cnicLast4");
    expect(cnic?.sensitive).toBe(true);
    expect(cnic?.value).toBe("5671");
    expect(cnic?.value).not.toContain("35202");
  });

  it("reads plot and society from an allotment", () => {
    const fields = extractFields(allotmentText);
    expect(fields.find((f) => f.key === "plotNumber")?.value).toBe("412");
    expect(fields.find((f) => f.key === "societyName")?.value).toMatch(/DHA/i);
  });
});

describe("CNIC privacy", () => {
  it("finds Pakistani CNIC numbers and strips them from stored text", () => {
    expect(findCnics("card 35202-1234567-1 copy")).toEqual(["3520212345671"]);
    expect(cnicLast4("3520212345671")).toBe("5671");
    expect(formatCnicLast4("5671")).toBe("CNIC ending 5671");
    expect(stripCnics("Seller CNIC 35202-1234567-1 at gate")).toContain("hidden");
    expect(stripCnics("Seller CNIC 35202-1234567-1 at gate")).not.toMatch(/35202/);
  });
});

describe("names", () => {
  it("treats overlapping Pakistani names as the same person, different family names as a clash", () => {
    expect(namesLikelySame("Muhammad Ali Khan", "M Ali Khan")).toBe(true);
    expect(namesConflict("Ahmed Ali Khan", "Usman Raza")).toBe(true);
  });
});

describe("cross-paper compare", () => {
  it("flags 10 Marla vs 8 Marla as a possible inconsistency, not fraud", () => {
    const answers = {
      ...emptyAnswers(),
      paperReads: [
        read({
          photoKey: "a",
          kind: "allotment",
          fields: [
            { key: "ownerName", value: "Muhammad Ali", sensitive: false, confirmed: null },
            { key: "plotNumber", value: "123", sensitive: false, confirmed: null },
            { key: "areaSize", value: "10 Marla", sensitive: false, confirmed: null },
          ],
        }),
        read({
          photoKey: "b",
          kind: "registry",
          fields: [
            { key: "ownerName", value: "Muhammad Ali", sensitive: false, confirmed: null },
            { key: "plotNumber", value: "123", sensitive: false, confirmed: null },
            { key: "areaSize", value: "8 Marla", sensitive: false, confirmed: null },
          ],
        }),
      ],
    };
    const hits = comparePapers(answers);
    const area = hits.find((f) => f.id.startsWith("consist_area:"));
    expect(area).toBeTruthy();
    expect(area?.title.en.toLowerCase()).toContain("possible inconsistency");
    expect(area?.why.en.toLowerCase()).toContain("differs between the documents");
    expect(area?.why.en).toContain("Document A");
    expect(area?.why.en).toContain("10 Marla");
    expect(area?.why.en).toContain("Document B");
    expect(area?.why.en).toContain("8 Marla");
    expect(area?.why.en.toLowerCase()).toContain("unable to determine");
    expect(area?.doNow.en.toLowerCase()).toContain("verify");
    expect(area?.doNow.en.toLowerCase()).toMatch(/authority|professional/);
    expect(area?.source).toBe("needs_verification");
    expect(area?.severity).toBe("watch");
    expect(JSON.stringify(area).toLowerCase()).not.toMatch(/fraud/);
    expect(hits.some((f) => f.id === "consist_ownerName")).toBe(false);
    expect(hits.some((f) => f.id === "consist_plotNumber")).toBe(false);
    const report = evaluate(answers);
    expect(report.hasOfficialVerification).toBe(false);
    expect(report.provenance.verified).toBe(0);
    expect(report.inconsistent.some((f) => f.id.startsWith("consist_area:"))).toBe(true);
    expect(report.inconsistent.find((f) => f.id.startsWith("consist_area:"))?.severity).toBe("watch");
  });

  it("does not treat 10 marla and 0.5 kanal as a mismatch", () => {
    const answers = {
      ...emptyAnswers(),
      paperReads: [
        read({
          photoKey: "a",
          kind: "allotment",
          fields: [{ key: "areaSize", value: "10 Marla", sensitive: false, confirmed: null }],
        }),
        read({
          photoKey: "b",
          kind: "fard",
          fields: [{ key: "areaSize", value: "0.5 kanal", sensitive: false, confirmed: null }],
        }),
      ],
    };
    expect(comparePapers(answers).some((f) => f.id.startsWith("consist_area:"))).toBe(false);
  });

  it("marks marla vs square feet as unable to determine, not a mismatch", () => {
    const answers = {
      ...emptyAnswers(),
      paperReads: [
        read({
          photoKey: "a",
          kind: "allotment",
          fields: [{ key: "areaSize", value: "10 Marla", sensitive: false, confirmed: null }],
        }),
        read({
          photoKey: "b",
          kind: "registry",
          fields: [{ key: "areaSize", value: "2250 sqft", sensitive: false, confirmed: null }],
        }),
      ],
    };
    const hits = comparePapers(answers);
    expect(hits.some((f) => f.id.startsWith("consist_area:"))).toBe(false);
    const units = hits.find((f) => f.id.startsWith("consist_area_units:"));
    expect(units?.kind).toBe("verify");
    expect(units?.title.en.toLowerCase()).toContain("unable to determine");
    expect(JSON.stringify(units).toLowerCase()).not.toMatch(/fraud/);
  });

  it("flags a typed area that does not match a paper", () => {
    const answers = {
      ...emptyAnswers(),
      areaSize: "10",
      areaUnit: "marla" as const,
      paperReads: [
        read({
          photoKey: "a",
          kind: "allotment",
          fields: [{ key: "areaSize", value: "8 Marla", sensitive: false, confirmed: null }],
        }),
      ],
    };
    const hit = comparePapers(answers).find((f) => f.id === "consist_typed_area");
    expect(hit?.title.en.toLowerCase()).toContain("possible inconsistency");
    expect(hit?.why.en).toContain("10 marla");
    expect(hit?.why.en).toContain("8 Marla");
  });

  it("flags owner-name mismatches as possible inconsistency requiring verification", () => {
    const answers = {
      ...emptyAnswers(),
      paperReads: [
        read({
          photoKey: "a",
          kind: "fard",
          fields: [{ key: "ownerName", value: "Ahmed Ali Khan", sensitive: false, confirmed: null }],
        }),
        read({
          photoKey: "b",
          kind: "registry",
          fields: [{ key: "ownerName", value: "Usman Raza", sensitive: false, confirmed: null }],
        }),
      ],
    };
    const hits = comparePapers(answers);
    expect(hits.some((f) => f.id === "consist_ownerName")).toBe(true);
    expect(hits.find((f) => f.id === "consist_ownerName")?.source).toBe("needs_verification");
    expect(hits.every((f) => f.source !== "verified")).toBe(true);
  });

  it("keeps every area pair when three papers disagree", () => {
    const answers = {
      ...emptyAnswers(),
      paperReads: [
        read({
          photoKey: "a",
          kind: "allotment",
          fields: [{ key: "areaSize", value: "10 Marla", sensitive: false, confirmed: null }],
        }),
        read({
          photoKey: "b",
          kind: "registry",
          fields: [{ key: "areaSize", value: "8 Marla", sensitive: false, confirmed: null }],
        }),
        read({
          photoKey: "c",
          kind: "fard",
          fields: [{ key: "areaSize", value: "12 Marla", sensitive: false, confirmed: null }],
        }),
      ],
    };
    const ids = comparePapers(answers)
      .filter((f) => f.id.startsWith("consist_area:"))
      .map((f) => f.id);
    expect(new Set(ids).size).toBe(3);
    expect(evaluate(answers).inconsistent.filter((f) => f.id.startsWith("consist_area:")).length).toBe(3);
  });
});

describe("area phrases", () => {
  it("parses Pakistani plot sizes and compares them without calling a survey", () => {
    expect(parseAreaPhrase("10 Marla")?.amount).toBe(10);
    expect(parseAreaPhrase("10 Marla")?.unit).toBe("marla");
    expect(areasCompare("10 Marla", "8 Marla")).toBe("mismatch");
    expect(areasCompare("10 Marla", "0.5 kanal")).toBe("match");
    expect(areasCompare("10 Marla", "2250 sqft")).toBe("undetermined");
  });
});

describe("share sanitise", () => {
  it("drops CNIC last-4 and CNIC numbers in notes before a link is stored", () => {
    const answers = {
      ...emptyAnswers(),
      notes: "His CNIC is 35202-1234567-1",
      paperReads: [
        read({
          photoKey: "a",
          kind: "cnic",
          imagePrint: "a1b2c3d4e5f60718",
          fields: [{ key: "cnicLast4", value: "4567", sensitive: true, confirmed: true }],
        }),
      ],
    };
    const clean = sanitizeAnswersForShare(answers);
    expect(clean.notes).not.toMatch(/35202|1234567/);
    expect(clean.paperReads[0].fields.some((f) => f.key === "cnicLast4")).toBe(false);
    expect(clean.paperReads[0].photoKey).toBe("");
    expect(clean.paperReads[0].imagePrint).toBe("a1b2c3d4e5f60718");
  });
});

describe("encryption envelope", () => {
  it("round-trips bytes with AES-GCM", async () => {
    const key = await generatePaperKey();
    const src = new TextEncoder().encode("paper-bytes");
    const env = await encryptBytes(key, src);
    expect(looksEncrypted(env)).toBe(true);
    const back = await decryptBytes(key, env);
    expect(new TextDecoder().decode(back)).toBe("paper-bytes");
  });
});

describe("wizard", () => {
  it("adds a confirm-papers step only after a photo has been read", () => {
    const none = { ...emptyAnswers(), hasDocuments: "yes" as const };
    expect(wizardPath(none)).toContain("upload");
    expect(wizardPath(none)).not.toContain("paperReview");
    const withRead = {
      ...none,
      paperReads: [read({ photoKey: "draft-papers-1", kind: "fard" })],
    };
    expect(wizardPath(withRead)).toContain("paperReview");
  });
});
