import { describe, expect, it } from "vitest";
import { emptyAnswers } from "@/types/check";
import { applyPlace, searchPlaces } from "./location";

describe("searchPlaces", () => {
  it("finds Islamabad, Lahore DHA, and a village from local catalog", () => {
    expect(searchPlaces("islamabad").some((h) => h.city === "Islamabad")).toBe(true);
    expect(searchPlaces("dha phase 6").some((h) => h.society?.includes("DHA"))).toBe(true);
    expect(searchPlaces("chak 42").some((h) => h.kind === "village")).toBe(true);
    expect(searchPlaces("sahiwal").some((h) => h.kind === "district" || h.kind === "city")).toBe(true);
  });

  it("fills city, society, and province from a hit without calling it verified", () => {
    const hit = searchPlaces("dha phase 6")[0];
    const next = applyPlace(emptyAnswers(), hit);
    expect(next.city).toBe("Lahore");
    expect(next.province).toBe("punjab");
    expect(next.societyName).toContain("DHA");
  });
});
