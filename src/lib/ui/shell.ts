/** Viewports the product UI must work at without horizontal scroll. */
export const UI_VIEWPORTS = [
  { name: "mobile-360", width: 360, height: 800 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "laptop", width: 1280, height: 800 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

/** Tailwind `md` — bottom tabs hide; header nav shows. */
export const MD_NAV_MIN_WIDTH = 768;

export function usesBottomNav(width: number): boolean {
  return width < MD_NAV_MIN_WIDTH;
}
