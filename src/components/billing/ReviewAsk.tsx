"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/LanguageProvider";

export function ReviewAsk({ checkId }: { checkId: string }) {
  const { t } = useI18n();
  const [what, setWhat] = useState("");
  const [msg, setMsg] = useState("");

  const send = async () => {
    setMsg("");
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ checkId, what: what || t.reviewDefaultWhat }),
    });
    setMsg(res.ok ? t.reviewSent : t.authError);
    if (res.ok) setWhat("");
  };

  return (
    <section id="review-ask" className="panel mt-8 p-4 print:hidden">
      <h2 className="text-lg font-semibold">{t.reviewAskT}</h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{t.reviewAskH}</p>
      <textarea className="field mt-3 min-h-24" value={what} onChange={(e) => setWhat(e.target.value)} />
      <button type="button" className="btn-ghost mt-3 w-full" onClick={() => void send()}>
        {t.reviewAskGo}
      </button>
      {msg ? <p className="mt-2 text-sm">{msg}</p> : null}
    </section>
  );
}
