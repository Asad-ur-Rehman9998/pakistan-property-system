"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { readRetentionDays, setRetentionDays, type RetentionDays } from "@/lib/privacy/retention";
import { wipeLocalSensitive } from "@/lib/privacy/wipe";

type Session = {
  authed: boolean;
  id?: string;
  role?: string;
  totpEnabled?: boolean;
  email?: string;
};

export default function PrivacyPage() {
  const { t } = useI18n();
  const [session, setSession] = useState<Session>({ authed: false });
  const [retention, setRetention] = useState<RetentionDays>(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pro, setPro] = useState(false);
  const [totp, setTotp] = useState("");
  const [otpauth, setOtpauth] = useState("");
  const [msg, setMsg] = useState("");
  const [wiped, setWiped] = useState(false);

  const refresh = () => {
    void fetch("/api/auth/session")
      .then((r) => r.json())
      .then((s: Session) => setSession(s))
      .catch(() => setSession({ authed: false }));
  };

  useEffect(() => {
    setRetention(readRetentionDays());
    refresh();
  }, []);

  const post = async (url: string, body: unknown) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return { res, json: (await res.json().catch(() => ({}))) as Record<string, unknown> };
  };

  const register = async () => {
    setMsg("");
    const { res, json } = await post("/api/auth/register", {
      email,
      password,
      role: pro ? "professional" : "member",
    });
    if (!res.ok) {
      setMsg(json.error === "weak_password" ? t.weakPassword : t.authError);
      return;
    }
    if (json.totpRequired) await loadTotp();
    refresh();
  };

  const login = async () => {
    setMsg("");
    const { res, json } = await post("/api/auth/login", { email, password, totp: totp || undefined });
    if (res.status === 401 && json.error === "totp_required") {
      setMsg(t.totpNeeded);
      return;
    }
    if (!res.ok) {
      setMsg(t.authError);
      return;
    }
    refresh();
  };

  const loadTotp = async () => {
    const res = await fetch("/api/auth/totp");
    if (!res.ok) return;
    const json = (await res.json()) as { otpauth?: string };
    setOtpauth(json.otpauth || "");
  };

  const verifyTotp = async () => {
    const { res } = await post("/api/auth/totp", { code: totp });
    if (!res.ok) {
      setMsg(t.authError);
      return;
    }
    setOtpauth("");
    refresh();
  };

  return (
    <div>
      <h1 className="text-3xl font-semibold">{t.privacyPage}</h1>
      <p className="mt-3 leading-relaxed text-[var(--muted)]">{t.privacyGuest}</p>
      <p className="mt-2 font-semibold">{t.privacyNotPublic}</p>
      <p className="mt-2 leading-relaxed text-[var(--muted)]">{t.privacyH}</p>
      <p className="mt-4 text-sm text-[var(--muted)]">
        {session.authed ? `${t.sessionAuthed}${session.email ? ` · ${session.email}` : ""}` : t.sessionGuest}
      </p>
      {session.role === "staff" ? (
        <Link href="/admin" prefetch={false} className="mt-3 inline-flex text-sm font-semibold text-[var(--green)]">
          {t.adminLink}
        </Link>
      ) : null}

      <section className="mt-6 panel p-4">
        <h2 className="text-lg font-semibold">{t.retentionLabel}</h2>
        <div className="mt-3 flex flex-col gap-2">
          {(
            [
              [0, t.retentionKeep],
              [30, t.retention30],
              [90, t.retention90],
            ] as const
          ).map(([days, label]) => (
            <button
              key={days}
              type="button"
              className={retention === days ? "btn-primary" : "btn-ghost"}
              onClick={() => {
                setRetentionDays(days);
                setRetention(days);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-5 panel p-4">
        <h2 className="text-lg font-semibold">{t.wipeLocal}</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{t.wipeLocalH}</p>
        {wiped ? (
          <p className="mt-3 font-semibold">{t.wipeDone}</p>
        ) : (
          <button
            type="button"
            className="btn-ghost mt-3 w-full text-[var(--red)]"
            onClick={() => {
              void wipeLocalSensitive().then(() => setWiped(true));
            }}
          >
            {t.wipeLocal}
          </button>
        )}
      </section>

      <section className="mt-5 panel p-4">
        <h2 className="text-lg font-semibold">{t.registerOptional}</h2>
        {!session.authed ? (
          <>
            <input
              className="field mt-3"
              type="email"
              autoComplete="username"
              placeholder={t.registerEmail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="field mt-3"
              type="password"
              autoComplete="new-password"
              placeholder={t.registerPassword}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={pro} onChange={(e) => setPro(e.target.checked)} />
              {t.registerPro}
            </label>
            <input
              className="field mt-3"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder={t.totpNeeded}
              value={totp}
              onChange={(e) => setTotp(e.target.value)}
            />
            {msg ? <p className="mt-2 text-sm text-[var(--red)]">{msg}</p> : null}
            <button type="button" className="btn-primary mt-3 w-full" onClick={() => void register()}>
              {t.registerOptional}
            </button>
            <button type="button" className="btn-ghost mt-2 w-full" onClick={() => void login()}>
              {t.loginBtn}
            </button>
          </>
        ) : (
          <button
            type="button"
            className="btn-ghost mt-3 w-full"
            onClick={() => {
              void fetch("/api/auth/logout", { method: "POST" }).then(() => refresh());
            }}
          >
            {t.logoutBtn}
          </button>
        )}
      </section>

      {session.authed && (session.role === "professional" || session.role === "staff") ? (
        <section className="mt-5 panel p-4">
          <h2 className="text-lg font-semibold">{t.twoFactor}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{t.twoFactorH}</p>
          {session.totpEnabled ? (
            <p className="mt-3 text-sm font-semibold">{t.totpVerify}</p>
          ) : (
            <>
              <button type="button" className="btn-ghost mt-3 w-full" onClick={() => void loadTotp()}>
                {t.twoFactor}
              </button>
              {otpauth ? (
                <>
                  <p className="mt-3 break-all text-xs leading-relaxed">{otpauth}</p>
                  <button
                    type="button"
                    className="btn-ghost mt-2 w-full"
                    onClick={() => void navigator.clipboard.writeText(otpauth)}
                  >
                    {t.copyTotp}
                  </button>
                  <p className="mt-2 text-sm text-[var(--muted)]">{t.totpHint}</p>
                  <input
                    className="field mt-3"
                    inputMode="numeric"
                    placeholder={t.totpNeeded}
                    value={totp}
                    onChange={(e) => setTotp(e.target.value)}
                  />
                  <button type="button" className="btn-primary mt-3 w-full" onClick={() => void verifyTotp()}>
                    {t.totpVerify}
                  </button>
                </>
              ) : null}
            </>
          )}
        </section>
      ) : null}

      {session.authed ? (
        <section className="mt-5 panel p-4">
          <h2 className="text-lg font-semibold">{t.deleteAccount}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{t.deleteAccountH}</p>
          <button
            type="button"
            className="btn-ghost mt-3 w-full text-[var(--red)]"
            onClick={() => {
              void fetch("/api/auth/account", { method: "DELETE" }).then(() => refresh());
            }}
          >
            {t.deleteAccount}
          </button>
        </section>
      ) : null}

      <Link href="/plans" prefetch={false} className="mt-4 inline-flex text-sm text-[var(--muted)] underline">
        {t.planSee}
      </Link>
      <Link href="/check" prefetch={false} className="btn-primary mt-6 inline-flex w-full">
        {t.checkProperty}
      </Link>
    </div>
  );
}
