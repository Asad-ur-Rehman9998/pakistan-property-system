import { describe, expect, it } from "vitest";
import { en, roman, ur } from "@/lib/i18n/dictionary";

describe("product differentiator", () => {
  it("competes on understandable due diligence, not more listings", () => {
    expect(en.differentiator).toBe("Make property due diligence understandable to ordinary Pakistanis.");
    expect(en.notMoreListings.toLowerCase()).toContain("more property listings");
    expect(en.notMoreListings.toLowerCase()).toMatch(/does not compete/);
    expect(roman.differentiator).toContain("Aam Pakistani");
    expect(roman.notMoreListings).toContain("zyada property listings par nahi tikta");
    expect(ur.differentiator).toContain("عام پاکستانی");
  });

  it("names the people this product is for", () => {
    expect(en.whoRural.toLowerCase()).toContain("rural");
    expect(en.whoFirstBuy.toLowerCase()).toContain("first-time");
    expect(en.whoOverseas.toLowerCase()).toContain("overseas");
    expect(en.whoSmallDealer.toLowerCase()).toContain("small dealer");
    expect(en.whoLowLiteracy.toLowerCase()).toContain("digital literacy");
    expect(en.whoWhatsApp).toContain("WhatsApp");
    expect(en.whoPapers.toLowerCase()).toContain("property documents");
    expect(roman.how28).toContain("zyada property listings par nahi tikta");
    expect(roman.how28).toContain("dehi users");
    expect(roman.how28).toContain("bahar rehne wale Pakistani");
    expect(roman.how28).toContain("chhote dealer");
  });
});
