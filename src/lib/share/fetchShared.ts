import type { SavedCheck } from "@/types/check";

export function shareKeyFromLocation(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("k") || "";
}

/** JSON summary only. Papers are never served. Requires the signed `k` query. */
export async function fetchSharedCheck(id: string, k?: string): Promise<SavedCheck> {
  const key = k ?? shareKeyFromLocation();
  const q = key ? `?k=${encodeURIComponent(key)}` : "";
  const res = await fetch(`/api/checks/${id}${q}`);
  if (!res.ok) throw new Error("missing");
  const data = (await res.json()) as SavedCheck;
  return key ? { ...data, shareKey: key } : data;
}
