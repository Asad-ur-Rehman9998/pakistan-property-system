import { NextResponse } from "next/server";
import { registerPayload } from "@/lib/api/authPayload";
import { rateLimit } from "@/lib/server/rateLimit";
import { assertSafeOrigin, wantsHttps } from "@/lib/server/origin";
import { audit, clientIp } from "@/lib/server/audit";
import { hashPassword, passwordStrongEnough } from "@/lib/server/password";
import { findUserByEmail, newUserId, normalizeEmail, saveUser, applyOwnerBootstrap } from "@/lib/server/users";
import { isRole } from "@/lib/server/roles";
import { sessionCookie, signSession } from "@/lib/server/jwt";
import { withSafeErrors } from "@/lib/errors/http";
import { recordAnalytics } from "@/lib/analytics/store";

async function postRegister(req: Request) {
  if (!assertSafeOrigin(req)) return NextResponse.json({ error: "csrf" }, { status: 403 });
  const ip = clientIp(req);
  if (!rateLimit(`reg:${ip}`, 8, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = registerPayload.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  if (!passwordStrongEnough(parsed.data.password)) {
    return NextResponse.json({ error: "weak_password" }, { status: 400 });
  }
  const email = normalizeEmail(parsed.data.email);
  if (await findUserByEmail(email)) {
    return NextResponse.json({ error: "exists" }, { status: 409 });
  }
  const role = isRole(parsed.data.role) ? parsed.data.role : "member";
  const user = {
    id: newUserId(),
    email,
    password: await hashPassword(parsed.data.password),
    role,
    totpEnabled: false,
    createdAt: new Date().toISOString(),
  };
  await saveUser(user);
  const ready = await applyOwnerBootstrap(user);
  const amr = ["pwd"];
  const token = signSession({ sub: ready.id, role: ready.role, amr });
  await audit({ ts: new Date().toISOString(), action: "register", ok: true, ip, role: ready.role, subject: ready.id });
  await recordAnalytics([{ name: "conversion", ts: new Date().toISOString(), stage: "register" }]);
  const res = NextResponse.json({
    ok: true,
    id: ready.id,
    role: ready.role,
    totpRequired: ready.role === "professional" || ready.role === "staff",
  });
  res.headers.append("Set-Cookie", sessionCookie(token, wantsHttps(req)));
  return res;
}

export const POST = withSafeErrors("register", postRegister);
