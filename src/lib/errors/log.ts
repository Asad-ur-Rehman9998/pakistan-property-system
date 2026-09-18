import { publicUserMessage, summarizeError } from "./safe";

/** Browser-only. Never send papers, full CNIC, or answers. */
export function logClientError(err: unknown) {
  if (typeof window === "undefined") return;
  const tech = summarizeError(err);
  try {
    void fetch("/api/errors", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: tech.name, detail: tech.detail }),
    });
  } catch {
    /* never throw from logging */
  }
}

export { publicUserMessage };
