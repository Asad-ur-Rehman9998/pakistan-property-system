import type { Entitlement, Plan, PlanId } from "./types";
import { ENTITLEMENTS, PLAN_IDS } from "./types";

/**
 * Shape of the four commercial offers. Amounts are never defined here.
 * Staff / env / data/billing/plans.json supply amountText.
 */
export const PLAN_SHAPE: Record<
  PlanId,
  Omit<Plan, "amountText" | "currency" | "active">
> = {
  free: {
    id: "free",
    audience: "customer",
    interval: "none",
    entitlements: ["basic_check"],
  },
  premium: {
    id: "premium",
    audience: "customer",
    interval: "month",
    entitlements: ["basic_check", "detailed_report"],
  },
  dealer: {
    id: "dealer",
    audience: "dealer",
    interval: "month",
    entitlements: ["basic_check", "detailed_report", "dealer_pages"],
  },
  professional: {
    id: "professional",
    audience: "professional",
    interval: "month",
    entitlements: ["basic_check", "detailed_report", "receive_review_requests"],
  },
};

export function isPlanId(value: string): value is PlanId {
  return (PLAN_IDS as readonly string[]).includes(value);
}

export function isEntitlement(value: string): value is Entitlement {
  return (ENTITLEMENTS as readonly string[]).includes(value);
}

export function allEntitlements(): Entitlement[] {
  return [...ENTITLEMENTS];
}

function envPrice(id: PlanId): string {
  if (id === "free") return "";
  const key = `PLAN_PRICE_${id.toUpperCase()}`;
  return String(process.env[key] || "").trim().slice(0, 40);
}

function envCurrency(): string {
  return String(process.env.PLAN_CURRENCY || "PKR").trim().slice(0, 8) || "PKR";
}

export function mergePlans(file: Partial<Record<PlanId, { amountText?: string; active?: boolean }>> | undefined): Plan[] {
  const currency = envCurrency();
  return PLAN_IDS.map((id) => {
    const fromFile = file?.[id]?.amountText?.trim() ?? "";
    const fromEnv = envPrice(id);
    const amountText = id === "free" ? "" : fromEnv || fromFile;
    return {
      ...PLAN_SHAPE[id],
      amountText,
      currency,
      active: file?.[id]?.active !== false,
    };
  });
}

export function displayAmount(plan: Plan): string | null {
  if (plan.id === "free") return null;
  const text = plan.amountText.trim();
  return text || null;
}
