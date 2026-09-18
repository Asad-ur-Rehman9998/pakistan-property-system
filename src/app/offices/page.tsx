"use client";

import { offices } from "@/lib/pakistan/offices";
import { useI18n } from "@/lib/i18n/LanguageProvider";

export default function OfficesPage() {
  const { t, lang } = useI18n();
  return (
    <div>
      <h1 className="text-3xl font-semibold leading-tight">{t.officesT}</h1>
      <p className="mt-2 text-base text-[var(--muted)]">{t.officesH}</p>
      <ul className="mt-6 flex flex-col gap-3">
        {offices.map((o) => (
          <li key={o.id} className="panel p-4">
            <h2 className="text-lg font-semibold leading-snug">{o.name[lang]}</h2>
            <p className="mt-3 text-sm font-semibold">{t.does}</p>
            <p className="leading-relaxed">{o.does[lang]}</p>
            <p className="mt-2 text-sm font-semibold">{t.typical}</p>
            <p className="leading-relaxed">{o.typicalFor[lang]}</p>
            <p className="mt-2 text-sm font-semibold text-[var(--amber)]">{t.caution}</p>
            <p className="leading-relaxed">{o.caution[lang]}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
