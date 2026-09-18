"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  applyA11yDom,
  prefersMoreContrast,
  prefersReducedMotion,
  readA11yPrefs,
  setA11yPrefs,
  subscribeA11y,
  type A11yPrefs,
  DEFAULT_A11Y,
} from "@/lib/a11y/prefs";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/cn";

type Ctx = {
  prefs: A11yPrefs;
  setPref: (key: keyof A11yPrefs, value: boolean) => void;
};

const A11yContext = createContext<Ctx>({
  prefs: DEFAULT_A11Y,
  setPref: () => undefined,
});

function osFlags() {
  if (typeof window === "undefined") return { osContrast: false, osMotion: false };
  return {
    osContrast: prefersMoreContrast(window.matchMedia?.("(prefers-contrast: more)")),
    osMotion: prefersReducedMotion(window.matchMedia?.("(prefers-reduced-motion: reduce)")),
  };
}

export function A11yProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<A11yPrefs>(DEFAULT_A11Y);

  useEffect(() => {
    const sync = () => {
      const next = readA11yPrefs();
      setPrefs(next);
      applyA11yDom(next, osFlags());
    };
    sync();
    const mqContrast = window.matchMedia?.("(prefers-contrast: more)");
    const mqMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    mqContrast?.addEventListener?.("change", sync);
    mqMotion?.addEventListener?.("change", sync);
    const unsub = subscribeA11y(sync);
    return () => {
      mqContrast?.removeEventListener?.("change", sync);
      mqMotion?.removeEventListener?.("change", sync);
      unsub();
    };
  }, []);

  const setPref = useCallback((key: keyof A11yPrefs, value: boolean) => {
    const next = { ...readA11yPrefs(), [key]: value };
    setA11yPrefs(next);
    setPrefs(next);
    applyA11yDom(next, osFlags());
  }, []);

  const value = useMemo(() => ({ prefs, setPref }), [prefs, setPref]);
  return <A11yContext.Provider value={value}>{children}</A11yContext.Provider>;
}

export function useA11y() {
  return useContext(A11yContext);
}

export function A11yMenu() {
  const { t } = useI18n();
  const { prefs, setPref } = useA11y();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="flex max-w-[16rem] flex-col items-end gap-1">
      <button
        type="button"
        className={cn(
          "min-h-11 rounded-[var(--radius)] border px-3 text-xs font-semibold",
          open || prefs.largeText || prefs.highContrast || prefs.reduceMotion
            ? "border-[var(--green)] bg-[var(--green-soft)] text-[var(--green-deep)]"
            : "border-[var(--line)] bg-[var(--paper-2)]",
        )}
        aria-expanded={open}
        aria-controls="a11y-panel"
        onClick={() => setOpen((v) => !v)}
      >
        {t.a11y}
      </button>
      {open ? (
        <div
          id="a11y-panel"
          role="group"
          aria-label={t.a11y}
          className="panel mt-1 w-[min(18rem,calc(100vw-2rem))] p-3 text-start"
        >
          <p className="text-xs leading-snug text-[var(--muted)]">{t.a11yH}</p>
          <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold">
            <input
              type="checkbox"
              className="h-5 w-5 shrink-0 accent-[var(--green-deep)]"
              checked={prefs.largeText}
              onChange={(e) => setPref("largeText", e.target.checked)}
            />
            {t.a11yLarge}
          </label>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold">
            <input
              type="checkbox"
              className="h-5 w-5 shrink-0 accent-[var(--green-deep)]"
              checked={prefs.highContrast}
              onChange={(e) => setPref("highContrast", e.target.checked)}
            />
            {t.a11yContrast}
          </label>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold">
            <input
              type="checkbox"
              className="h-5 w-5 shrink-0 accent-[var(--green-deep)]"
              checked={prefs.reduceMotion}
              onChange={(e) => setPref("reduceMotion", e.target.checked)}
            />
            {t.a11yMotion}
          </label>
          <p className="mt-2 text-xs leading-snug text-[var(--muted)]">{t.footerHelp}</p>
        </div>
      ) : null}
    </div>
  );
}
