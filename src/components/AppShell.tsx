"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/cn";
import { IconStamp, IconBook, IconOffice, IconHouse } from "./icons";
import { LanguageSwitch } from "./LanguageSwitch";
import { ConnectionBar } from "./ConnectionBar";
import { LowBwToggle } from "./LowBwToggle";
import { A11yMenu } from "./A11yMenu";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t, lang, dir } = useI18n();
  const path = usePathname();
  const urdu = lang === "ur";
  const admin = path.startsWith("/admin");

  return (
    <div className={cn("min-h-dvh flex flex-col", urdu && "font-urdu")} dir={dir}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:m-3 focus:start-3 focus:top-3 focus:rounded-[var(--radius)] focus:bg-[var(--green-deep)] focus:px-4 focus:py-3 focus:text-white"
      >
        {t.skipMain}
      </a>
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--paper)] print:hidden" role="banner">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" prefetch={false} className="flex min-h-11 items-center gap-2">
            <span className="rural-hide-icon text-[var(--green)]">
              <IconStamp className="h-7 w-7" />
            </span>
            <span>
              <span className="block text-base font-semibold leading-none tracking-tight">{t.brand}</span>
              <span className="mt-1 block text-[11px] leading-none text-[var(--muted)]">{t.brandCountry}</span>
            </span>
          </Link>
          {admin ? null : (
            <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 md:flex lg:gap-2" aria-label={t.navMain}>
              <Tab href="/" active={path === "/"} icon={<IconHouse className="h-4 w-4" />} label={t.home} inline />
              <Tab href="/check" active={path.startsWith("/check")} icon={<IconStamp className="h-4 w-4" />} label={t.navCheck} inline />
              <Tab href="/glossary" active={path.startsWith("/glossary")} icon={<IconBook className="h-4 w-4" />} label={t.glossary} inline />
              <Tab href="/offices" active={path.startsWith("/offices")} icon={<IconOffice className="h-4 w-4" />} label={t.offices} inline />
            </nav>
          )}
          <LanguageSwitch />
        </div>
        <div className="mx-auto flex w-full max-w-6xl items-start justify-end gap-2 px-4 pb-2">
          <A11yMenu />
          <LowBwToggle />
        </div>
        <ConnectionBar />
      </header>
      <main
        id="main"
        className={cn("mx-auto w-full flex-1 px-4 pt-5", admin ? "shell-wide pb-10" : "shell pb-28 md:pb-12")}
        tabIndex={-1}
      >
        {children}
      </main>
      {admin ? null : (
        <nav
          className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--line)] bg-[var(--paper-2)] pb-[env(safe-area-inset-bottom)] print:hidden md:hidden"
          aria-label={t.navMain}
          role="navigation"
        >
          <div className="mx-auto grid max-w-lg grid-cols-4 text-center text-[11px] font-medium">
            <Tab href="/" active={path === "/"} icon={<IconHouse className="h-5 w-5" />} label={t.home} />
            <Tab href="/check" active={path.startsWith("/check")} icon={<IconStamp className="h-5 w-5" />} label={t.navCheck} />
            <Tab href="/glossary" active={path.startsWith("/glossary")} icon={<IconBook className="h-5 w-5" />} label={t.glossary} />
            <Tab href="/offices" active={path.startsWith("/offices")} icon={<IconOffice className="h-5 w-5" />} label={t.offices} />
          </div>
        </nav>
      )}
    </div>
  );
}

function Tab({
  href,
  active,
  icon,
  label,
  inline,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
  inline?: boolean;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={cn(
        inline
          ? "inline-flex min-h-10 items-center gap-1.5 rounded-[var(--radius)] px-2.5 text-sm"
          : "flex min-h-14 flex-col items-center justify-center gap-1 px-1",
        active ? "text-[var(--green)]" : "text-[var(--muted)]",
      )}
      aria-current={active ? "page" : undefined}
    >
      {icon}
      <span className={inline ? "whitespace-nowrap" : "line-clamp-1"}>{label}</span>
    </Link>
  );
}
