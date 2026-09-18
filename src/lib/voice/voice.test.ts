import { describe, expect, it } from "vitest";
import { parseVoice } from "./parse";
import { interpretVoice } from "./respond";

describe("voice parse", () => {
  it("starts a check from Mujhe 5 marla ghar check karna hai", () => {
    const p = parseVoice("Mujhe 5 marla ghar check karna hai.");
    expect(p.action).toBe("start_check");
    expect(p.kind).toBe("house");
    expect(p.areaSize).toBe("5");
    expect(p.areaUnit).toBe("marla");
  });

  it("answers the token-before-pay question instead of starting a chat", () => {
    const p = parseVoice("Mujhe token dene se pehle kya check karna chahiye?");
    expect(p.action).toBe("ask_token");
  });

  it("reads Urdu house size", () => {
    const p = parseVoice("مجھے ۵ مرلہ گھر چیک کرنا ہے");
    expect(p.action).toBe("start_check");
    expect(p.kind).toBe("house");
    expect(p.areaSize).toBe("5");
    expect(p.areaUnit).toBe("marla");
  });

  it("reads English before-token wording", () => {
    expect(parseVoice("What should I check before paying token?").action).toBe("ask_token");
  });
});

describe("voice reply language", () => {
  it("replies to the token question in Roman Urdu from the checklist, not an LLM", () => {
    const r = interpretVoice("Mujhe token dene se pehle kya check karna chahiye?", "roman");
    expect(r.cta).toBe("open_token");
    expect(r.href).toBe("/token");
    expect(r.body).toContain("Bechne wale ki shanakht");
    expect(r.body).toContain("Farokht ka muahida");
    expect(r.body.toLowerCase()).not.toContain("legally safe");
    expect(r.body).toContain("qanooni taur par mehfooz nahi");
    expect(r.body.toLowerCase()).not.toContain("fraud");
  });

  it("replies in English and Urdu when that language is selected", () => {
    const en = interpretVoice("What should I check before paying token?", "en");
    expect(en.body).toContain("Seller identity");
    expect(en.body).toContain("Sale agreement");
    const ur = interpretVoice("ٹوکن دینے سے پہلے کیا چیک کرنا چاہیے؟", "ur");
    expect(ur.body).toContain("بیچنے والے کی شناخت");
  });

  it("prefill line for a 5 marla house check stays in the selected language", () => {
    const roman = interpretVoice("Mujhe 5 marla ghar check karna hai.", "roman");
    expect(roman.cta).toBe("start_check");
    expect(roman.href).toContain("kind=house");
    expect(roman.href).toContain("size=5");
    expect(roman.href).toContain("unit=marla");
    expect(roman.href).toContain("from=voice");
    expect(roman.body).toMatch(/Ghar/);
    expect(roman.body).toMatch(/5 Marla/);
    const en = interpretVoice("Mujhe 5 marla ghar check karna hai.", "en");
    expect(en.body).toMatch(/House/);
    expect(en.body).toMatch(/5 Marla/);
  });

  it("does not invent an answer when the line is not a check or token question", () => {
    const r = interpretVoice("Aaj mausam kaisa hai?", "roman");
    expect(r.parsed.action).toBe("unknown");
    expect(r.href).toBeNull();
    expect(r.body).toContain("Jawab nahi gharhte");
  });

  it("seeds an overseas check when the spoken line says the buyer is abroad", () => {
    const r = interpretVoice("Mujhe bahar se 5 marla ghar check karna hai.", "roman");
    expect(r.cta).toBe("start_check");
    expect(r.parsed.abroad).toBe(true);
    expect(r.href).toContain("abroad=1");
    expect(r.href).toContain("kind=house");
  });
});
