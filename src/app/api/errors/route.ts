import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/server/rateLimit";
import { audit, clientIp } from "@/lib/server/audit";
import { assertSafeOrigin } from "@/lib/server/origin";
import { summarizeError } from "@/lib/errors/safe";
import { withSafeErrors } from "@/lib/errors/http";
import { z } from "zod";

const schema = z.object({
  name: z.string().max(40).optional(),
  detail: z.string().max(180).optional(),
});

export async function GET() {
  return NextResponse.json({ error: "method" }, { status: 405 });
}

async function postClientError(req: Request) {
  if (!assertSafeOrigin(req)) {
    return NextResponse.json({ error: "something_went_wrong" }, { status: 403 });
  }
  const ip = clientIp(req);
  if (!rateLimit(`err:${ip}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ ok: true });
  }
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }
  const parsed = schema.safeParse(json);
  const tech = summarizeError(
    parsed.success ? new Error(`${parsed.data.name || "Error"}: ${parsed.data.detail || "unknown"}`) : json,
  );
  await audit({
    ts: new Date().toISOString(),
    action: "error:client",
    ok: false,
    ip,
    detail: `${tech.name}: ${tech.detail}`,
  });
  return NextResponse.json({ ok: true });
}

export const POST = withSafeErrors("errors_post", postClientError);
