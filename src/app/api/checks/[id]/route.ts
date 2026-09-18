import { NextResponse } from "next/server";
import { loadSharedCheck, deleteSharedCheck } from "@/lib/server/checksStore";
import { rateLimit } from "@/lib/server/rateLimit";
import { isCheckId, safeEqualHex, sha256Hex } from "@/lib/server/secret";
import { audit, clientIp } from "@/lib/server/audit";
import { verifySession, readSessionCookie } from "@/lib/server/jwt";
import { assertSafeOrigin } from "@/lib/server/origin";
import { loadUser } from "@/lib/server/users";
import { hasGrant } from "@/lib/server/grants";
import { withSafeErrors } from "@/lib/errors/http";

function publicPayload(row: { id: string; createdAt: string; answers: unknown; report: unknown }) {
  return { id: row.id, createdAt: row.createdAt, answers: row.answers, report: row.report };
}

async function staffFromRequest(req: Request): Promise<boolean> {
  const session = verifySession(readSessionCookie(req) || "");
  if (!session) return false;
  const user = await loadUser(session.sub);
  if (!user) return false;
  if (user.role === "staff") {
    return Boolean(session.amr?.includes("otp")) && user.totpEnabled && hasGrant(user, "reports");
  }
  return false;
}

async function getCheck(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ip = clientIp(req);
  if (!rateLimit(`get:${ip}`, 60, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const { id } = await params;
  if (!isCheckId(id)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const row = await loadSharedCheck(id);
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const k = new URL(req.url).searchParams.get("k") || "";
  const staff = await staffFromRequest(req);
  const hashOk = row.shareTokenHash && k && safeEqualHex(sha256Hex(k), row.shareTokenHash);
  if (!hashOk && !staff) {
    return NextResponse.json({ error: "signed_url_required" }, { status: 401 });
  }

  return NextResponse.json(publicPayload(row), {
    headers: { "Cache-Control": "private, no-store" },
  });
}

export const GET = withSafeErrors("checks_get", getCheck);

async function deleteCheck(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!assertSafeOrigin(req)) return NextResponse.json({ error: "csrf" }, { status: 403 });
  const ip = clientIp(req);
  if (!rateLimit(`del:${ip}`, 30, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const { id } = await params;
  if (!isCheckId(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const row = await loadSharedCheck(id);
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const k = new URL(req.url).searchParams.get("k") || "";
  const staff = await staffFromRequest(req);
  const hashOk = row.shareTokenHash && k && safeEqualHex(sha256Hex(k), row.shareTokenHash);
  if (!hashOk && !staff) {
    return NextResponse.json({ error: "signed_url_required" }, { status: 401 });
  }
  await deleteSharedCheck(id);
  await audit({ ts: new Date().toISOString(), action: "share_delete", ok: true, ip, subject: id });
  return NextResponse.json({ ok: true });
}

export const DELETE = withSafeErrors("checks_delete", deleteCheck);
