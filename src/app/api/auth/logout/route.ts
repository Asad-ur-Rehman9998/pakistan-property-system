import { NextResponse } from "next/server";
import { assertSafeOrigin, wantsHttps } from "@/lib/server/origin";
import { clearSessionCookie, readSessionCookie, verifySession } from "@/lib/server/jwt";
import { audit, clientIp } from "@/lib/server/audit";

export async function POST(req: Request) {
  if (!assertSafeOrigin(req)) return NextResponse.json({ error: "csrf" }, { status: 403 });
  const claims = verifySession(readSessionCookie(req) || "");
  await audit({
    ts: new Date().toISOString(),
    action: "logout",
    ok: true,
    ip: clientIp(req),
    role: claims?.role,
    subject: claims?.sub,
  });
  const res = NextResponse.json({ ok: true });
  res.headers.append("Set-Cookie", clearSessionCookie(wantsHttps(req)));
  return res;
}
