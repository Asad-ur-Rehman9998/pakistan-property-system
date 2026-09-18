import { NextResponse } from "next/server";
import { UNEXPECTED_JSON, summarizeError } from "./safe";

export { UNEXPECTED_JSON };

export function unexpectedErrorResponse() {
  return NextResponse.json(UNEXPECTED_JSON, { status: 500 });
}

export async function logServerError(action: string, err: unknown, req?: Request) {
  const tech = summarizeError(err);
  try {
    const { audit, clientIp } = await import("@/lib/server/audit");
    await audit({
      ts: new Date().toISOString(),
      action: `error:${action.slice(0, 40)}`,
      ok: false,
      ip: req ? clientIp(req) : undefined,
      detail: `${tech.name}: ${tech.detail}`,
    });
  } catch {
    /* never fail the user request because the log disk is full */
  }
}

export function withSafeErrors<T extends unknown[]>(
  action: string,
  handler: (req: Request, ...args: T) => Promise<Response>,
) {
  return async (req: Request, ...args: T): Promise<Response> => {
    try {
      return await handler(req, ...args);
    } catch (err) {
      await logServerError(action, err, req);
      return unexpectedErrorResponse();
    }
  };
}
