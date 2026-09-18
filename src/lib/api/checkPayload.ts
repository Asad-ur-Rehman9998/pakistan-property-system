import { z } from "zod";
import { isCheckId, sha256Hex } from "@/lib/server/secret";
import { payloadLooksLikeDocumentDump } from "@/lib/docai/sanitize";

const Localized = z.object({ en: z.string(), ur: z.string(), roman: z.string() });

export const sharedCheckPayload = z.object({
  id: z.string().min(8).max(32).regex(/^[A-Za-z0-9_-]+$/),
  createdAt: z.string().max(48),
  answers: z.unknown(),
  report: z
    .object({
      version: z.literal(1),
      createdAt: z.string().max(48),
      verdict: z.enum(["stop", "wait", "careful"]),
      headline: Localized,
      summary: Localized,
      score: z.number(),
    })
    .passthrough(),
  shareTokenHash: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  shareKey: z.string().optional(),
});

export type SharedCheckPayload = z.infer<typeof sharedCheckPayload>;

export type CheckPayloadResult =
  | { ok: true; data: SharedCheckPayload; shareTokenHash?: string }
  | { ok: false; error: string };

/** Shared JSON reports only. Paper photos, data-URLs, and full CNICs are rejected. */
export function validateSharedCheckJson(json: unknown): CheckPayloadResult {
  const raw = JSON.stringify(json);
  if (payloadLooksLikeDocumentDump(raw)) return { ok: false, error: "papers_stay_on_phone" };
  const parsed = sharedCheckPayload.safeParse(json);
  if (!parsed.success || !isCheckId(parsed.data.id)) return { ok: false, error: "invalid" };
  const notes = (parsed.data.answers as { notes?: unknown } | null)?.notes;
  if (typeof notes === "string" && notes.length > 4000) return { ok: false, error: "too_long" };
  const shareTokenHash =
    parsed.data.shareTokenHash || (parsed.data.shareKey ? sha256Hex(parsed.data.shareKey) : undefined);
  if (parsed.data.shareKey && shareTokenHash && sha256Hex(parsed.data.shareKey) !== shareTokenHash) {
    return { ok: false, error: "invalid" };
  }
  return { ok: true, data: parsed.data, shareTokenHash };
}
