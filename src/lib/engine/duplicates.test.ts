import { describe, expect, it } from "vitest";
import { emptyAnswers, type PaperRead } from "@/types/check";
import { examples } from "./examples";
import { assessDuplicates, candidateFromCheck, comparePair, phonesInText } from "./duplicates";
import { hammingHex } from "@/lib/docai/imagePrint";

const PRINT = "a1b2c3d4e5f60718";

function paper(print: string): PaperRead {
  return {
    photoKey: "p",
    kind: "unknown",
    kindConfidence: 0.5,
    fields: [],
    ocrStatus: "done",
    encrypted: true,
    createdAt: "2026-01-15T10:00:00.000Z",
    imagePrint: print,
  };
}

function dha412(partial: Partial<ReturnType<typeof emptyAnswers>> = {}) {
  return {
    ...emptyAnswers(),
    settlement: "urban" as const,
    propertyKind: "plot" as const,
    province: "punjab" as const,
    city: "Lahore",
    area: "DHA Phase 6",
    societyName: "DHA Phase 6",
    plotNumber: "412",
    areaSize: "10",
    areaUnit: "marla" as const,
    price: "2.5 crore",
    ...partial,
  };
}

describe("property duplicate detection", () => {
  it("flags the urban example as similar to 3 other listings, never as fraud", () => {
    const d = examples.urban.report.duplicates;
    expect(d?.matches).toHaveLength(3);
    expect(d?.matches.map((m) => m.id).sort()).toEqual(["ex-dup-a", "ex-dup-b", "ex-dup-c"]);
    expect(d?.summary.en).toBe("This property appears similar to 3 other listings.");
    expect(d?.disclaimer.en.toLowerCase()).toContain("not a finding of fraud");
    expect(JSON.stringify(d).toLowerCase()).not.toMatch(/committing fraud|dealer is fraud|this is fraud/);
    expect(d?.matches.every((m) => m.source === "system_detected")).toBe(true);
    expect(examples.urban.report.risks.some((r) => r.id === "risk_possible_duplicate")).toBe(true);
    expect(examples.urban.report.risks.find((r) => r.id === "risk_possible_duplicate")?.source).not.toBe("verified");
  });

  it("does not treat a different plot in the same society as a duplicate", () => {
    const hit = comparePair(dha412(), {
      id: "other",
      answers: dha412({ plotNumber: "880", price: "2.55 crore" }),
    });
    expect(hit).toBeNull();
  });

  it("does not match only city, size, and similar asking price", () => {
    const hit = comparePair(dha412(), {
      id: "other",
      answers: dha412({
        plotNumber: "",
        societyName: "",
        area: "Johar Town",
        price: "2.4 crore",
      }),
    });
    expect(hit).toBeNull();
  });

  it("matches rural khasra on the same village", () => {
    const hit = comparePair(examples.rural.answers, {
      id: "copy",
      answers: {
        ...examples.rural.answers,
        foundVia: "agent",
        price: "75 lakh",
        notes: "Chak 42 khasra 12/4, 4 kanal, dusra dealer.",
      },
    });
    expect(hit).toBeTruthy();
    expect(hit?.signals.find((s) => s.id === "plot")?.status).toBe("match");
  });

  it("matches photos plus location even without a plot number", () => {
    const hit = comparePair(
      dha412({ plotNumber: "", paperReads: [paper(PRINT)] }),
      {
        id: "photo-twin",
        answers: dha412({ plotNumber: "999", paperReads: [paper(PRINT)] }),
      },
    );
    expect(hit).toBeTruthy();
    expect(hit?.signals.find((s) => s.id === "images")?.status).toBe("match");
  });

  it("uses a shared phone only with plot and place, and extracts Pakistani mobiles", () => {
    expect(phonesInText("call 03001234567 or +923001234567")).toEqual(["3001234567"]);
    const hit = comparePair(dha412({ notes: "03001234567 DHA 6 plot 412" }), {
      id: "phone-twin",
      answers: dha412({ notes: "dealer WhatsApp 03001234567 plot 412" }),
    });
    expect(hit?.signals.find((s) => s.id === "contact")?.status).toBe("match");
  });

  it("leaves token and rural examples without the DHA plot-412 cluster", () => {
    expect(examples.token.report.duplicates?.matches.some((m) => m.id.startsWith("ex-dup"))).toBe(false);
    expect(examples.rural.report.duplicates?.matches).toHaveLength(0);
  });

  it("returns an empty compare set when there are no other checks", () => {
    const d = assessDuplicates(dha412(), { selfId: "solo", candidates: [] });
    expect(d.matches).toHaveLength(0);
    expect(d.comparedCount).toBe(0);
    expect(d.summary.en).toContain("Not enough other listings");
  });

  it("builds candidate labels for listing A/B/C", () => {
    const a = candidateFromCheck(examples["dup-a"]);
    expect(a.label?.en).toContain("Listing A");
    expect(a.href).toBe("/r/ex-dup-a");
  });
});

describe("image prints", () => {
  it("counts bit differences between 64-bit hex prints", () => {
    expect(hammingHex(PRINT, PRINT)).toBe(0);
    expect(hammingHex(PRINT, "ffffffffffffffff")).toBeGreaterThan(18);
    expect(hammingHex("nope", PRINT)).toBeNull();
  });
});
