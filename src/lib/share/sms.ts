import { stripCnics } from "@/lib/docai/sensitive";

/**
 * Official `sms:` compose URI. Opens the phone's SMS app with a short body.
 * This app never sends SMS itself and never reads the inbox.
 */
export function smsHref(text: string): string {
  const body = stripCnics(String(text || ""))
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);
  return `sms:?body=${encodeURIComponent(body)}`;
}

export function isOfficialSmsHref(href: string): boolean {
  return href.startsWith("sms:");
}
