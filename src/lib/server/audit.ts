import { appendFile, mkdir, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { stripCnics } from "@/lib/docai/sensitive";

export type AuditEvent = {
  ts: string;
  action: string;
  ok: boolean;
  ip?: string;
  role?: string;
  subject?: string;
  detail?: string;
};

function auditDir() {
  return process.env.AUDIT_DIR || path.join(process.cwd(), "data", "audit");
}

export async function audit(event: AuditEvent): Promise<void> {
  const row = {
    ...event,
    ts: event.ts || new Date().toISOString(),
    detail: event.detail ? stripCnics(event.detail).slice(0, 240) : undefined,
    subject: event.subject ? stripCnics(event.subject).slice(0, 80) : undefined,
  };
  try {
    const dir = auditDir();
    await mkdir(dir, { recursive: true });
    const day = row.ts.slice(0, 10);
    await appendFile(path.join(dir, `${day}.jsonl`), `${JSON.stringify(row)}\n`, "utf8");
  } catch {
    /* never fail a request because the log disk is full */
  }
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function listAudit(limit = 80): Promise<AuditEvent[]> {
  try {
    const names = (await readdir(auditDir())).filter((n) => n.endsWith(".jsonl")).sort().reverse();
    const rows: AuditEvent[] = [];
    for (const name of names.slice(0, 7)) {
      const raw = await readFile(path.join(auditDir(), name), "utf8");
      for (const line of raw.split("\n").reverse()) {
        if (!line.trim()) continue;
        try {
          rows.push(JSON.parse(line) as AuditEvent);
        } catch {
          /* skip */
        }
        if (rows.length >= limit) return rows;
      }
    }
    return rows;
  } catch {
    return [];
  }
}
