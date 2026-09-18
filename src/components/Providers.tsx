"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { AppShell } from "@/components/AppShell";
import { LowBwProvider } from "@/components/LowBwToggle";
import { A11yProvider } from "@/components/A11yMenu";
import { EntitlementsProvider } from "@/components/billing/EntitlementsProvider";
import { flushQueue } from "@/lib/offline/queue";
import { purgeExpiredChecks } from "@/lib/privacy/wipe";
import { logClientError } from "@/lib/errors/log";
import { flushAnalytics } from "@/lib/analytics/client";
import { useEffect } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false, throwOnError: false },
          mutations: { retry: 0, throwOnError: false },
        },
      }),
  );

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* ignore */
      });
    }
    void flushQueue();
    void flushAnalytics();
    purgeExpiredChecks();
    const onOnline = () => {
      void flushQueue(fetch, { force: true });
      void flushAnalytics();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void flushQueue(fetch, { force: true });
        void flushAnalytics();
      }
    };
    const onErr = (e: ErrorEvent) => logClientError(e.error ?? e.message);
    const onRej = (e: PromiseRejectionEvent) => logClientError(e.reason);
    window.addEventListener("online", onOnline);
    window.addEventListener("pageshow", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onRej);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("pageshow", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("error", onErr);
      window.removeEventListener("unhandledrejection", onRej);
    };
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <LowBwProvider>
          <A11yProvider>
            <EntitlementsProvider>
              <AppShell>{children}</AppShell>
            </EntitlementsProvider>
          </A11yProvider>
        </LowBwProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
