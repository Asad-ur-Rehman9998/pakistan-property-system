import { NextResponse } from "next/server";
import { readSessionCookie, verifySession } from "@/lib/server/jwt";
import { loadUser } from "@/lib/server/users";
import { effectiveScopes } from "@/lib/server/grants";
import { withSafeErrors } from "@/lib/errors/http";

async function getSession(req: Request) {
  const claims = verifySession(readSessionCookie(req) || "");
  if (!claims) return NextResponse.json({ role: "guest", authed: false });
  const user = await loadUser(claims.sub);
  if (!user || user.disabled) return NextResponse.json({ role: "guest", authed: false });
  return NextResponse.json({
    authed: true,
    id: claims.sub,
    role: user.role,
    amr: claims.amr,
    totpEnabled: Boolean(user.totpEnabled),
    email: user.email,
    grants: user.role === "staff" ? effectiveScopes(user) : [],
    owner: user.role === "staff" && (user.grants ?? []).includes("owner"),
  });
}

export const GET = withSafeErrors("session", getSession);
