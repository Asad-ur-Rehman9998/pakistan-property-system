/**
 * Final product standard — PropertyCheck Pakistan.
 * Quiet Pakistani financial/legal product, not a student CRUD app
 * and not a generic AI-generated dashboard.
 */

export const PRODUCT_STANDARD =
  "The final application should look and feel ready to present to Pakistani property dealers, buyers, developers, banks, legal professionals, investors, government or authorized verification partners, and overseas Pakistanis. It must not look like a student CRUD project or a generic AI-generated dashboard.";

export const PRESENTATION_AUDIENCES = [
  "Pakistani property dealers",
  "Buyers",
  "Developers",
  "Banks",
  "Legal professionals",
  "Investors",
  "Government/authorized verification partners",
  "Overseas Pakistanis",
] as const;

export const FORBIDDEN_PRODUCT_LOOKS = [
  "student CRUD project",
  "generic AI-generated dashboard",
] as const;

/** Visual contract already enforced in globals.css + shell tests. */
export const PRODUCT_LOOK = {
  brand: "PropertyCheck Pakistan",
  tone: "quiet Pakistani financial/legal — trust, clarity, speed",
  oneGreen: "#14532d",
  radius: "0.375rem",
  borders: "1px",
  homeCtas: ["check", "token", "dealer", "understand"] as const,
  homePaths: ["/check", "/token", "/dealer", "/how"] as const,
  not: ["listing board", "CRM", "chatbot", "marketplace", "overloaded dashboard"] as const,
} as const;

export const PRODUCT_DOC = "docs/PRODUCT.md";
export const PRODUCT_CSS = "src/app/globals.css";
export const PRODUCT_SHELL = "src/lib/ui/shell.ts";
