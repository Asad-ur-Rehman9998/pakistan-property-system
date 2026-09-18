import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomToken } from "./secret";
import { stripCnics } from "@/lib/docai/sensitive";

export type BillingKind = "subscription" | "payment";

export type BillingRecord = {
  id: string;
  createdAt: string;
  kind: BillingKind;
  email?: string;
  amount?: string;
  note: string;
  status: "open" | "recorded" | "void";
};

function dir() {
  return process.env.BILLING_DIR || path.join(process.cwd(), "data", "billing");
}

function fileFor(id: string) {
  if (!/^[A-Za-z0-9_-]{8,32}$/.test(id)) throw new Error("bad_id");
  return path.join(dir(), `${id}.json`);
}

export async function saveBilling(row: BillingRecord): Promise<void> {
  await mkdir(dir(), { recursive: true });
  await writeFile(fileFor(row.id), JSON.stringify(row), "utf8");
}

export async function loadBilling(id: string): Promise<BillingRecord | null> {
  try {
    return JSON.parse(await readFile(fileFor(id), "utf8")) as BillingRecord;
  } catch {
    return null;
  }
}

export async function listBilling(): Promise<BillingRecord[]> {
  try {
    const names = await readdir(dir());
    const out: BillingRecord[] = [];
    for (const name of names) {
      if (!name.endsWith(".json")) continue;
      const row = await loadBilling(name.replace(/\.json$/, ""));
      if (row) out.push(row);
    }
    return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

export function newBilling(partial: { kind: BillingKind; email?: string; amount?: string; note: string }): BillingRecord {
  return {
    id: randomToken(9),
    createdAt: new Date().toISOString(),
    kind: partial.kind,
    email: partial.email ? stripCnics(partial.email).slice(0, 120) : undefined,
    amount: partial.amount ? stripCnics(partial.amount).slice(0, 40) : undefined,
    note: stripCnics(partial.note).slice(0, 500),
    status: "recorded",
  };
}
