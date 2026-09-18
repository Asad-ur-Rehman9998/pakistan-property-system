export type LowBwMode = "auto" | "on" | "off";

const KEY = "pehle.lowbw";
const EVENT = "pehle-lowbw";

type Conn = {
  saveData?: boolean;
  effectiveType?: string;
  downlink?: number;
};

export function readLowBwMode(): LowBwMode {
  try {
    const v = window.localStorage.getItem(KEY);
    if (v === "on" || v === "off" || v === "auto") return v;
  } catch {
    /* ignore */
  }
  return "auto";
}

export function setLowBwMode(mode: LowBwMode) {
  window.localStorage.setItem(KEY, mode);
  window.dispatchEvent(new Event(EVENT));
}

export function connectionLooksSlow(conn?: Conn | null): boolean {
  if (!conn) return false;
  if (conn.saveData) return true;
  const type = conn.effectiveType ?? "";
  if (type === "slow-2g" || type === "2g") return true;
  if (type === "3g" && (conn.downlink ?? 10) < 0.8) return true;
  if ((conn.downlink ?? 99) > 0 && (conn.downlink ?? 99) < 0.4) return true;
  return false;
}

export function browserConnection(): Conn | null {
  if (typeof navigator === "undefined") return null;
  const n = navigator as Navigator & { connection?: Conn; mozConnection?: Conn; webkitConnection?: Conn };
  return n.connection || n.mozConnection || n.webkitConnection || null;
}

export function isLowBandwidth(mode: LowBwMode = typeof window === "undefined" ? "auto" : readLowBwMode()): boolean {
  if (mode === "on") return true;
  if (mode === "off") return false;
  return connectionLooksSlow(browserConnection());
}

export function subscribeLowBw(onChange: () => void) {
  const conn = browserConnection() as (Conn & { addEventListener?: (e: string, fn: () => void) => void; removeEventListener?: (e: string, fn: () => void) => void }) | null;
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  conn?.addEventListener?.("change", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
    conn?.removeEventListener?.("change", onChange);
  };
}

export function applyLowBwDom(on: boolean) {
  const root = document.documentElement;
  if (on) {
    root.setAttribute("data-low-bw", "1");
    root.setAttribute("data-rural", "1");
  } else {
    root.removeAttribute("data-low-bw");
    root.removeAttribute("data-rural");
  }
}
