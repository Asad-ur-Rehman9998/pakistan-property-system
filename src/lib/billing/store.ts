import { mkdir, readFile, writeFile, readdir, unlink } from "node:fs/promises";
import path from "node:path";
import { randomToken } from "@/lib/server/secret";
import { stripCnics } from "@/lib/docai/sensitive";
import type { Plan, PlanId, SubscriptionRecord, SubscriptionStatus } from "./types";
import { mergePlans, isPlanId } from "./catalog";
import { PLAN_SHAPE } from "./catalog";

type PlansFile = {
  prices?: Partial<Record<PlanId, { amountText?: string; active?: boolean }>>;
};

function billingDir() {
  return process.env.BILLING_DIR || path.join(process.cwd(), "data", "billing");
}

function plansPath() {
  return path.join(billingDir(), "plans.json");
}

function subsDir() {
  return path.join(billingDir(), "subs");
}

export async function loadPlanCatalog(): Promise<Plan[]> {
  let file: PlansFile = {};
  try {
    file = JSON.parse(await readFile(plansPath(), "utf8")) as PlansFile;
  } catch {
    file = {};
  }
  return mergePlans(file.prices);
}

export async function savePlanPrice(planId: PlanId, amountText: string): Promise<Plan[]> {
  if (planId === "free") return loadPlanCatalog();
  await mkdir(billingDir(), { recursive: true });
  let file: PlansFile = {};
  try {
    file = JSON.parse(await readFile(plansPath(), "utf8")) as PlansFile;
  } catch {
    file = {};
  }
  file.prices = file.prices || {};
  file.prices[planId] = { ...(file.prices[planId] || {}), amountText: stripCnics(amountText).slice(0, 40) };
  await writeFile(plansPath(), JSON.stringify(file, null, 2), "utf8");
  return loadPlanCatalog();
}

function subFile(id: string) {
  if (!/^[A-Za-z0-9_-]{8,32}$/.test(id)) throw new Error("bad_id");
  return path.join(subsDir(), `${id}.json`);
}

export async function saveSubscription(row: SubscriptionRecord): Promise<void> {
  await mkdir(subsDir(), { recursive: true });
  await writeFile(subFile(row.id), JSON.stringify(row), "utf8");
}

export async function loadSubscription(id: string): Promise<SubscriptionRecord | null> {
  try {
    return JSON.parse(await readFile(subFile(id), "utf8")) as SubscriptionRecord;
  } catch {
    return null;
  }
}

export async function listSubscriptions(): Promise<SubscriptionRecord[]> {
  try {
    const names = await readdir(subsDir());
    const out: SubscriptionRecord[] = [];
    for (const name of names) {
      if (!name.endsWith(".json")) continue;
      const row = await loadSubscription(name.replace(/\.json$/, ""));
      if (row) out.push(row);
    }
    return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

export async function subscriptionsForEmail(email: string): Promise<SubscriptionRecord[]> {
  const needle = email.trim().toLowerCase();
  if (!needle) return [];
  return (await listSubscriptions()).filter((s) => s.email === needle);
}

export function newSubscription(partial: {
  email: string;
  planId: PlanId;
  userId?: string;
  status?: SubscriptionStatus;
  note?: string;
}): SubscriptionRecord {
  if (!isPlanId(partial.planId) || partial.planId === "free") {
    throw new Error("bad_plan");
  }
  const shape = PLAN_SHAPE[partial.planId];
  return {
    id: randomToken(9),
    createdAt: new Date().toISOString(),
    email: stripCnics(partial.email).trim().toLowerCase().slice(0, 120),
    userId: partial.userId,
    planId: partial.planId,
    status: partial.status ?? "active",
    interval: shape.interval,
    note: stripCnics(partial.note || "").slice(0, 500),
  };
}

export async function deleteSubscription(id: string): Promise<void> {
  try {
    await unlink(subFile(id));
  } catch {
    /* ignore */
  }
}

export function isSubscriptionLive(row: SubscriptionRecord, now = Date.now()): boolean {
  if (row.status !== "active") return false;
  if (row.endsAt && Date.parse(row.endsAt) < now) return false;
  return true;
}
