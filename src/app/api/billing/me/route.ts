import { NextResponse } from "next/server";
import { readSessionCookie, verifySession } from "@/lib/server/jwt";
import { loadUser } from "@/lib/server/users";
import { loadPlanCatalog, subscriptionsForEmail } from "@/lib/billing/store";
import { entitlementsFor, livePlanIds } from "@/lib/billing/entitlements";
import type { Role } from "@/lib/server/roles";
import { withSafeErrors } from "@/lib/errors/http";

async function getMe(req: Request) {
  const claims = verifySession(readSessionCookie(req) || "");
  const plans = await loadPlanCatalog();
  if (!claims) {
    return NextResponse.json({
      authed: false,
      guest: true,
      role: "guest",
      planIds: ["free"],
      entitlements: entitlementsFor({ role: "guest", subscriptions: [], plans }),
    });
  }
  const user = await loadUser(claims.sub);
  if (!user || user.disabled) {
    return NextResponse.json({
      authed: false,
      guest: true,
      role: "guest",
      planIds: ["free"],
      entitlements: entitlementsFor({ role: "guest", subscriptions: [], plans }),
    });
  }
  const subscriptions = await subscriptionsForEmail(user.email);
  const role = user.role as Role;
  return NextResponse.json({
    authed: true,
    guest: false,
    role,
    planIds: role === "staff" ? ["free", "premium", "dealer", "professional"] : livePlanIds(subscriptions),
    entitlements: entitlementsFor({ role, subscriptions, plans }),
  });
}

export const GET = withSafeErrors("billing_me", getMe);
