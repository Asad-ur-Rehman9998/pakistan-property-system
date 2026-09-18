import { mkdir, readFile, unlink, writeFile, readdir } from "node:fs/promises";
import path from "node:path";

export type SharedCheckRecord = {
  id: string;
  createdAt: string;
  answers: unknown;
  report: unknown;
  shareTokenHash?: string;
};

function checksDir() {
  return process.env.CHECKS_DIR || path.join(process.cwd(), "data", "checks");
}

function djangoBase() {
  return (process.env.DJANGO_API_URL || "").replace(/\/$/, "");
}

async function saveFs(data: SharedCheckRecord) {
  const dir = checksDir();
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${data.id}.json`), JSON.stringify(data), "utf8");
}

async function loadFs(id: string): Promise<SharedCheckRecord | null> {
  try {
    const raw = await readFile(path.join(checksDir(), `${id}.json`), "utf8");
    return JSON.parse(raw) as SharedCheckRecord;
  } catch {
    return null;
  }
}

async function saveDjango(data: SharedCheckRecord): Promise<boolean> {
  const base = djangoBase();
  if (!base) return false;
  try {
    const res = await fetch(`${base}/v1/checks/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function loadDjango(id: string): Promise<SharedCheckRecord | null> {
  const base = djangoBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/v1/checks/${id}/`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return (await res.json()) as SharedCheckRecord;
  } catch {
    return null;
  }
}

/** Persist a sanitized share payload. Postgres/Django first when configured (normalized tables + JSON envelope), else local files. */
export async function saveSharedCheck(data: SharedCheckRecord): Promise<void> {
  const existing = await loadSharedCheck(data.id);
  const row = {
    ...data,
    shareTokenHash: data.shareTokenHash || existing?.shareTokenHash,
  };
  const ok = await saveDjango(row);
  if (!ok) await saveFs(row);
}

export async function loadSharedCheck(id: string): Promise<SharedCheckRecord | null> {
  return (await loadDjango(id)) ?? (await loadFs(id));
}

export async function deleteSharedCheck(id: string): Promise<void> {
  const base = djangoBase();
  if (base) {
    try {
      await fetch(`${base}/v1/checks/${id}/`, { method: "DELETE", signal: AbortSignal.timeout(8000) });
    } catch {
      /* fall through to local files */
    }
  }
  try {
    await unlink(path.join(checksDir(), `${id}.json`));
  } catch {
    /* already gone */
  }
}

export async function listSharedChecks(): Promise<SharedCheckRecord[]> {
  try {
    const names = await readdir(checksDir());
    const out: SharedCheckRecord[] = [];
    for (const name of names) {
      if (!name.endsWith(".json")) continue;
      const row = await loadFs(name.replace(/\.json$/, ""));
      if (row) out.push(row);
    }
    return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 200);
  } catch {
    return [];
  }
}

export function persistenceLabel(): "django" | "fs" {
  return djangoBase() ? "django" : "fs";
}
