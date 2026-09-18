import { describe, expect, it } from "vitest";
import { preferredRuralLang, RURAL_COMPRESS } from "./rural";
import { isOfficialSmsHref, smsHref } from "@/lib/share/sms";
import { formatSmsFallback } from "@/lib/share/messages";

describe("rural language", () => {
  it("switches English to Roman Urdu and keeps Urdu", () => {
    expect(preferredRuralLang("en")).toBe("roman");
    expect(preferredRuralLang("roman")).toBe("roman");
    expect(preferredRuralLang("ur")).toBe("ur");
  });
});

describe("rural photo budget", () => {
  it("keeps a small long edge and byte cap", () => {
    expect(RURAL_COMPRESS.maxEdge).toBe(720);
    expect(RURAL_COMPRESS.maxBytes).toBe(80_000);
  });
});

describe("SMS compose fallback", () => {
  it("only builds an sms: URI and never a gateway", () => {
    const href = smsHref(formatSmsFallback("http://localhost:3000/r/ex-urban", "roman"));
    expect(isOfficialSmsHref(href)).toBe(true);
    expect(href.startsWith("sms:?body=")).toBe(true);
    const body = decodeURIComponent(href.slice("sms:?body=".length));
    expect(body).toContain("/r/ex-urban");
    expect(body.toLowerCase()).toContain("qanooni mehfooz nahi");
    expect(body).toContain("Sarkari tasdeeq: 0");
    expect(href).not.toMatch(/twilio|nexmo|plivo|gateway/i);
  });

  it("strips a CNIC from the SMS body", () => {
    const href = smsHref("Owner 35202-1234567-1 send fard http://localhost:3000/r/x");
    const body = decodeURIComponent(href.slice("sms:?body=".length));
    expect(body).not.toContain("35202");
  });
});
