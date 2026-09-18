import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/server/rateLimit";
import { assertSafeOrigin } from "@/lib/server/origin";
import { clientIp } from "@/lib/server/audit";
import { withSafeErrors } from "@/lib/errors/http";
import { sanitizeEvents } from "@/lib/analytics/events";
import { recordAnalytics } from "@/lib/analytics/store";
import { payloadLooksLikeDocumentDump } from "@/lib/docai/sanitize";

const schema = z.object({
  events: z.array(z.unknown()).max(20),
});

export async function GET() {
  return NextResponse.json({ error: "method" }, { status: 405 });
}

async function postAnalytics(req: Request) {
  if (!assertSafeOrigin(req)) {
    return NextResponse.json({ error: "something_went_wrong" }, { status: 403 });
  }
  const ip = clientIp(req);
  if (!rateLimit(`analytics:${ip}`, 60, 60 * 60 * 1000)) {
    return NextResponse.json({ ok: true });
  }
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: true });
  const raw = JSON.stringify(parsed.data);
  if (payloadLooksLikeDocumentDump(raw)) return NextResponse.json({ ok: true });
  const events = sanitizeEvents(parsed.data.events);
  await recordAnalytics(events);
  return NextResponse.json({ ok: true });
}

export const POST = withSafeErrors("analytics_post", postAnalytics);
