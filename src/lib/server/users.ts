import { mkdir, readFile, unlink, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { randomToken } from "./secret";
import type { Role } from "./roles";
import type { StaffGrant } from "./grants";
import { ownerBootstrapEmail } from "./grants";

export type UserRecord = {
  id: string;
  email: string;
  password: string;
  role: Role;
  totpSecret?: string;
  totpEnabled: boolean;
  createdAt: string;
  /** Staff only. Empty means no admin desks. */
  grants?: StaffGrant[];
  disabled?: boolean;
};

function usersDir() {
  return process.env.USERS_DIR || path.join(process.cwd(), "data", "users");
}

function isUserId(id: string): boolean {
  return /^[A-Za-z0-9_-]{8,48}$/.test(id);
}

function fileFor(id: string) {
  if (!isUserId(id)) throw new Error("bad_id");
  return path.join(usersDir(), `${id}.json`);
}

export async function saveUser(user: UserRecord): Promise<void> {
  await mkdir(usersDir(), { recursive: true });
  await writeFile(fileFor(user.id), JSON.stringify(user), "utf8");
}

export async function loadUser(id: string): Promise<UserRecord | null> {
  if (!isUserId(id)) return null;
  try {
    return JSON.parse(await readFile(fileFor(id), "utf8")) as UserRecord;
  } catch {
    return null;
  }
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const { readdir } = await import("node:fs/promises");
  try {
    const files = await readdir(usersDir());
    for (const name of files) {
      if (!name.endsWith(".json")) continue;
      const user = await loadUser(name.replace(/\.json$/, ""));
      if (user?.email === email) return user;
    }
  } catch {
    return null;
  }
  return null;
}

export async function deleteUser(id: string): Promise<void> {
  if (!isUserId(id)) return;
  try {
    await unlink(fileFor(id));
  } catch {
    /* already gone */
  }
}

export async function listUsers(): Promise<UserRecord[]> {
  try {
    const names = await readdir(usersDir());
    const out: UserRecord[] = [];
    for (const name of names) {
      if (!name.endsWith(".json")) continue;
      const user = await loadUser(name.replace(/\.json$/, ""));
      if (user) out.push(user);
    }
    return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

export async function applyOwnerBootstrap(user: UserRecord): Promise<UserRecord> {
  const email = ownerBootstrapEmail();
  if (!email || user.email !== email) return user;
  if (user.role === "staff" && user.grants?.includes("owner") && !user.disabled) return user;
  const next: UserRecord = {
    ...user,
    role: "staff",
    grants: ["owner"],
    disabled: false,
  };
  await saveUser(next);
  return next;
}

export function newUserId(): string {
  return randomToken(9);
}

export function normalizeEmail(raw: string): string {
  return String(raw || "").trim().toLowerCase();
}
