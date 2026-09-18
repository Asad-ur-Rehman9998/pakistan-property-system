"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { Intent } from "@/types/check";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { voiceSeedFromSearch } from "@/lib/voice/seed";

const CheckWizard = dynamic(() => import("@/components/CheckWizard").then((m) => ({ default: m.CheckWizard })), {
  loading: () => <WizardWait />,
});

function WizardWait() {
  const { t } = useI18n();
  return <p className="text-[var(--muted)]">{t.loading}</p>;
}

function Inner() {
  const params = useSearchParams();
  const raw = params.get("intent");
  const intent = raw === "buy" || raw === "sell" || raw === "rent" || raw === "token" ? (raw as Intent) : undefined;
  const dealerPageId = params.get("page");
  const fromDealer = params.get("from") === "dealer";
  const abroad = params.get("abroad") === "1";
  const voiceSeed = voiceSeedFromSearch(params);
  return (
    <CheckWizard
      initialIntent={intent}
      initialAbroad={abroad}
      dealerPageId={dealerPageId}
      fromDealer={fromDealer}
      voiceSeed={voiceSeed}
    />
  );
}

export default function CheckPage() {
  return (
    <Suspense fallback={<WizardWait />}>
      <Inner />
    </Suspense>
  );
}
