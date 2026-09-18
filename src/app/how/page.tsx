"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/LanguageProvider";

export default function HowPage() {
  const { t } = useI18n();
  const steps = [
    [t.how1t, t.how1],
    [t.how2t, t.how2],
    [t.how3t, t.how3],
    [t.how4t, t.how4],
    [t.how5t, t.how5],
    [t.how6t, t.how6],
    [t.how7t, t.how7],
    [t.how8t, t.how8],
    [t.how9t, t.how9],
    [t.how10t, t.how10],
    [t.how11t, t.how11],
    [t.how12t, t.how12],
    [t.how13t, t.how13],
    [t.how14t, t.how14],
    [t.how15t, t.how15],
    [t.how16t, t.how16],
    [t.how17t, t.how17],
    [t.how18t, t.how18],
    [t.how19t, t.how19],
    [t.how20t, t.how20],
    [t.how21t, t.how21],
    [t.how22t, t.how22],
    [t.how23t, t.how23],
    [t.how24t, t.how24],
    [t.how25t, t.how25],
    [t.how26t, t.how26],
    [t.how27t, t.how27],
    [t.how28t, t.how28],
    [t.how29t, t.how29],
    [t.how30t, t.how30],
    [t.how31t, t.how31],
    [t.how32t, t.how32],
    [t.how33t, t.how33],
    [t.how34t, t.how34],
    [t.how35t, t.how35],
    [t.how36t, t.how36],
    [t.how37t, t.how37],
    [t.how38t, t.how38],
    [t.how39t, t.how39],
    [t.how40t, t.how40],
  ];
  return (
    <div>
      <h1 className="text-3xl font-semibold leading-tight">{t.howTitle}</h1>
      <ol className="mt-6 space-y-4">
        {steps.map(([title, body], i) => (
          <li key={title} className="panel p-4">
            <p className="text-sm font-semibold text-[var(--green)]">{i + 1}</p>
            <h2 className="mt-1 text-lg font-semibold">{title}</h2>
            <p className="mt-2 leading-relaxed text-[var(--muted)]">{body}</p>
          </li>
        ))}
      </ol>
      <p className="mt-2 leading-relaxed text-[var(--muted)]">{t.foundHow}</p>
      <p className="mt-2 leading-relaxed">{t.simpleFlow}</p>
      <p className="mt-2 leading-relaxed text-[var(--muted)]">{t.pakistanFirst}</p>
      <p className="mt-2 leading-relaxed">{t.ruralAccess}</p>
      <h2 className="mt-8 text-lg font-semibold">{t.problemTitle}</h2>
      <ol className="mt-3 space-y-2 text-sm">
        {[t.problem1, t.problem2, t.problem3, t.problem4, t.problem5, t.problem6, t.problem7, t.problem8].map(
          (item, i) => (
            <li key={item}>
              {i + 1}. {item}
            </li>
          ),
        )}
      </ol>
      <section className="mt-8">
        <h2 className="text-lg font-semibold">{t.privacy}</h2>
        <p className="mt-2 leading-relaxed text-[var(--muted)]">{t.privacyH}</p>
        <Link href="/privacy" prefetch={false} className="mt-3 inline-flex text-sm font-semibold text-[var(--green)]">
          {t.privacyLink}
        </Link>
        <Link href="/plans" prefetch={false} className="mt-3 ms-4 inline-flex text-sm font-semibold text-[var(--green)]">
          {t.planSee}
        </Link>
      </section>
      <section className="mt-8">
        <h2 className="text-lg font-semibold">{t.examples}</h2>
        <ul className="mt-3 flex flex-col gap-2">
          <li>
            <Link href="/r/ex-demo" prefetch={false} className="btn-ghost w-full">
              {t.demoEx}
            </Link>
          </li>
          <li>
            <Link href="/r/ex-urban" prefetch={false} className="btn-ghost w-full">
              {t.urbanEx}
            </Link>
          </li>
          <li>
            <Link href="/r/ex-rural" prefetch={false} className="btn-ghost w-full">
              {t.ruralEx}
            </Link>
          </li>
          <li>
            <Link href="/r/ex-token" prefetch={false} className="btn-ghost w-full">
              {t.tokenEx}
            </Link>
          </li>
          <li>
            <Link href="/r/ex-papers" prefetch={false} className="btn-ghost w-full">
              {t.papersEx}
            </Link>
          </li>
          <li>
            <Link href="/r/ex-overseas" prefetch={false} className="btn-ghost w-full">
              {t.overseasEx}
            </Link>
          </li>
        </ul>
      </section>
      <p className="mt-6 text-sm text-[var(--muted)]">{t.guestOk}</p>
      <p className="mt-2 text-sm text-[var(--muted)]">{t.registerLater}</p>
      <p className="mt-6 text-sm text-[var(--muted)]">{t.disclaimer}</p>
      <Link href="/check" prefetch={false} className="btn-primary mt-6 inline-flex w-full">
        {t.checkProperty}
      </Link>
    </div>
  );
}
