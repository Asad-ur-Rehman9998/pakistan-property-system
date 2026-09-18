"use client";

import { useI18n } from "@/lib/i18n/LanguageProvider";
import { useLowBandwidth } from "@/components/LowBwToggle";
import { smsHref } from "@/lib/share/sms";
import { cn } from "@/lib/cn";

/** Shown only in rural / low-data mode. Opens the phone SMS app — never sends from this site. */
export function SmsShare({
  text,
  className,
  label,
}: {
  text: string;
  className?: string;
  label?: string;
}) {
  const { t } = useI18n();
  const { on } = useLowBandwidth();
  if (!on) return null;
  return (
    <a className={cn("print:hidden", className ?? "btn-ghost")} href={smsHref(text)}>
      {label ?? t.smsShare}
    </a>
  );
}
