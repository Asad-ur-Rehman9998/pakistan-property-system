"use client";

import { useEffect, useState } from "react";
import { resolveSyncPhase, type SyncPhase } from "@/lib/offline/architecture";
import {
  isFlushing,
  lastQueueError,
  lastSuccessfulSyncAtMs,
  pendingUploads,
  subscribeQueue,
} from "@/lib/offline/queue";
import { useI18n } from "@/lib/i18n/LanguageProvider";

function readOnline() {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

export function useSyncPhase(): { phase: SyncPhase; queued: number } {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const refresh = () => setTick((n) => n + 1);
    refresh();
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    const unsub = subscribeQueue(refresh);
    return () => {
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
      unsub();
    };
  }, []);

  useEffect(() => {
    const left = 4000 - (Date.now() - lastSuccessfulSyncAtMs());
    if (left <= 0) return;
    const hide = window.setTimeout(() => setTick((n) => n + 1), left);
    return () => window.clearTimeout(hide);
  }, [tick]);

  void tick;
  const queued = typeof window === "undefined" ? 0 : pendingUploads().length;
  const justSynced = Date.now() - lastSuccessfulSyncAtMs() < 4000;
  return {
    phase: resolveSyncPhase({
      online: readOnline(),
      queued,
      syncing: isFlushing(),
      lastError: lastQueueError(),
      justSynced,
    }),
    queued,
  };
}

export function SyncStatus({ alwaysSaved = true }: { alwaysSaved?: boolean }) {
  const { t } = useI18n();
  const { phase, queued } = useSyncPhase();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const line =
    phase === "internet_unavailable"
      ? t.internetUnavailable
      : phase === "syncing"
        ? t.syncing
        : phase === "waiting"
          ? t.waitingSync
          : phase === "failed"
            ? t.syncFailedKept
            : phase === "synced"
              ? t.synced
              : t.savedOnDevice;

  if (!ready) {
    return alwaysSaved ? (
      <p className="text-sm font-semibold leading-snug text-[var(--green-deep)]">{t.savedOnDevice}</p>
    ) : null;
  }

  if (phase === "saved_on_device" && !alwaysSaved) return null;

  return (
    <div className="text-sm leading-snug" role="status" aria-live="polite">
      {phase === "internet_unavailable" || phase === "waiting" || phase === "failed" ? (
        <>
          <p className="font-semibold text-[var(--ink)]">{line}</p>
          <p className="mt-0.5 font-semibold text-[var(--green-deep)]">{t.savedOnDevice}</p>
          {queued > 0 && (phase === "waiting" || phase === "failed") ? (
            <p className="mt-0.5 text-[var(--muted)]">{t.queued}</p>
          ) : null}
        </>
      ) : (
        <p className="font-semibold text-[var(--green-deep)]">{line}</p>
      )}
    </div>
  );
}
