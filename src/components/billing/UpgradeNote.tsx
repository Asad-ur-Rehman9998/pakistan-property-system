"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { track } from "@/lib/analytics/client";
import type { ConversionStage } from "@/lib/analytics/events";

export function UpgradeNote({
  title,
  body,
  stage = "premium",
}: {
  title?: string;
  body?: string;
  stage?: ConversionStage | false;
}) {
  const { t } = useI18n();
  useEffect(() => {
    if (stage) track("conversion", { stage });
  }, [stage]);
  return (
    <section className="panel mt-5 p-4">
      <p className="font-semibold">{title || t.planPremiumLock}</p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{body || t.planPremiumLockH}</p>
      <Link href="/plans" prefetch={false} className="btn-ghost mt-3 inline-flex">
        {t.planSee}
      </Link>
    </section>
  );
}
