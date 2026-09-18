import { NextResponse } from "next/server";
import { loginPayload } from "@/lib/api/authPayload";
import { rateLimit } from "@/lib/server/rateLimit";
import { assertSafeOrigin, wantsHttps } from "@/lib/server/origin";
import { audit, clientIp } from "@/lib/server/audit";
import { verifyPassword } from "@/lib/server/password";
import { applyOwnerBootstrap, findUserByEmail, normalizeEmail } from "@/lib/server/users";
import { sessionCookie, signSession } from "@/lib/server/jwt";
import { verifyTotp } from "@/lib/server/totp";
import { withSafeErrors } from "@/lib/errors/http";

async function postLogin(req: Request) {
  if (!assertSafeOrigin(req)) return NextResponse.json({ error: "csrf" }, { status: 403 });
  const ip = clientIp(req);
  if (!rateLimit(`login:${ip}`, 8, 15 * 60 * 1000)) {
    await audit({ ts: new Date().toISOString(), action: "login", ok: false, ip, detail: "rate_limited" });
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = loginPayload.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const found = await findUserByEmail(normalizeEmail(parsed.data.email));
  if (!found || !(await verifyPassword(parsed.data.password, found.password))) {
    await audit({ ts: new Date().toISOString(), action: "login", ok: false, ip, detail: "bad_credentials" });
    return NextResponse.json({ error: "invalid" }, { status: 401 });
  }
  const user = await applyOwnerBootstrap(found);
  if (user.disabled) {
    await audit({ ts: new Date().toISOString(), action: "login", ok: false, ip, detail: "disabled" });
    return NextResponse.json({ error: "invalid" }, { status: 401 });
  }
  const amr = ["pwd"];
  if (user.totpEnabled) {
    if (!user.totpSecret || !parsed.data.totp || !verifyTotp(user.totpSecret, parsed.data.totp)) {
      await audit({ ts: new Date().toISOString(), action: "login", ok: false, ip, role: user.role, detail: "totp_required" });
      return NextResponse.json({ error: "totp_required" }, { status: 401 });
    }
    amr.push("otp");
  }
  const token = signSession({ sub: user.id, role: user.role, amr });
  await audit({ ts: new Date().toISOString(), action: "login", ok: true, ip, role: user.role, subject: user.id });
  const res = NextResponse.json({ ok: true, id: user.id, role: user.role });
  res.headers.append("Set-Cookie", sessionCookie(token, wantsHttps(req)));
  return res;
}

export const POST = withSafeErrors("login", postLogin);
