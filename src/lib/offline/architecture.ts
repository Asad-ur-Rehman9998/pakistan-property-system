export const OFFLINE_STAGE_IDS = [
  "fill_property",
  "saved_locally",
  "internet_unavailable",
  "saved_on_device",
  "internet_returns",
  "sync",
] as const;

export type OfflineStageId = (typeof OFFLINE_STAGE_IDS)[number];

/** Visible sync phase. Drafts and reports stay on the device in every phase. */
export type SyncPhase =
  | "saved_on_device"
  | "internet_unavailable"
  | "waiting"
  | "syncing"
  | "synced"
  | "failed";

export function resolveSyncPhase(input: {
  online: boolean;
  queued: number;
  syncing?: boolean;
  lastError?: string | null;
  justSynced?: boolean;
}): SyncPhase {
  if (!input.online) return "internet_unavailable";
  if (input.syncing) return "syncing";
  if (input.queued > 0) return input.lastError ? "failed" : "waiting";
  if (input.justSynced) return "synced";
  return "saved_on_device";
}
