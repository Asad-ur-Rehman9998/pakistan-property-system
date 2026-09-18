import type { Role } from "@/lib/server/roles";
import type { Entitlement, Plan, PlanId, SubscriptionRecord } from "./types";
import { allEntitlements } from "./catalog";
import { isSubscriptionLive } from "./store";
import { PLAN_SHAPE } from "./catalog";

export function entitlementsFor(input: {
  role: Role | "guest";
  subscriptions: SubscriptionRecord[];
  plans?: Plan[];
  now?: number;
}): Entitlement[] {
  if (input.role === "staff") return allEntitlements();
  const live = input.subscriptions.filter((s) => isSubscriptionLive(s, input.now));
  const set = new Set<Entitlement>(PLAN_SHAPE.free.entitlements);
  for (const sub of live) {
    const fromCatalog = input.plans?.find((p) => p.id === sub.planId);
    const ents = fromCatalog?.entitlements ?? PLAN_SHAPE[sub.planId].entitlements;
    for (const e of ents) set.add(e);
  }
  return [...set];
}

export function livePlanIds(subscriptions: SubscriptionRecord[], now?: number): PlanId[] {
  const ids = new Set<PlanId>(["free"]);
  for (const sub of subscriptions) {
    if (isSubscriptionLive(sub, now)) ids.add(sub.planId);
  }
  return [...ids];
}

export function hasEntitlement(list: Entitlement[], need: Entitlement): boolean {
  return list.includes(need);
}
