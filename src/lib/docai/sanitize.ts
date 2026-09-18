import type { CheckAnswers, PaperRead } from "@/types/check";
import { stripCnics } from "./sensitive";

function scrubFields(read: PaperRead): PaperRead {
  return {
    ...read,
    photoKey: "",
    fields: read.fields
      .filter((f) => f.key !== "cnicLast4")
      .map((f) => ({ ...f, value: stripCnics(f.value), sensitive: false })),
  };
}

/** Drop secrets before a check is shared or queued to the server. Papers never leave this phone. */
export function sanitizeAnswersForShare(answers: CheckAnswers): CheckAnswers {
  return {
    ...answers,
    notes: stripCnics(answers.notes || "").slice(0, 4000),
    paperReads: (answers.paperReads ?? []).map(scrubFields),
  };
}

export function sanitizeCheckForShare<T extends { answers: CheckAnswers; shareKey?: string }>(saved: T): T {
  const { shareKey: _key, ...rest } = saved;
  return { ...(rest as T), answers: sanitizeAnswersForShare(saved.answers) };
}

export function payloadLooksLikeDocumentDump(body: string): boolean {
  const lower = body.slice(0, 200_000).toLowerCase();
  if (lower.includes("data:image")) return true;
  if (lower.includes("application/octet-stream")) return true;
  if (/"photoKey"\s*:\s*"(data:|blob:)/.test(lower)) return true;
  return false;
}
