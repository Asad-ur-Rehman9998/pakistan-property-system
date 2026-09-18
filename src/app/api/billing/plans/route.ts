import { NextResponse } from "next/server";
import { loadPlanCatalog } from "@/lib/billing/store";
import { displayAmount } from "@/lib/billing/catalog";

export async function GET() {
  const plans = await loadPlanCatalog();
  return NextResponse.json({
    processor: false,
    plans: plans.filter((p) => p.active).map((p) => ({
      id: p.id,
      audience: p.audience,
      interval: p.interval,
      entitlements: p.entitlements,
      currency: p.currency,
      amountText: displayAmount(p),
    })),
  });
}
