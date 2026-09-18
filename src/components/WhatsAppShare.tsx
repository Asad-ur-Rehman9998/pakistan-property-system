"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { whatsappHref } from "@/lib/share/whatsapp";
import { cn } from "@/lib/cn";
import { track } from "@/lib/analytics/client";

export function useOrigin() {
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  return origin;
}

export function WhatsAppShare({
  text,
  phone,
  className,
  label,
}: {
  text: string;
  phone?: string;
  className?: string;
  label?: string;
}) {
  const { t } = useI18n();
  return (
    <a
      className={cn("print:hidden", className ?? "btn-ghost")}
      href={whatsappHref(text, phone)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track("feature", { feature: "whatsapp" })}
    >
      {label ?? t.share}
    </a>
  );
}
