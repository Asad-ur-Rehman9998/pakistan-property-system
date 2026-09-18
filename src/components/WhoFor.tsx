"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/LanguageProvider";

export function WhoFor() {
  const { t } = useI18n();
  const people: { text: string; href?: string }[] = [
    { text: t.whoRural },
    { text: t.whoFirstBuy },
    { text: t.whoOverseas, href: "/overseas" },
    { text: t.whoSmallDealer },
    { text: t.whoLowLiteracy },
    { text: t.whoWhatsApp },
    { text: t.whoPapers },
  ];
  return (
    <section className="panel mt-6 p-4">
      <h2 className="text-sm font-semibold tracking-wide text-[var(--green)]">{t.whoForTitle}</h2>
      <ul className="mt-3 list-disc space-y-1.5 ps-5 text-sm leading-relaxed">
        {people.map((item) => (
          <li key={item.text}>
            {item.href ? (
              <Link href={item.href} prefetch={false} className="font-semibold text-[var(--green)] underline">
                {item.text}
              </Link>
            ) : (
              item.text
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
