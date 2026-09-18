import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PLAN_SHAPE, displayAmount, mergePlans } from "./catalog";
import { entitlementsFor, livePlanIds } from "./entitlements";
import type { SubscriptionRecord } from "./types";

const catalogSrc = readFileSync(path.join(process.cwd(), "src/lib/billing/catalog.ts"), "utf8");

function sub(planId: SubscriptionRecord["planId"], status: SubscriptionRecord["status"] = "active"): SubscriptionRecord {
  return {
    id: "sub1",
    createdAt: "2026-01-01T00:00:00.000Z",
    email: "a@example.com",
    planId,
    status,
    interval: "month",
    note: "",
  };
}

describe("configurable plans", () => {
  it("does not hardcode a rupee or dollar price in the catalog module", () => {
    expect(catalogSrc).not.toMatch(/\b\d{2,}\s*(pkr|rs\.?|rupee)/i);
    expect(catalogSrc).not.toMatch(/amountText:\s*["'][^"']*\d/);
    expect(PLAN_SHAPE.premium.entitlements).toContain("detailed_report");
    expect(PLAN_SHAPE.dealer.interval).toBe("month");
    expect(PLAN_SHAPE.professional.entitlements).toContain("receive_review_requests");
    expect(PLAN_SHAPE.free.entitlements).toEqual(["basic_check"]);
  });

  it("takes prices only from env or the plans file", () => {
    const prev = process.env.PLAN_PRICE_PREMIUM;
    delete process.env.PLAN_PRICE_PREMIUM;
    try {
      const unset = mergePlans(undefined);
      expect(displayAmount(unset.find((p) => p.id === "premium")!)).toBeNull();
      const set = mergePlans({ premium: { amountText: "staff-set" } });
      expect(displayAmount(set.find((p) => p.id === "premium")!)).toBe("staff-set");
    } finally {
      if (prev === undefined) delete process.env.PLAN_PRICE_PREMIUM;
      else process.env.PLAN_PRICE_PREMIUM = prev;
    }
  });

  it("gives a guest the basic check only", () => {
    expect(entitlementsFor({ role: "guest", subscriptions: [] })).toEqual(["basic_check"]);
    expect(livePlanIds([])).toEqual(["free"]);
  });

  it("unlocks detailed reports on an active premium subscription", () => {
    const ents = entitlementsFor({ role: "member", subscriptions: [sub("premium")] });
    expect(ents).toContain("basic_check");
    expect(ents).toContain("detailed_report");
    expect(ents).not.toContain("dealer_pages");
  });

  it("unlocks dealer pages on a monthly dealer subscription", () => {
    const ents = entitlementsFor({ role: "member", subscriptions: [sub("dealer")] });
    expect(ents).toContain("dealer_pages");
  });

  it("lets professionals receive review requests when subscribed", () => {
    const ents = entitlementsFor({ role: "professional", subscriptions: [sub("professional")] });
    expect(ents).toContain("receive_review_requests");
  });

  it("does not treat a cancelled plan as live", () => {
    const ents = entitlementsFor({ role: "member", subscriptions: [sub("premium", "cancelled")] });
    expect(ents).toEqual(["basic_check"]);
  });

  it("gives staff every entitlement without a paid plan", () => {
    const ents = entitlementsFor({ role: "staff", subscriptions: [] });
    expect(ents).toContain("detailed_report");
    expect(ents).toContain("dealer_pages");
    expect(ents).toContain("receive_review_requests");
  });
});
