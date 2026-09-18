"use client";

import { useEffect } from "react";
import { USER_SAFE_EN } from "@/lib/errors/safe";
import { logClientError } from "@/lib/errors/log";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logClientError(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main style={{ maxWidth: 32 * 16, margin: "2rem auto", padding: "0 1rem", fontFamily: "system-ui, sans-serif" }}>
          <h1>{USER_SAFE_EN}</h1>
          <button type="button" onClick={() => reset()}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
