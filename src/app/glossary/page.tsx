"use client";

import { glossary, groupOrder } from "@/lib/pakistan/glossary";
import { TERMS } from "@/lib/pakistan/terms";
import { useI18n } from "@/lib/i18n/LanguageProvider";

export default function GlossaryPage() {
  const { t, lang } = useI18n();
  return (
    <div>
      <h1 className="text-3xl font-semibold leading-tight">{t.glossaryT}</h1>
      <p className="mt-2 text-base text-[var(--muted)]">{t.glossaryH}</p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">{t.termsTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{t.termsKeepH}</p>
        <ul className="mt-4 flex flex-col gap-3">
          {TERMS.map((entry) => (
            <li key={entry.id} className="panel p-4">
              <p className="text-lg font-semibold">{entry.term[lang]}</p>
              <p className="mt-2 text-sm leading-relaxed">{entry.explain[lang]}</p>
              <p className="mt-3 text-xs font-semibold tracking-wide text-[var(--green)]">{t.termsKeep}</p>
              <p className="text-sm">{entry.term.en} · {entry.term.ur} · {entry.term.roman}</p>
              <p className="mt-2 text-xs font-semibold tracking-wide text-[var(--muted)]">{t.termsDoNot}</p>
              <p className="text-sm text-[var(--muted)]">{entry.doNotCall[lang]}</p>
            </li>
          ))}
        </ul>
      </section>

      {groupOrder.map((group) => {
        const items = glossary.filter((g) => g.group === group.id);
        return (
          <section key={group.id} className="mt-8">
            <h2 className="text-lg font-semibold">{group.title[lang]}</h2>
            <ul className="mt-3 flex flex-col gap-3">
              {items.map((g) => (
                <li key={g.id}>
                  <details className="panel p-4">
                    <summary className="min-h-11 cursor-pointer text-lg font-semibold">{g.term[lang]}</summary>
                    <p className="mt-3 text-base leading-relaxed">
                      <span className="font-semibold">{t.plainWords}: </span>
                      {g.plain[lang]}
                    </p>
                    {g.alsoCalled ? (
                      <p className="mt-3 text-sm text-[var(--muted)]">
                        {t.also}: {g.alsoCalled[lang]}
                      </p>
                    ) : null}
                    <p className="mt-2 text-sm font-semibold">{t.meaning}</p>
                    <p className="text-base leading-relaxed">{g.meaning[lang]}</p>
                    <p className="mt-2 text-sm font-semibold">{t.when}</p>
                    <p className="text-base leading-relaxed">{g.whenNeeded[lang]}</p>
                  </details>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
