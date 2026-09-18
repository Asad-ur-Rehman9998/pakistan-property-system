import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyA11yDom,
  DEFAULT_A11Y,
  prefersMoreContrast,
  prefersReducedMotion,
  readA11yPrefs,
  setA11yPrefs,
} from "./prefs";

beforeEach(() => {
  const store: Record<string, string> = {};
  const ls = {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      for (const key of Object.keys(store)) delete store[key];
    },
    key: () => null,
    get length() {
      return Object.keys(store).length;
    },
  };
  const attrs: Record<string, string> = {};
  vi.stubGlobal(
    "window",
    {
      localStorage: ls,
      dispatchEvent: () => true,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    },
  );
  vi.stubGlobal("localStorage", ls);
  vi.stubGlobal("document", {
    documentElement: {
      setAttribute: (k: string, v: string) => {
        attrs[k] = v;
      },
      removeAttribute: (k: string) => {
        delete attrs[k];
      },
      getAttribute: (k: string) => attrs[k] ?? null,
    },
  });
});

describe("a11y prefs", () => {
  it("defaults to off and stores each switch", () => {
    expect(readA11yPrefs()).toEqual(DEFAULT_A11Y);
    setA11yPrefs({ largeText: true, highContrast: true, reduceMotion: true });
    expect(readA11yPrefs()).toEqual({ largeText: true, highContrast: true, reduceMotion: true });
  });

  it("marks the document for text, contrast, and reduced motion", () => {
    applyA11yDom({ largeText: true, highContrast: false, reduceMotion: false });
    expect(document.documentElement.getAttribute("data-a11y-text")).toBe("1");
    expect(document.documentElement.getAttribute("data-a11y-contrast")).toBeNull();
    applyA11yDom({ largeText: false, highContrast: true, reduceMotion: true }, { osContrast: false, osMotion: false });
    expect(document.documentElement.getAttribute("data-a11y-text")).toBeNull();
    expect(document.documentElement.getAttribute("data-a11y-contrast")).toBe("1");
    expect(document.documentElement.getAttribute("data-a11y-motion")).toBe("1");
  });

  it("treats OS contrast and reduced-motion as on", () => {
    applyA11yDom(DEFAULT_A11Y, { osContrast: true, osMotion: true });
    expect(document.documentElement.getAttribute("data-a11y-contrast")).toBe("1");
    expect(document.documentElement.getAttribute("data-a11y-motion")).toBe("1");
    expect(prefersMoreContrast({ matches: true })).toBe(true);
    expect(prefersReducedMotion({ matches: false })).toBe(false);
  });
});
