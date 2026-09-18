import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomToken } from "./secret";
import { stripCnics } from "@/lib/docai/sensitive";

export type ComplaintStatus = "open" | "review" | "closed";

export type ComplaintRecord = {
  id: string;
  createdAt: string;
  checkId?: string;
  email?: string;
  body: string;
  status: ComplaintStatus;
  note?: string;
};

function dir() {
  return process.env.COMPLAINTS_DIR || path.join(process.cwd(), "data", "complaints");
}

function fileFor(id: string) {
  if (!/^[A-Za-z0-9_-]{8,32}$/.test(id)) throw new Error("bad_id");
  return path.join(dir(), `${id}.json`);
}

export async function saveComplaint(row: ComplaintRecord): Promise<void> {
  await mkdir(dir(), { recursive: true });
  await writeFile(fileFor(row.id), JSON.stringify(row), "utf8");
}

export async function loadComplaint(id: string): Promise<ComplaintRecord | null> {
  try {
    return JSON.parse(await readFile(fileFor(id), "utf8")) as ComplaintRecord;
  } catch {
    return null;
  }
}

export async function listComplaints(): Promise<ComplaintRecord[]> {
  try {
    const names = await readdir(dir());
    const out: ComplaintRecord[] = [];
    for (const name of names) {
      if (!name.endsWith(".json")) continue;
      const row = await loadComplaint(name.replace(/\.json$/, ""));
      if (row) out.push(row);
    }
    return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

export function newComplaint(partial: { body: string; checkId?: string; email?: string }): ComplaintRecord {
  return {
    id: randomToken(9),
    createdAt: new Date().toISOString(),
    checkId: partial.checkId?.slice(0, 32),
    email: partial.email ? stripCnics(partial.email).slice(0, 120) : undefined,
    body: stripCnics(partial.body).slice(0, 2000),
    status: "open",
  };
}
