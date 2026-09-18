import { stripCnics } from "@/lib/docai/sensitive";

/** Exact guest-facing copy. Never replace with a stack, status phrase, or JS type. */
export const USER_SAFE_EN =
  "Something went wrong. Your information has been saved. Please try again.";

/** Machine code for 500 JSON. Never a TypeError, status phrase, undefined, or null. */
export const UNEXPECTED_JSON = { error: "something_went_wrong" } as const;

const TECHNICAL =
  /\b(500|internal server error|typeerror|referenceerror|syntaxerror|urierror|evalerror|rangeerror|undefined|null|cannot read prop|cannot read properties|is not a function|econnrefused|enotfound|prisma|sqlstate|traceback|stack trace)\b/i;

export function isTechnicalText(raw: unknown): boolean {
  if (raw == null) return true;
  if (typeof raw !== "string") return isTechnicalText(String(raw));
  const s = raw.trim();
  if (!s || s === "undefined" || s === "null") return true;
  return TECHNICAL.test(s);
}

/** Always the guest sentence. Never returns TypeError, 500, undefined, or null. */
export function publicUserMessage(_raw?: unknown): string {
  return USER_SAFE_EN;
}

export function summarizeError(raw: unknown): { name: string; detail: string } {
  if (raw instanceof Error) {
    return {
      name: (raw.name || "Error").slice(0, 40),
      detail: redact(raw.message || "unknown"),
    };
  }
  if (typeof raw === "string") return { name: "Error", detail: redact(raw) };
  return { name: "Error", detail: "unknown" };
}

function redact(text: string): string {
  let s = stripCnics(String(text || ""));
  s = s.replace(/(password|secret|token|authorization|cookie)\s*[:=]\s*\S+/gi, "$1=[redacted]");
  s = s.replace(/bearer\s+\S+/gi, "bearer [redacted]");
  return s.replace(/\s+/g, " ").trim().slice(0, 180);
}
