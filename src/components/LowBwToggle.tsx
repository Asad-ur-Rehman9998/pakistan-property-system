"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  applyLowBwDom,
  isLowBandwidth,
  readLowBwMode,
  setLowBwMode,
  subscribeLowBw,
  type LowBwMode,
} from "@/lib/offline/bandwidth";
import { preferredRuralLang } from "@/lib/offline/rural";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/cn";

type Snap = { mode: LowBwMode; on: boolean };

const DEFAULT: Snap = { mode: "auto", on: false };

const LowBwContext = createContext<Snap & { cycle: () => void }>({
  ...DEFAULT,
  cycle: () => undefined,
});

function readSnap(): Snap {
  const mode = readLowBwMode();
  return { mode, on: isLowBandwidth(mode) };
}

export function LowBwProvider({ children }: { children: React.ReactNode }) {
  const [snap, setSnap] = useState<Snap>(DEFAULT);

  useEffect(() => {
    const sync = () => {
      const next = readSnap();
      setSnap((prev) => (prev.mode === next.mode && prev.on === next.on ? prev : next));
      applyLowBwDom(next.on);
    };
    sync();
    return subscribeLowBw(sync);
  }, []);

  const cycle = useCallback(() => {
    const mode = readLowBwMode();
    const next: LowBwMode = mode === "auto" ? "on" : mode === "on" ? "off" : "auto";
    setLowBwMode(next);
    const on = isLowBandwidth(next);
    setSnap({ mode: next, on });
    applyLowBwDom(on);
  }, []);

  const value = useMemo(() => ({ ...snap, cycle }), [snap, cycle]);

  return <LowBwContext.Provider value={value}>{children}</LowBwContext.Provider>;
}

export function useLowBandwidth() {
  return useContext(LowBwContext);
}

export function LowBwToggle() {
  const { t, lang, setLang } = useI18n();
  const { mode, on, cycle } = useLowBandwidth();
  const label = mode === "on" ? t.lowBwOn : mode === "off" ? t.lowBwOff : t.lowBwAuto;
  const turnOn = () => {
    if (mode === "auto") setLang(preferredRuralLang(lang));
    cycle();
  };
  return (
    <div className="flex max-w-[16rem] flex-col items-end gap-1">
      <button
        type="button"
        onClick={turnOn}
        className={cn(
          "min-h-11 rounded-[var(--radius)] border px-3 text-xs font-semibold",
          on ? "border-[var(--green)] bg-[var(--green-soft)] text-[var(--green-deep)]" : "border-[var(--line)] bg-[var(--paper-2)]",
        )}
      >
        {t.lowBw}: {label}
      </button>
      {on ? <p className="text-end text-xs leading-snug text-[var(--muted)]">{t.ruralModeH}</p> : null}
    </div>
  );
}
