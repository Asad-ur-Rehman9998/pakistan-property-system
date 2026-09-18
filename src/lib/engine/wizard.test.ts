import { describe, expect, it } from "vitest";
import { emptyAnswers } from "@/types/check";
import { wizardPath, stepRequired, firstUnfilledIndex } from "./wizard";

describe("wizardPath", () => {
  it("asks where the property is after type, not a province form", () => {
    const a = { ...emptyAnswers(), intent: "token" as const, propertyKind: "house" as const };
    expect(wizardPath(a).slice(0, 5)).toEqual(["intent", "whereYouAre", "kind", "settle", "locateHow"]);
    expect(wizardPath(a)).not.toContain("province");
  });

  it("shows search, map, or manual location before district fields", () => {
    const a = { ...emptyAnswers(), locationMethod: "manual" as const };
    expect(wizardPath(a)).toContain("locateHow");
    expect(wizardPath(a)).toContain("district");
    expect(wizardPath(a)).toContain("tehsil");
    expect(wizardPath(a)).toContain("village");
    expect(wizardPath(a)).toContain("area");
    expect(wizardPath(a)).toContain("society");
    expect(wizardPath(a)).toContain("identity");
    expect(wizardPath(a)).not.toContain("locateSearch");
  });

  it("opens search after Search is chosen, map after Map is chosen", () => {
    expect(wizardPath({ ...emptyAnswers(), locationMethod: "search" })).toContain("locateSearch");
    expect(wizardPath({ ...emptyAnswers(), locationMethod: "map" })).toContain("locateMap");
  });

  it("asks file vs plot, and skips city/village for a society file", () => {
    const a = {
      ...emptyAnswers(),
      intent: "buy" as const,
      propertyKind: "file" as const,
      isSocietyFile: true,
      settlement: "urban" as const,
    };
    const path = wizardPath(a);
    expect(path).toContain("fileAsk");
    expect(path).not.toContain("settle");
    expect(path).not.toContain("tokenIntro");
  });

  it("skips city/village for apartment, commercial, industrial, and agricultural", () => {
    for (const kind of ["flat", "shop", "industrial", "agri"] as const) {
      const a = { ...emptyAnswers(), propertyKind: kind };
      expect(wizardPath(a)).not.toContain("settle");
    }
  });

  it("requires a location method before continue", () => {
    expect(stepRequired("locateHow", emptyAnswers())).toBe(false);
    expect(stepRequired("locateHow", { ...emptyAnswers(), locationMethod: "manual" })).toBe(true);
  });

  it("asks asking price and papers after location, and upload only if they may have papers", () => {
    const none = { ...emptyAnswers(), locationMethod: "manual" as const };
    expect(wizardPath(none)).toContain("price");
    expect(wizardPath(none)).toContain("hasDocs");
    expect(wizardPath(none)).not.toContain("upload");
    expect(wizardPath({ ...none, hasDocuments: "yes" })).toContain("upload");
    expect(wizardPath({ ...none, hasDocuments: "no" })).not.toContain("upload");
    expect(wizardPath({ ...none, hasDocuments: "yes" })).not.toContain("paperReview");
    expect(wizardPath({ ...none, hasDocuments: "yes" }).some((k) => k.startsWith("doc:"))).toBe(true);
    expect(wizardPath({ ...none, hasDocuments: "no" }).some((k) => k.startsWith("doc:"))).toBe(false);
  });

  it("requires a type before continue", () => {
    expect(stepRequired("kind", emptyAnswers())).toBe(false);
    expect(stepRequired("kind", { ...emptyAnswers(), propertyKind: "house" })).toBe(true);
  });

  it("opens the first unanswered screen after a spoken 5 marla house", () => {
    const a = {
      ...emptyAnswers(),
      propertyKind: "house" as const,
      areaSize: "5",
      areaUnit: "marla" as const,
    };
    expect(firstUnfilledIndex(a)).toBe(0);
    expect(firstUnfilledIndex({ ...a, intent: "buy" })).toBe(1);
    expect(firstUnfilledIndex({ ...a, intent: "buy", buyerLocation: "pakistan" })).toBeGreaterThan(1);
  });
});
