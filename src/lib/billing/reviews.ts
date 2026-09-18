import { mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { randomToken } from "@/lib/server/secret";
import { stripCnics } from "@/lib/docai/sensitive";

export type ReviewStatus = "open" | "accepted" | "done";

export type ReviewRequest = {
  id: string;
  createdAt: string;
  checkId: string;
  what: string;
  status: ReviewStatus;
  requesterEmail?: string;
};

function dir() {
  return process.env.REVIEWS_DIR || path.join(process.cwd(), "data", "reviews");
}

function fileFor(id: string) {
  if (!/^[A-Za-z0-9_-]{8,32}$/.test(id)) throw new Error("bad_id");
  return path.join(dir(), `${id}.json`);
}

export async function saveReview(row: ReviewRequest): Promise<void> {
  await mkdir(dir(), { recursive: true });
  await writeFile(fileFor(row.id), JSON.stringify(row), "utf8");
}

export async function loadReview(id: string): Promise<ReviewRequest | null> {
  try {
    return JSON.parse(await readFile(fileFor(id), "utf8")) as ReviewRequest;
  } catch {
    return null;
  }
}

export async function listReviews(): Promise<ReviewRequest[]> {
  try {
    const names = await readdir(dir());
    const out: ReviewRequest[] = [];
    for (const name of names) {
      if (!name.endsWith(".json")) continue;
      const row = await loadReview(name.replace(/\.json$/, ""));
      if (row) out.push(row);
    }
    return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

export function newReview(partial: { checkId: string; what: string; requesterEmail?: string }): ReviewRequest {
  return {
    id: randomToken(9),
    createdAt: new Date().toISOString(),
    checkId: stripCnics(partial.checkId).slice(0, 32),
    what: stripCnics(partial.what).slice(0, 400),
    status: "open",
    requesterEmail: partial.requesterEmail
      ? stripCnics(partial.requesterEmail).trim().toLowerCase().slice(0, 120)
      : undefined,
  };
}
