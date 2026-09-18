"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { getCheck, saveCheck, subscribeChecks } from "@/lib/storage";
import type { SavedCheck } from "@/types/check";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { fetchSharedCheck } from "@/lib/share/fetchShared";

const ReportView = dynamic(() => import("@/components/ReportView").then((m) => ({ default: m.ReportView })), {
  loading: () => <p className="text-[var(--muted)]">…</p>,
});

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useI18n();
  const exampleKey = id.startsWith("ex-") ? id.slice(3) : "";
  const local = useSyncExternalStore(
    subscribeChecks,
    () => getCheck(id),
    () => null,
  );
  const [example, setExample] = useState<SavedCheck | undefined>(undefined);
  const [catalog, setCatalog] = useState<SavedCheck[]>([]);

  useEffect(() => {
    if (!exampleKey) return;
    let cancelled = false;
    void import("@/lib/engine/examples").then((m) => {
      if (cancelled) return;
      setExample(m.examples[exampleKey]);
      setCatalog(Object.values(m.examples));
    });
    return () => {
      cancelled = true;
    };
  }, [exampleKey]);

  const remote = useQuery({
    queryKey: ["check", id],
    queryFn: () => fetchSharedCheck(id),
    enabled: !exampleKey && !local,
  });

  useEffect(() => {
    if (remote.data) saveCheck(remote.data);
  }, [remote.data]);

  const check = example ?? local ?? remote.data;
  if (check) return <ReportView check={check} example={!!example} catalog={example ? catalog : undefined} />;
  if (remote.isError) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">{t.err}</h1>
      </div>
    );
  }
  return (
    <div>
      <h1 className="text-2xl font-semibold">{t.loading}</h1>
      <p className="mt-2 text-[var(--muted)]">{t.loadingH}</p>
    </div>
  );
}
