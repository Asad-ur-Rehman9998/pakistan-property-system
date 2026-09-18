"use client";

import type { Lang } from "@/types/check";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/cn";

export function LanguageSwitch({ variant = "compact" }: { variant?: "compact" | "full" }) {
  const { lang, setLang, t } = useI18n();
  const langs: { id: Lang; label: string }[] =
    variant === "full"
      ? [
          { id: "ur", label: "Urdu" },
          { id: "roman", label: "Roman Urdu" },
          { id: "en", label: "English" },
        ]
      : [
          { id: "roman", label: "Roman" },
          { id: "ur", label: "اردو" },
          { id: "en", label: "EN" },
        ];
  return (
    <div
      className={cn(
        "flex rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper-2)] p-0.5",
        variant === "full" && "w-full max-w-md",
      )}
      role="group"
      aria-label={t.language}
    >
      {langs.map((l) => (
        <button
          key={l.id}
          type="button"
          onClick={() => setLang(l.id)}
          aria-pressed={lang === l.id}
          className={cn(
            "min-h-11 flex-1 rounded-[var(--radius)] px-2 text-xs font-semibold",
            variant === "full" && "min-h-12 px-3 text-sm",
            lang === l.id ? "bg-[var(--green)] text-white" : "text-[var(--ink)]",
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
