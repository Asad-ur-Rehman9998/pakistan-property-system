import { describe, expect, it } from "vitest";
import { examples } from "@/lib/engine/examples";
import { makeSavedCheck } from "@/lib/engine/evaluate";
import { sha256Hex } from "@/lib/server/secret";
import { totpCode, newTotpSecret } from "@/lib/server/totp";
import { hashPassword } from "@/lib/server/password";
import { deleteUser, newUserId, saveUser } from "@/lib/server/users";

const base = process.env.E2E_URL;

describe.skipIf(!base)("live HTTP", () => {
  const origin = base as string;

  async function text(path: string) {
    const res = await fetch(`${origin}${path}`);
    expect(res.status, path).toBe(200);
    return res.text();
  }

  it("serves the product shell and key routes", { timeout: 20000 }, async () => {
    const home = await text("/");
    expect(home).toMatch(/PropertyCheck|پراپرٹی چیک/);
    expect(home.toLowerCase()).toContain("check");
    expect(home.toLowerCase()).toMatch(/account|guest|mehman/);

    for (const path of ["/check", "/token", "/dealer", "/glossary", "/offices", "/how", "/mine", "/privacy", "/admin", "/manifest.webmanifest", "/offline.html", "/sw.js"]) {
      const html = await text(path);
      expect(html.length).toBeGreaterThan(200);
    }
  });

  it("serves the sample reports", async () => {
    for (const id of ["ex-urban", "ex-rural", "ex-token", "ex-papers", "ex-dup-a", "ex-dup-b", "ex-dup-c"]) {
      const html = await text(`/r/${id}`);
      expect(html.length).toBeGreaterThan(500);
    }
    const sheet = await text("/r/ex-urban/sheet");
    expect(sheet.length).toBeGreaterThan(200);
  });

  it("health endpoint is ok", async () => {
    const res = await fetch(`${origin}/api/health`);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, service: "propertycheck-pakistan" });
  });

  it("never returns TypeError or 500 phrasing to the client error log API", async () => {
    const res = await fetch(`${origin}/api/errors`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "TypeError", detail: "Cannot read properties of undefined" }),
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok?: boolean; error?: string };
    expect(json.ok).toBe(true);
    const raw = JSON.stringify(json).toLowerCase();
    expect(raw).not.toContain("typeerror");
    expect(raw).not.toContain("internal server error");
    expect(raw).not.toContain("undefined");
    expect(raw).not.toContain("null");

    const missing = await fetch(`${origin}/this-page-does-not-exist`);
    const html = (await missing.text()).toLowerCase();
    expect(html).not.toContain("typeerror");
    expect(html).not.toContain("internal server error");
  });

  it("rejects a short report id", async () => {
    const res = await fetch(`${origin}/api/checks/abc`);
    expect(res.status).toBe(400);
  });

  it("saves a check and reads it back", async () => {
    const k = "ab".repeat(16);
    const saved = { ...makeSavedCheck("testhttpe2e01", examples.urban.answers), shareTokenHash: sha256Hex(k) };
    const post = await fetch(`${origin}/api/checks`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(saved),
    });
    expect(post.status).toBe(200);
    const body = (await post.json()) as { ok: boolean; id: string; papers?: string };
    expect(body.ok).toBe(true);
    expect(body.papers).toBe("not_stored");

    const blocked = await fetch(`${origin}/api/checks/${body.id}`);
    expect(blocked.status).toBe(401);

    const get = await fetch(`${origin}/api/checks/${body.id}?k=${k}`);
    expect(get.status).toBe(200);
    const roundtrip = (await get.json()) as {
      id: string;
      shareTokenHash?: string;
      shareKey?: string;
      report: { verdict: string; hasOfficialVerification?: boolean; provenance?: { verified: number } };
    };
    expect(roundtrip.id).toBe(body.id);
    expect(roundtrip.shareTokenHash).toBeUndefined();
    expect(roundtrip.shareKey).toBeUndefined();
    expect(roundtrip.report.verdict).toBe(saved.report.verdict);
    expect(roundtrip.report.hasOfficialVerification).toBe(false);
    expect(roundtrip.report.provenance?.verified).toBe(0);
  });

  it("rejects a document dump and a cross-site origin", async () => {
    const dump = await fetch(`${origin}/api/checks`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ photo: "data:image/png;base64,AAAA" }),
    });
    expect(dump.status).toBe(400);

    const csrf = await fetch(`${origin}/api/checks`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://evil.example" },
      body: JSON.stringify(makeSavedCheck("testhttpe2e02", examples.urban.answers)),
    });
    expect(csrf.status).toBe(403);
  });

  it("exposes a guest session by default", async () => {
    const res = await fetch(`${origin}/api/auth/session`);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ authed: false, role: "guest" });
  });

  it("rejects invalid JSON payloads", async () => {
    const res = await fetch(`${origin}/api/checks`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: "x" }),
    });
    expect(res.status).toBe(400);
  });

  it("registers a professional, verifies 2FA, and deletes the account", { timeout: 20000 }, async () => {
    const email = `pro-${Date.now()}@example.test`;
    const password = "longenough1";
    const weak = await fetch(`${origin}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password: "short", role: "professional" }),
    });
    expect(weak.status).toBe(400);

    const reg = await fetch(`${origin}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, role: "professional" }),
    });
    expect(reg.status).toBe(200);
    const created = (await reg.json()) as { totpRequired?: boolean; role?: string };
    expect(created.totpRequired).toBe(true);
    expect(created.role).toBe("professional");
    const cookie = sessionCookie(reg);
    expect(cookie).toContain("pc_session=");
    expect(cookie.toLowerCase()).toContain("httponly");

    const setup = await fetch(`${origin}/api/auth/totp`, { headers: { cookie: cookie.split(";")[0] } });
    expect(setup.status).toBe(200);
    const { otpauth } = (await setup.json()) as { otpauth: string };
    expect(otpauth.startsWith("otpauth://totp/")).toBe(true);
    const code = totpCode(secretFromOtpauth(otpauth));
    const verify = await fetch(`${origin}/api/auth/totp`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: cookie.split(";")[0] },
      body: JSON.stringify({ code }),
    });
    expect(verify.status).toBe(200);
    const authedCookie = sessionCookie(verify).split(";")[0] || cookie.split(";")[0];

    const session = await fetch(`${origin}/api/auth/session`, { headers: { cookie: authedCookie } });
    expect(await session.json()).toMatchObject({ authed: true, role: "professional", totpEnabled: true, email });

    await fetch(`${origin}/api/auth/logout`, { method: "POST", headers: { cookie: authedCookie } });
    const noOtp = await fetch(`${origin}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    expect(noOtp.status).toBe(401);
    expect((await noOtp.json()).error).toBe("totp_required");

    const login = await fetch(`${origin}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, totp: totpCode(secretFromOtpauth(otpauth)) }),
    });
    expect(login.status).toBe(200);
    const loggedIn = sessionCookie(login).split(";")[0];

    const gone = await fetch(`${origin}/api/auth/account`, { method: "DELETE", headers: { cookie: loggedIn } });
    expect(gone.status).toBe(200);
    const after = await fetch(`${origin}/api/auth/session`, { headers: { cookie: loggedIn } });
    expect(await after.json()).toMatchObject({ authed: false, role: "guest" });
  });

  it("keeps admin APIs closed to guests and scoped for staff", { timeout: 40000 }, async () => {
    for (const section of [
      "overview",
      "users",
      "dealers",
      "properties",
      "reports",
      "documents",
      "verify",
      "flags",
      "duplicates",
      "billing",
      "complaints",
      "audit",
      "analytics",
      "ai",
      "health",
    ]) {
      expect((await fetch(`${origin}/api/admin/${section}`)).status, section).toBe(401);
    }

    const filed = await fetch(`${origin}/api/complaints`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body: "Plot number on the share does not match the fard.", checkId: "ex-urban" }),
    });
    expect(filed.status).toBe(200);

    const password = "longenough1";
    const hashed = await hashPassword(password);
    const supportSecret = newTotpSecret();
    const financeSecret = newTotpSecret();
    const ownerSecret = newTotpSecret();
    const supportId = newUserId();
    const financeId = newUserId();
    const ownerId = newUserId();
    const stamp = Date.now();
    await saveUser({
      id: supportId,
      email: `sup-${stamp}@example.test`,
      password: hashed,
      role: "staff",
      totpEnabled: true,
      totpSecret: supportSecret,
      grants: ["users", "complaints", "reports"],
      createdAt: new Date().toISOString(),
    });
    await saveUser({
      id: financeId,
      email: `fin-${stamp}@example.test`,
      password: hashed,
      role: "staff",
      totpEnabled: true,
      totpSecret: financeSecret,
      grants: ["billing"],
      createdAt: new Date().toISOString(),
    });
    await saveUser({
      id: ownerId,
      email: `own-${stamp}@example.test`,
      password: hashed,
      role: "staff",
      totpEnabled: true,
      totpSecret: ownerSecret,
      grants: ["owner"],
      createdAt: new Date().toISOString(),
    });

    const cookieFor = async (email: string, secret: string) => {
      const login = await fetch(`${origin}/api/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, totp: totpCode(secret) }),
      });
      expect(login.status, email).toBe(200);
      return sessionCookie(login).split(";")[0];
    };

    try {
      const support = await cookieFor(`sup-${stamp}@example.test`, supportSecret);
      expect((await fetch(`${origin}/api/admin/overview`, { headers: { cookie: support } })).status).toBe(200);
      expect((await fetch(`${origin}/api/admin/users`, { headers: { cookie: support } })).status).toBe(200);
      expect((await fetch(`${origin}/api/admin/complaints`, { headers: { cookie: support } })).status).toBe(200);
      expect((await fetch(`${origin}/api/admin/billing`, { headers: { cookie: support } })).status).toBe(403);
      expect((await fetch(`${origin}/api/admin/health`, { headers: { cookie: support } })).status).toBe(403);
      expect((await fetch(`${origin}/api/admin/audit`, { headers: { cookie: support } })).status).toBe(403);
      expect((await fetch(`${origin}/api/admin/analytics`, { headers: { cookie: support } })).status).toBe(403);

      const finance = await cookieFor(`fin-${stamp}@example.test`, financeSecret);
      expect((await fetch(`${origin}/api/admin/billing`, { headers: { cookie: finance } })).status).toBe(200);
      expect((await fetch(`${origin}/api/admin/users`, { headers: { cookie: finance } })).status).toBe(403);
      expect((await fetch(`${origin}/api/admin/reports`, { headers: { cookie: finance } })).status).toBe(403);

      const owner = await cookieFor(`own-${stamp}@example.test`, ownerSecret);
      for (const section of ["users", "dealers", "properties", "reports", "documents", "verify", "flags", "duplicates", "billing", "complaints", "audit", "analytics", "ai", "health"]) {
        const res = await fetch(`${origin}/api/admin/${section}`, { headers: { cookie: owner } });
        expect(res.status, `owner ${section}`).toBe(200);
      }
      const ai = await (await fetch(`${origin}/api/admin/ai`, { headers: { cookie: owner } })).json();
      expect(ai).toMatchObject({ llm: false, calls: 0 });
    } finally {
      await deleteUser(supportId);
      await deleteUser(financeId);
      await deleteUser(ownerId);
    }
  });
});

function sessionCookie(res: Response): string {
  const list = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  const hit = list.find((c) => c.startsWith("pc_session="));
  if (hit) return hit;
  return res.headers.get("set-cookie") || "";
}

function secretFromOtpauth(url: string): string {
  const secret = new URL(url).searchParams.get("secret") || "";
  const pad = secret.length % 4 === 0 ? "" : "=".repeat(4 - (secret.length % 4));
  return Buffer.from(secret + pad, "base64").toString("base64url");
}
