import { describe, expect, it } from "vitest";
import { hashPassword, passwordStrongEnough, verifyPassword } from "./password";
import { totpCode, verifyTotp, newTotpSecret } from "./totp";
import { signSession, verifySession } from "./jwt";
import { assertSafeOrigin } from "./origin";
import { isCheckId, safeEqualHex, sha256Hex } from "./secret";
import { scanUploadBytes } from "@/lib/docai/scanUpload";
import { payloadLooksLikeDocumentDump, sanitizeCheckForShare } from "@/lib/docai/sanitize";
import { emptyAnswers } from "@/types/check";
import { isExpired } from "@/lib/privacy/retention";
import { professionalUnlocked } from "./roles";

describe("password hashing", () => {
  it("stores scrypt and verifies only the matching secret", async () => {
    expect(passwordStrongEnough("short")).toBe(false);
    expect(passwordStrongEnough("longenough1")).toBe(true);
    const stored = await hashPassword("longenough1");
    expect(stored.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("longenough1", stored)).toBe(true);
    expect(await verifyPassword("wrong-password", stored)).toBe(false);
  });
});

describe("TOTP", () => {
  it("accepts the current window and rejects a wrong code", () => {
    const secret = newTotpSecret();
    const now = Date.UTC(2026, 7, 28, 10, 0, 5);
    const code = totpCode(secret, now);
    expect(verifyTotp(secret, code, now)).toBe(true);
    expect(verifyTotp(secret, code, now + 30_000)).toBe(true);
    expect(verifyTotp(secret, "000000", now)).toBe(false);
  });
});

describe("session JWT", () => {
  it("signs HttpOnly-bound claims and expires", () => {
    const token = signSession({ sub: "user01abcd", role: "member", amr: ["pwd"] }, 60);
    const claims = verifySession(token);
    expect(claims?.sub).toBe("user01abcd");
    expect(claims?.role).toBe("member");
    const dead = signSession({ sub: "user01abcd", role: "member", amr: ["pwd"] }, -20);
    expect(verifySession(dead)).toBeNull();
  });
});

describe("CSRF origin", () => {
  it("allows missing Origin and matching Host", () => {
    const same = new Request("http://localhost:3000/api/checks", {
      headers: { origin: "http://localhost:3000", host: "localhost:3000" },
    });
    expect(assertSafeOrigin(same)).toBe(true);
    const missing = new Request("http://localhost:3000/api/checks");
    expect(assertSafeOrigin(missing)).toBe(true);
    const bad = new Request("http://localhost:3000/api/checks", {
      headers: { origin: "https://evil.example", host: "localhost:3000" },
    });
    expect(assertSafeOrigin(bad)).toBe(false);
  });
});

describe("signed URLs and ids", () => {
  it("compares share hashes in constant time and rejects path traversal", () => {
    const k = "aa".repeat(16);
    const hash = sha256Hex(k);
    expect(safeEqualHex(hash, sha256Hex(k))).toBe(true);
    expect(safeEqualHex(hash, sha256Hex("bb".repeat(16)))).toBe(false);
    expect(isCheckId("../etc/passwd")).toBe(false);
    expect(isCheckId("a/../../../x")).toBe(false);
    expect(isCheckId("testhttpe2e01")).toBe(true);
  });
});

describe("upload scan", () => {
  it("allows jpeg and rejects html, zip, and pdf", () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    expect(scanUploadBytes(jpeg, "fard.jpg", "image/jpeg").ok).toBe(true);
    const html = new TextEncoder().encode("<!doctype html><svg>");
    expect(scanUploadBytes(html, "x.html").ok).toBe(false);
    const zip = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]);
    expect(scanUploadBytes(zip, "x.zip").ok).toBe(false);
    const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);
    expect(scanUploadBytes(pdf, "fard.pdf").ok).toBe(false);
  });
});

describe("share sanitise never ships papers", () => {
  it("drops the raw share key and photo pointers", () => {
    const saved = {
      id: "sanitize01ab",
      answers: emptyAnswers(),
      shareKey: "raw-secret-key",
      shareTokenHash: "ab".repeat(32),
    };
    const clean = sanitizeCheckForShare(saved);
    expect(clean.shareKey).toBeUndefined();
    expect(clean.shareTokenHash).toBe("ab".repeat(32));
    expect(payloadLooksLikeDocumentDump('{"photo":"data:image/png;base64,xx"}')).toBe(true);
  });
});

describe("roles and retention", () => {
  it("unlocks professional only after TOTP and expires old local checks", () => {
    expect(professionalUnlocked("professional", ["pwd"])).toBe(false);
    expect(professionalUnlocked("professional", ["pwd", "otp"])).toBe(true);
    expect(isExpired("2020-01-01T00:00:00.000Z", 30, Date.parse("2020-03-01T00:00:00.000Z"))).toBe(true);
    expect(isExpired("2020-02-20T00:00:00.000Z", 30, Date.parse("2020-03-01T00:00:00.000Z"))).toBe(false);
    expect(isExpired("2010-01-01T00:00:00.000Z", 0)).toBe(false);
  });
});
