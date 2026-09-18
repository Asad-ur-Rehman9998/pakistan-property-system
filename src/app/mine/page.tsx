"use client";

import Link from "next/link";
import { useSyncExternalStore, useState } from "react";
import { loadChecks, subscribeChecks } from "@/lib/storage";
import type { SavedCheck } from "@/types/check";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { WhatsAppShare, useOrigin } from "@/components/WhatsAppShare";
import { SmsShare } from "@/components/SmsShare";
import { formatReportLinkWhatsApp, formatSmsFallback } from "@/lib/share/messages";
import { publicReportPath } from "@/lib/share/sheet";
import { deleteLocalCheck } from "@/lib/privacy/wipe";

const NONE: SavedCheck[] = [];
function emptyChecks() {
  return NONE;
}

export default function MinePage() {
  const { t, lang } = useI18n();
  const origin = useOrigin();
  const items = useSyncExternalStore(subscribeChecks, loadChecks, emptyChecks);
  const [busy, setBusy] = useState<string | null>(null);

  return (
    <div>
      <h1 className="text-3xl font-semibold">{t.myChecks}</h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{t.mineGuest}</p>
      <p className="mt-2 text-sm font-semibold text-[var(--green-deep)]">{t.savedOnDevice}</p>
      <Link href="/privacy" prefetch={false} className="mt-2 inline-flex text-sm font-semibold text-[var(--green)]">
        {t.privacyLink}
      </Link>
      {items.length === 0 ? (
        <p className="mt-4 text-[var(--muted)]">{t.noneYet}</p>
      ) : (
        <ul className="mt-5 flex flex-col gap-3">
          {items.map((c) => (
            <li key={c.id} className="panel p-4">
              <Link href={publicReportPath(c.id, c.shareKey)} prefetch={false} className="block">
                <p className="font-semibold">{c.report.headline[lang]}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {c.answers.city}
                  {c.answers.area ? ` · ${c.answers.area}` : ""}
                </p>
              </Link>
              <WhatsAppShare className="mt-3 w-full" text={formatReportLinkWhatsApp(c, origin, lang)} />
              <SmsShare className="mt-2 w-full" text={formatSmsFallback(`${origin}${publicReportPath(c.id, c.shareKey)}`, lang)} />
              <button
                type="button"
                className="mt-3 w-full text-sm font-semibold text-[var(--red)]"
                disabled={busy === c.id}
                onClick={() => {
                  setBusy(c.id);
                  void deleteLocalCheck(c).finally(() => setBusy(null));
                }}
              >
                {t.deleteThisCheck}
              </button>
            </li>
          ))}
        </ul>
      )}
      <Link href="/check" className="btn-primary mt-6 inline-flex">
        {t.newCheck}
      </Link>
    </div>
  );
}
