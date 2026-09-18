"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { VoiceEntry } from "@/components/VoiceEntry";
import { WhoFor } from "@/components/WhoFor";

export default function HomePage() {
  const { t } = useI18n();

  return (
    <div className="flex min-h-[70vh] flex-col items-stretch pt-1">
      <p className="text-sm font-semibold text-[var(--green)]">{t.brandUr}</p>
      <h1 className="mt-1 text-[1.65rem] font-semibold leading-tight tracking-tight sm:text-3xl">
        {t.brand} {t.brandCountry}
      </h1>
      <p className="mt-4 text-lg font-medium leading-snug sm:text-xl">{t.homeLine}</p>
      <p className="mt-3 text-base font-medium leading-relaxed">{t.differentiator}</p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{t.notMoreListings}</p>

      <div className="mt-7 flex flex-col gap-2">
        <Link href="/check" prefetch={false} className="btn-primary w-full">
          {t.checkProperty}
        </Link>
        <Link href="/token" prefetch={false} className="btn-primary w-full">
          {t.tokenCta}
        </Link>
        <Link href="/dealer" prefetch={false} className="btn-ghost w-full">
          {t.dealerCta}
        </Link>
        <Link href="/how" prefetch={false} className="btn-ghost w-full">
          {t.understandCta}
        </Link>
      </div>

      <div className="mt-7 flex justify-center">
        <LanguageSwitch variant="full" />
      </div>

      <div className="mt-5">
        <VoiceEntry />
      </div>

      <p className="mt-6 text-sm leading-relaxed text-[var(--muted)]">{t.guestOk}</p>
      <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">{t.registerLater}</p>
      <WhoFor />
      <p className="mt-4 text-xs leading-relaxed text-[var(--muted)]">{t.notListing}</p>
      <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">{t.disclaimer}</p>
      <Link href="/privacy" prefetch={false} className="mt-4 text-xs text-[var(--muted)] underline">
        {t.privacyLink}
      </Link>
    </div>
  );
}
