export type A11yPrefs = {
  largeText: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
};

export const DEFAULT_A11Y: A11yPrefs = {
  largeText: false,
  highContrast: false,
  reduceMotion: false,
};

const KEY = "pehle.a11y";
export const A11Y_EVENT = "pehle-a11y";

export function readA11yPrefs(): A11yPrefs {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_A11Y };
    const parsed = JSON.parse(raw) as Partial<A11yPrefs>;
    return {
      largeText: Boolean(parsed.largeText),
      highContrast: Boolean(parsed.highContrast),
      reduceMotion: Boolean(parsed.reduceMotion),
    };
  } catch {
    return { ...DEFAULT_A11Y };
  }
}

export function setA11yPrefs(prefs: A11yPrefs) {
  window.localStorage.setItem(KEY, JSON.stringify(prefs));
  window.dispatchEvent(new Event(A11Y_EVENT));
}

export function prefersReducedMotion(media?: { matches: boolean } | null): boolean {
  return Boolean(media?.matches);
}

export function prefersMoreContrast(media?: { matches: boolean } | null): boolean {
  return Boolean(media?.matches);
}

export function applyA11yDom(prefs: A11yPrefs, opts?: { osContrast?: boolean; osMotion?: boolean }) {
  const root = document.documentElement;
  const contrast = prefs.highContrast || Boolean(opts?.osContrast);
  const motion = prefs.reduceMotion || Boolean(opts?.osMotion);
  if (prefs.largeText) root.setAttribute("data-a11y-text", "1");
  else root.removeAttribute("data-a11y-text");
  if (contrast) root.setAttribute("data-a11y-contrast", "1");
  else root.removeAttribute("data-a11y-contrast");
  if (motion) root.setAttribute("data-a11y-motion", "1");
  else root.removeAttribute("data-a11y-motion");
}

export function subscribeA11y(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(A11Y_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(A11Y_EVENT, onChange);
  };
}
