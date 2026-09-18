import { NextResponse } from "next/server";
import { assertSafeOrigin, wantsHttps } from "@/lib/server/origin";
import { clearSessionCookie, readSessionCookie, verifySession } from "@/lib/server/jwt";
import { deleteUser } from "@/lib/server/users";
import { audit, clientIp } from "@/lib/server/audit";

export async function DELETE(req: Request) {
  if (!assertSafeOrigin(req)) return NextResponse.json({ error: "csrf" }, { status: 403 });
  const claims = verifySession(readSessionCookie(req) || "");
  if (!claims) return NextResponse.json({ error: "auth" }, { status: 401 });
  await deleteUser(claims.sub);
  await audit({ ts: new Date().toISOString(), action: "delete_account", ok: true, ip: clientIp(req), role: claims.role, subject: claims.sub });
  const res = NextResponse.json({ ok: true });
  res.headers.append("Set-Cookie", clearSessionCookie(wantsHttps(req)));
  return res;
}
