import { NextResponse } from "next/server";
import { z } from "zod";
import { assertSafeOrigin } from "@/lib/server/origin";
import { rateLimit } from "@/lib/server/rateLimit";
import { audit, clientIp } from "@/lib/server/audit";
import { isCheckId } from "@/lib/server/secret";
import { newComplaint, saveComplaint } from "@/lib/server/complaints";
import { withSafeErrors } from "@/lib/errors/http";

const schema = z.object({
  body: z.string().min(4).max(2000),
  checkId: z.string().max(32).optional(),
  email: z.string().max(120).optional(),
});

/** Guest-accessible information complaint. Not a fraud accusation. */
async function postComplaint(req: Request) {
  if (!assertSafeOrigin(req)) return NextResponse.json({ error: "csrf" }, { status: 403 });
  const ip = clientIp(req);
  if (!rateLimit(`complaint:${ip}`, 6, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  if (parsed.data.checkId && !isCheckId(parsed.data.checkId) && !parsed.data.checkId.startsWith("ex-")) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const row = newComplaint(parsed.data);
  await saveComplaint(row);
  await audit({ ts: new Date().toISOString(), action: "complaint_create", ok: true, ip, subject: row.id });
  return NextResponse.json({ ok: true, id: row.id });
}

export const POST = withSafeErrors("complaints", postComplaint);
