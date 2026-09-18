import { NextResponse } from "next/server";
import { z } from "zod";
import { listReviews, loadReview, newReview, saveReview } from "@/lib/billing/reviews";
import { loadPlanCatalog, subscriptionsForEmail } from "@/lib/billing/store";
import { entitlementsFor } from "@/lib/billing/entitlements";
import { readSessionCookie, verifySession } from "@/lib/server/jwt";
import { loadUser } from "@/lib/server/users";
import type { Role } from "@/lib/server/roles";
import { withSafeErrors } from "@/lib/errors/http";
import { recordAnalytics } from "@/lib/analytics/store";

async function entitlements(req: Request) {
  const plans = await loadPlanCatalog();
  const claims = verifySession(readSessionCookie(req) || "");
  if (!claims) return entitlementsFor({ role: "guest", subscriptions: [], plans });
  const user = await loadUser(claims.sub);
  if (!user || user.disabled) return entitlementsFor({ role: "guest", subscriptions: [], plans });
  const subscriptions = await subscriptionsForEmail(user.email);
  return entitlementsFor({ role: user.role as Role, subscriptions, plans });
}

const create = z.object({
  checkId: z.string().min(4).max(32),
  what: z.string().min(4).max(400),
});

async function getReviews(req: Request) {
  const ents = await entitlements(req);
  if (!ents.includes("receive_review_requests")) {
    return NextResponse.json({ error: "plan_required" }, { status: 403 });
  }
  return NextResponse.json({
    items: await listReviews(),
    officialVerification: 0,
    hint: "A consultant review is not government verification.",
  });
}

export const GET = withSafeErrors("reviews_get", getReviews);

async function postReview(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = create.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const claims = verifySession(readSessionCookie(req) || "");
  const user = claims ? await loadUser(claims.sub) : null;
  const row = newReview({
    checkId: parsed.data.checkId,
    what: parsed.data.what,
    requesterEmail: user?.email,
  });
  await saveReview(row);
  await recordAnalytics([{ name: "verification_requested", ts: new Date().toISOString() }]);
  return NextResponse.json({ ok: true, id: row.id, verified: false });
}

export const POST = withSafeErrors("reviews_post", postReview);

const patch = z.object({
  id: z.string().min(8).max(32),
  status: z.enum(["open", "accepted", "done"]),
});

async function patchReview(req: Request) {
  const ents = await entitlements(req);
  if (!ents.includes("receive_review_requests")) {
    return NextResponse.json({ error: "plan_required" }, { status: 403 });
  }
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = patch.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const row = await loadReview(parsed.data.id);
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
  row.status = parsed.data.status;
  await saveReview(row);
  return NextResponse.json({ ok: true, officialVerification: 0 });
}

export const PATCH = withSafeErrors("reviews_patch", patchReview);
