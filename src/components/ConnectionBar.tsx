"use client";

import { SyncStatus, useSyncPhase } from "./SyncStatus";
import { useEffect, useState } from "react";

export function ConnectionBar() {
  const { phase } = useSyncPhase();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready || phase === "saved_on_device") return null;

  return (
    <div className="border-b border-[var(--line)] bg-[var(--paper-2)] px-4 py-2" role="status" aria-live="polite">
      <SyncStatus alwaysSaved />
    </div>
  );
}
