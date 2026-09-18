import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/server/rateLimit";
import { saveSharedCheck } from "@/lib/server/checksStore";
import { assertSafeOrigin } from "@/lib/server/origin";
import { audit, clientIp } from "@/lib/server/audit";
import { withSafeErrors } from "@/lib/errors/http";
import { validateSharedCheckJson } from "@/lib/api/checkPayload";

async function postChecks(req: Request) {
  if (!assertSafeOrigin(req)) {
    return NextResponse.json({ error: "csrf" }, { status: 403 });
  }
  const ip = clientIp(req);
  if (!rateLimit(ip, 30, 60 * 60 * 1000)) {
    await audit({ ts: new Date().toISOString(), action: "share_create", ok: false, ip, detail: "rate_limited" });
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const length = Number(req.headers.get("content-length") || 0);
  if (length > 200_000) {
    return NextResponse.json({ error: "too_large" }, { status: 413 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = validateSharedCheckJson(json);
  if (!parsed.ok) {
    if (parsed.error === "papers_stay_on_phone") {
      await audit({ ts: new Date().toISOString(), action: "share_create", ok: false, ip, detail: "document_dump" });
    }
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  await saveSharedCheck({
    id: parsed.data.id,
    createdAt: parsed.data.createdAt,
    answers: parsed.data.answers,
    report: parsed.data.report,
    shareTokenHash: parsed.shareTokenHash,
  });
  await audit({ ts: new Date().toISOString(), action: "share_create", ok: true, ip, subject: parsed.data.id });
  return NextResponse.json({ ok: true, id: parsed.data.id, papers: "not_stored" });
}

export const POST = withSafeErrors("checks", postChecks);
