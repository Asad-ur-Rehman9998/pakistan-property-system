import { describe, expect, it } from "vitest";
import { TERMS, termName } from "./terms";
import { en, ur, roman } from "@/lib/i18n/dictionary";

describe("terminology dictionary", () => {
  it("keeps Fard, Khasra, Intiqal, and Mauza instead of invented English legal names", () => {
    expect(termName("fard", "en")).toBe("Fard");
    expect(termName("fard", "roman")).toBe("Fard");
    expect(termName("fard", "ur")).toBe("فرد");
    expect(termName("khasra", "en")).toBe("Khasra");
    expect(termName("intiqal", "en")).toMatch(/Intiqal/);
    expect(termName("mauza", "en")).toMatch(/Mauza/);
    expect(termName("aks", "en")).toBe("Aks Shajra");
    expect(termName("crore", "en")).toBe("Crore");
    expect(termName("bayana", "en")).toMatch(/Bayana/);

    const fard = TERMS.find((t) => t.id === "fard")!;
    expect(fard.doNotCall.en.toLowerCase()).toContain("title deed");
    expect(fard.term.en.toLowerCase()).not.toContain("title deed");
    expect(fard.term.en.toLowerCase()).not.toContain("ownership certificate");

    const intiqal = TERMS.find((t) => t.id === "intiqal")!;
    expect(intiqal.doNotCall.en.toLowerCase()).toContain("title transfer");
    expect(intiqal.term.en).toMatch(/Mutation/);
  });

  it("does not use USD millions as the name for crore, or lot number for khasra", () => {
    const crore = TERMS.find((t) => t.id === "crore")!;
    expect(crore.term.en).toBe("Crore");
    expect(crore.doNotCall.en).toMatch(/million USD/i);
    const khasra = TERMS.find((t) => t.id === "khasra")!;
    expect(khasra.doNotCall.en.toLowerCase()).toContain("lot number");
  });

  it("uses the same upload sentence in English, Urdu, and Roman Urdu", () => {
    expect(en.uploadQ).toBe("Upload your property document.");
    expect(ur.uploadQ).toBe("اپنی جائیداد کی دستاویز اپ لوڈ کریں۔");
    expect(roman.uploadQ).toBe("Apni property ki dastavez upload karein.");
  });
});
