import { describe, expect, it } from "vitest";
import { USER_SAFE_EN, UNEXPECTED_JSON, isTechnicalText, publicUserMessage, summarizeError } from "./safe";
import { en } from "@/lib/i18n/dictionary";

describe("guest error copy", () => {
  it("never surfaces 500, TypeError, undefined, or null", () => {
    expect(USER_SAFE_EN).toBe("Something went wrong. Your information has been saved. Please try again.");
    expect(en.err).toBe(USER_SAFE_EN);
    const samples: unknown[] = [
      new TypeError("Cannot read properties of undefined"),
      "500 Internal Server Error",
      "undefined",
      "null",
      null,
      undefined,
      { stack: "TypeError: boom" },
    ];
    for (const sample of samples) {
      const msg = publicUserMessage(sample);
      expect(msg).toBe(USER_SAFE_EN);
      expect(msg.toLowerCase()).not.toContain("typeerror");
      expect(msg.toLowerCase()).not.toContain("internal server error");
      expect(msg).not.toBe("undefined");
      expect(msg).not.toBe("null");
    }
  });

  it("treats stack-like strings as technical", () => {
    expect(isTechnicalText("TypeError: x")).toBe(true);
    expect(isTechnicalText("500 Internal Server Error")).toBe(true);
    expect(isTechnicalText("undefined")).toBe(true);
    expect(isTechnicalText("null")).toBe(true);
    expect(isTechnicalText("")).toBe(true);
    expect(isTechnicalText("forbidden")).toBe(false);
  });

  it("redacts CNIC and secrets before staff logs", () => {
    const s = summarizeError(new Error("password=hunter2 CNIC 3520212345671 boom"));
    expect(s.detail.toLowerCase()).toContain("[redacted]");
    expect(s.detail).not.toMatch(/3520212345671/);
    expect(s.detail.toLowerCase()).not.toContain("hunter2");
  });

  it("500 JSON body is a code, not a technical dump", () => {
    const raw = JSON.stringify(UNEXPECTED_JSON);
    expect(UNEXPECTED_JSON.error).toBe("something_went_wrong");
    expect(raw.toLowerCase()).not.toContain("typeerror");
    expect(raw.toLowerCase()).not.toContain("internal server error");
    expect(raw).not.toContain("undefined");
    expect(raw).not.toContain("null");
  });
});
