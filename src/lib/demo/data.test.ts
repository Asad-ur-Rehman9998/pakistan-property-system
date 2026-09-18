import { describe, expect, it } from "vitest";
import { examples } from "@/lib/engine/examples";
import {
  DEMO_DATA_LABEL,
  DEMO_PROPERTY,
  demoNotesLookPrivate,
  demoPropertyAnswers,
  demoPropertyCardLines,
  isDemoCheckId,
} from "./data";

describe("demo data", () => {
  it("labels the featured fictional property clearly", () => {
    expect(DEMO_DATA_LABEL).toBe("DEMO DATA — NOT A REAL PROPERTY");
    expect(DEMO_PROPERTY.title).toBe("Demo Property");
    expect(DEMO_PROPERTY.area).toBe("DHA Phase 6");
    expect(DEMO_PROPERTY.size).toBe("5");
    expect(DEMO_PROPERTY.unit).toBe("marla");
    expect(DEMO_PROPERTY.priceDisplay).toBe("Rs. 2.40 Crore");
    expect(demoPropertyCardLines("en")).toEqual([
      "Demo Property",
      "DHA Phase 6",
      "5 Marla",
      "Rs. 2.40 Crore",
    ]);
  });

  it("never puts real CNICs, phones, or paper dumps in demo examples", () => {
    expect(isDemoCheckId("ex-demo")).toBe(true);
    expect(isDemoCheckId("ex-urban")).toBe(true);
    expect(isDemoCheckId("user-check-1")).toBe(false);

    const answers = demoPropertyAnswers();
    expect(answers.price).toBe("2.40 crore");
    expect(answers.areaSize).toBe("5");
    expect(answers.notes).toContain(DEMO_DATA_LABEL);
    expect(demoNotesLookPrivate(answers.notes)).toBe(false);

    for (const check of Object.values(examples)) {
      expect(isDemoCheckId(check.id)).toBe(true);
      const blob = JSON.stringify(check.answers);
      expect(demoNotesLookPrivate(blob), check.id).toBe(false);
      expect(blob).not.toMatch(/data:image\//i);
      expect(blob).not.toMatch(/\b\d{5}-\d{7}-\d\b/);
      expect(check.report.hasOfficialVerification).toBe(false);
      expect(check.report.provenance.verified).toBe(0);
    }

    expect(examples.demo.answers.area).toBe("DHA Phase 6");
    expect(examples.demo.answers.areaSize).toBe("5");
    expect(examples.demo.answers.price).toMatch(/2\.40?\s*crore/i);
  });
});
