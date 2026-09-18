"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { TOKEN_CHECKLIST } from "@/lib/engine/tokenChecklist";
import { VoiceEntry } from "@/components/VoiceEntry";
import { WhatsAppShare, useOrigin } from "@/components/WhatsAppShare";
import { SmsShare } from "@/components/SmsShare";
import { useLowBandwidth } from "@/components/LowBwToggle";
import { formatChecklistWhatsApp, formatSmsFallback } from "@/lib/share/messages";

export default function TokenModePage() {
  const { t, lang } = useI18n();
  const origin = useOrigin();
  const { on: rural } = useLowBandwidth();
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--green)]">{t.tokenMode}</p>
      <h1 className="mt-1 text-3xl font-semibold leading-tight">{t.tokenIntroQ}</h1>
      <p className="mt-4 text-base leading-relaxed text-[var(--muted)]">{t.tokenIntroH}</p>
      <ol className="mt-6 space-y-3">
        {TOKEN_CHECKLIST.map((item, i) => (
          <li key={item.id} className="panel p-4">
            <p className="text-sm font-semibold text-[var(--green)]">{i + 1}</p>
            <h2 className="mt-1 text-lg font-semibold leading-snug">{item.title[lang]}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{item.hint[lang]}</p>
          </li>
        ))}
      </ol>
      <p className="mt-6 text-sm leading-relaxed text-[var(--muted)]">{t.ddChecklistH}</p>
      <WhatsAppShare
        className="btn-primary mt-4 w-full"
        text={formatChecklistWhatsApp({ lang, url: `${origin}/token` })}
      />
      <SmsShare className="mt-2 w-full" text={formatSmsFallback(`${origin}/token`, lang)} />
      <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">{t.waOfficial}</p>
      {rural ? <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{t.smsH}</p> : null}
      <div className="mt-6">
        <VoiceEntry compact />
      </div>
      <Link href="/check?intent=token" prefetch={false} className="btn-primary mt-6 w-full">
        {t.tokenStart}
      </Link>
      <Link href="/r/ex-token" prefetch={false} className="btn-ghost mt-3 w-full">
        {t.tokenEx}
      </Link>
    </div>
  );
}
