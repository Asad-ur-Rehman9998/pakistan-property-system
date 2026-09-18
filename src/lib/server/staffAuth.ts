import { NextResponse } from "next/server";
import { assertSafeOrigin } from "./origin";
import { readSessionCookie, verifySession } from "./jwt";
import { loadUser, type UserRecord } from "./users";
import { hasGrant, type StaffScope } from "./grants";
import { rateLimit } from "./rateLimit";
import { clientIp } from "./audit";

export type StaffOk = { user: UserRecord; amr: string[] };

export async function requireStaff(
  req: Request,
  scope?: StaffScope,
  opts?: { mutate?: boolean },
): Promise<StaffOk | { error: NextResponse }> {
  if (opts?.mutate && !assertSafeOrigin(req)) {
    return { error: NextResponse.json({ error: "csrf" }, { status: 403 }) };
  }
  const ip = clientIp(req);
  if (!rateLimit(`admin:${scope || "any"}:${ip}`, 80, 60 * 60 * 1000)) {
    return { error: NextResponse.json({ error: "rate_limited" }, { status: 429 }) };
  }
  const claims = verifySession(readSessionCookie(req) || "");
  if (!claims) return { error: NextResponse.json({ error: "auth" }, { status: 401 }) };
  const user = await loadUser(claims.sub);
  if (!user || user.disabled) return { error: NextResponse.json({ error: "auth" }, { status: 401 }) };
  if (user.role !== "staff") return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  if (!user.totpEnabled || !claims.amr?.includes("otp")) {
    return { error: NextResponse.json({ error: "totp_required" }, { status: 401 }) };
  }
  if (scope && !hasGrant(user, scope)) {
    return { error: NextResponse.json({ error: "forbidden", need: scope }, { status: 403 }) };
  }
  return { user, amr: claims.amr };
}

export function isStaffOk(value: StaffOk | { error: NextResponse }): value is StaffOk {
  return "user" in value;
}
