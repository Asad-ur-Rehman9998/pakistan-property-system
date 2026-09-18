"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { useEntitlements } from "@/components/billing/EntitlementsProvider";
import { UpgradeNote } from "@/components/billing/UpgradeNote";

type Review = {
  id: string;
  createdAt: string;
  checkId: string;
  what: string;
  status: string;
};

export default function ReviewInboxPage() {
  const { t } = useI18n();
  const { can } = useEntitlements();
  const qc = useQueryClient();
  const [err, setErr] = useState("");
  const q = useQuery({
    queryKey: ["reviews"],
    enabled: can("receive_review_requests"),
    queryFn: async () => {
      const res = await fetch("/api/reviews");
      if (res.status === 403) throw new Error("plan");
      return (await res.json()) as { items: Review[] };
    },
  });
  const patch = useMutation({
    mutationFn: async (body: { id: string; status: string }) => {
      const res = await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("fail");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews"] }),
  });

  if (!can("receive_review_requests")) {
    return (
      <div>
        <h1 className="text-3xl font-semibold leading-tight">{t.reviewTitle}</h1>
        <UpgradeNote title={t.planProLock} body={t.planProLockH} />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold leading-tight">{t.reviewTitle}</h1>
      <p className="mt-3 text-base leading-relaxed">{t.reviewH}</p>
      <p className="mt-2 text-sm text-[var(--muted)]">{t.reviewNotVerified}</p>
      {err ? <p className="mt-3 text-sm text-[var(--red)]">{err}</p> : null}
      <ul className="mt-6 space-y-3">
        {(q.data?.items || []).map((row) => (
          <li key={row.id} className="panel p-4">
            <p className="text-sm text-[var(--muted)]">{row.status}</p>
            <p className="mt-1 font-semibold">{row.what}</p>
            <Link href={`/r/${row.checkId}`} prefetch={false} className="mt-2 inline-flex text-sm text-[var(--green)]">
              {t.reviewOpenCheck}
            </Link>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["accepted", "done"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  className="btn-ghost min-h-10 px-3 text-xs"
                  onClick={() => {
                    setErr("");
                    patch.mutate({ id: row.id, status }, { onError: () => setErr(t.authError) });
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
      {q.data && q.data.items.length === 0 ? <p className="mt-4 text-sm text-[var(--muted)]">{t.reviewEmpty}</p> : null}
    </div>
  );
}
