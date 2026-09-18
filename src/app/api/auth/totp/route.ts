import { NextResponse } from "next/server";
import { z } from "zod";
import { assertSafeOrigin, wantsHttps } from "@/lib/server/origin";
import { readSessionCookie, sessionCookie, signSession, verifySession } from "@/lib/server/jwt";
import { loadUser, saveUser } from "@/lib/server/users";
import { newTotpSecret, otpauthUrl, verifyTotp } from "@/lib/server/totp";
import { audit, clientIp } from "@/lib/server/audit";
import { rateLimit } from "@/lib/server/rateLimit";
import { withSafeErrors } from "@/lib/errors/http";

async function getTotp(req: Request) {
  const claims = verifySession(readSessionCookie(req) || "");
  if (!claims) return NextResponse.json({ error: "auth" }, { status: 401 });
  const user = await loadUser(claims.sub);
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });
  if (user.role !== "professional" && user.role !== "staff") {
    return NextResponse.json({ error: "professional_only" }, { status: 403 });
  }
  const secret = user.totpSecret || newTotpSecret();
  if (!user.totpSecret) {
    await saveUser({ ...user, totpSecret: secret });
  }
  return NextResponse.json({
    otpauth: otpauthUrl(secret, user.email),
    hint: "Use any authenticator app. This app never talks to Google.",
  });
}

export const GET = withSafeErrors("totp_get", getTotp);

const verifySchema = z.object({ code: z.string().min(6).max(12) });

async function postTotp(req: Request) {
  if (!assertSafeOrigin(req)) return NextResponse.json({ error: "csrf" }, { status: 403 });
  const ip = clientIp(req);
  if (!rateLimit(`totp:${ip}`, 12, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const claims = verifySession(readSessionCookie(req) || "");
  if (!claims) return NextResponse.json({ error: "auth" }, { status: 401 });
  const user = await loadUser(claims.sub);
  if (!user?.totpSecret) return NextResponse.json({ error: "setup_first" }, { status: 400 });
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = verifySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  if (!verifyTotp(user.totpSecret, parsed.data.code)) {
    await audit({ ts: new Date().toISOString(), action: "totp_verify", ok: false, ip: clientIp(req), subject: user.id });
    return NextResponse.json({ error: "invalid" }, { status: 401 });
  }
  await saveUser({ ...user, totpEnabled: true });
  const token = signSession({ sub: user.id, role: user.role, amr: ["pwd", "otp"] });
  await audit({ ts: new Date().toISOString(), action: "totp_verify", ok: true, ip: clientIp(req), role: user.role, subject: user.id });
  const res = NextResponse.json({ ok: true, totpEnabled: true });
  res.headers.append("Set-Cookie", sessionCookie(token, wantsHttps(req)));
  return res;
}

export const POST = withSafeErrors("totp_post", postTotp);
