"use client";

import { useEffect } from "react";
import { USER_SAFE_EN } from "@/lib/errors/safe";
import { logClientError } from "@/lib/errors/log";
import { useI18n } from "@/lib/i18n/LanguageProvider";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();
  useEffect(() => {
    logClientError(error);
  }, [error]);

  return (
    <div>
      <h1 className="text-2xl font-semibold leading-snug">{t.err || USER_SAFE_EN}</h1>
      <p className="mt-3 text-sm text-[var(--muted)]">{t.savedOnDevice}</p>
      <button type="button" className="btn-primary mt-6 inline-flex w-full" onClick={() => reset()}>
        {t.tryAgain}
      </button>
    </div>
  );
}
