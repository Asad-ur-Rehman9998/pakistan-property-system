"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { useEntitlements } from "@/components/billing/EntitlementsProvider";
import type { PlanId } from "@/lib/billing/types";
import { track } from "@/lib/analytics/client";

type PlanRow = {
  id: PlanId;
  audience: string;
  interval: string;
  entitlements: string[];
  currency: string;
  amountText: string | null;
};

export default function PlansPage() {
  const { t } = useI18n();
  const me = useEntitlements();
  useEffect(() => {
    track("feature", { feature: "plans" });
  }, []);
  const q = useQuery({
    queryKey: ["billing-plans"],
    queryFn: async () => {
      const res = await fetch("/api/billing/plans");
      return (await res.json()) as { plans: PlanRow[] };
    },
  });
  const plans = q.data?.plans ?? [];
  const title: Record<PlanId, string> = {
    free: t.planFreeT,
    premium: t.planPremiumT,
    dealer: t.planDealerT,
    professional: t.planProT,
  };
  const body: Record<PlanId, string> = {
    free: t.planFreeH,
    premium: t.planPremiumH,
    dealer: t.planDealerH,
    professional: t.planProH,
  };

  return (
    <div>
      <h1 className="text-3xl font-semibold leading-tight">{t.planTitle}</h1>
      <p className="mt-3 text-base leading-relaxed">{t.planH}</p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{t.planNoHardPrice}</p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{t.guestOk}</p>
      <ul className="mt-6 space-y-4">
        {plans.map((plan) => {
          const live = me.planIds.includes(plan.id);
          return (
            <li key={plan.id} className="panel p-4">
              <p className="text-xs font-semibold tracking-wide text-[var(--muted)]">
                {plan.audience}
                {plan.interval === "month" ? ` · ${t.planMonthly}` : ""}
              </p>
              <h2 className="mt-1 text-lg font-semibold">{title[plan.id]}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{body[plan.id]}</p>
              <p className="mt-3 text-sm font-semibold">
                {plan.id === "free" ? t.planFreeAmount : plan.amountText || t.planPriceUnset}
              </p>
              {live ? <p className="mt-2 text-sm font-semibold text-[var(--green)]">{t.planCurrent}</p> : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
