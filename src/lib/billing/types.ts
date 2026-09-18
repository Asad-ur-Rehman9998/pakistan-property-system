export const PLAN_IDS = ["free", "premium", "dealer", "professional"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export const ENTITLEMENTS = [
  "basic_check",
  "detailed_report",
  "dealer_pages",
  "receive_review_requests",
] as const;
export type Entitlement = (typeof ENTITLEMENTS)[number];

export type PlanAudience = "customer" | "dealer" | "professional";
export type PlanInterval = "none" | "month";

/** Price is never a code literal. Empty amountText means staff has not set it yet. */
export type Plan = {
  id: PlanId;
  audience: PlanAudience;
  interval: PlanInterval;
  entitlements: Entitlement[];
  amountText: string;
  currency: string;
  active: boolean;
};

export type SubscriptionStatus = "active" | "cancelled" | "past_due" | "recorded";

export type SubscriptionRecord = {
  id: string;
  createdAt: string;
  email: string;
  userId?: string;
  planId: PlanId;
  status: SubscriptionStatus;
  interval: PlanInterval;
  endsAt?: string;
  note: string;
};

export type BillingMe = {
  authed: boolean;
  role: string;
  planIds: PlanId[];
  entitlements: Entitlement[];
  guest: boolean;
};
