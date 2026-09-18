"use client";

import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import type { BillingMe, Entitlement } from "@/lib/billing/types";

const DEFAULT: BillingMe = {
  authed: false,
  role: "guest",
  planIds: ["free"],
  entitlements: ["basic_check"],
  guest: true,
};

const Ctx = createContext<BillingMe>(DEFAULT);

export function EntitlementsProvider({ children }: { children: React.ReactNode }) {
  const q = useQuery({
    queryKey: ["billing-me"],
    queryFn: async () => {
      const res = await fetch("/api/billing/me");
      return (await res.json()) as BillingMe;
    },
    staleTime: 15_000,
  });
  return <Ctx.Provider value={q.data ?? DEFAULT}>{children}</Ctx.Provider>;
}

export function useEntitlements() {
  const me = useContext(Ctx);
  return {
    ...me,
    can: (need: Entitlement) => me.entitlements.includes(need),
  };
}
