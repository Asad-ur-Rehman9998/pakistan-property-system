"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { STAFF_SCOPES, type StaffScope } from "@/lib/admin/scopes";
import { isTechnicalText } from "@/lib/errors/safe";
import { logClientError } from "@/lib/errors/log";

type Session = {
  authed: boolean;
  role?: string;
  email?: string;
  totpEnabled?: boolean;
  grants?: StaffScope[];
  owner?: boolean;
};

const LABELS: Record<StaffScope | "overview", { en: string; ur: string; roman: string }> = {
  overview: { en: "Overview", ur: "خلاصہ", roman: "Khulasa" },
  users: { en: "Users", ur: "صارفین", roman: "Users" },
  dealers: { en: "Dealers", ur: "ڈیلر", roman: "Dealers" },
  properties: { en: "Properties", ur: "جائیدادیں", roman: "Properties" },
  reports: { en: "Reports", ur: "رپورٹس", roman: "Reports" },
  documents: { en: "Documents", ur: "کاغذات", roman: "Kaghazat" },
  verify: { en: "Verification requests", ur: "تصدیق کی درخواستیں", roman: "Tasdeeq darkhwastein" },
  flags: { en: "Flagged pages", ur: "نشان شدہ صفحات", roman: "Nishaan shuda pages" },
  duplicates: { en: "Duplicate pages", ur: "مشابہ صفحات", roman: "Mushabah pages" },
  billing: { en: "Billing", ur: "بلنگ", roman: "Billing" },
  complaints: { en: "Complaints", ur: "شکایات", roman: "Shikayatein" },
  audit: { en: "Audit logs", ur: "آڈٹ", roman: "Audit" },
  analytics: { en: "Analytics", ur: "تجزیہ", roman: "Analytics" },
  ai: { en: "AI usage", ur: "AI استعمال", roman: "AI usage" },
  health: { en: "System health", ur: "سسٹم صحت", roman: "System health" },
};

export function AdminDesk() {
  const { t, lang } = useI18n();
  const loc = (row: { en: string; ur: string; roman: string }) => row[lang];
  const [session, setSession] = useState<Session>({ authed: false });
  const [section, setSection] = useState<StaffScope | "overview">("overview");
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [err, setErr] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [note, setNote] = useState("");

  const refreshSession = useCallback(() => {
    void fetch("/api/auth/session")
      .then((r) => r.json())
      .then((s: Session) => setSession(s))
      .catch(() => setSession({ authed: false }));
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const load = useCallback(async (sec: StaffScope | "overview") => {
    setErr("");
    try {
      const res = await fetch(`/api/admin/${sec}`);
      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        const code = String(json.error || "");
        setErr(
          code === "forbidden"
            ? t.adminForbidden
            : code === "something_went_wrong" || isTechnicalText(code)
              ? t.err
              : t.authError,
        );
        setData(null);
        return;
      }
      setData(json);
    } catch (e) {
      logClientError(e);
      setErr(t.err);
      setData(null);
    }
  }, [t.adminForbidden, t.authError, t.err]);

  useEffect(() => {
    if (session.role === "staff" && session.totpEnabled) void load(section);
  }, [session.role, session.totpEnabled, section, load]);

  const login = async () => {
    setErr("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, totp: totp || undefined }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.status === 401 && json.error === "totp_required") {
        setErr(t.totpNeeded);
        return;
      }
      if (!res.ok) {
        const code = String(json.error || "");
        setErr(isTechnicalText(code) || code === "something_went_wrong" ? t.err : t.authError);
        return;
      }
      refreshSession();
    } catch (e) {
      logClientError(e);
      setErr(t.err);
    }
  };

  const grants = session.grants ?? [];
  const desks: Array<StaffScope | "overview"> = ["overview", ...STAFF_SCOPES.filter((s) => grants.includes(s))];

  if (!session.authed || session.role !== "staff") {
    return (
      <div>
        <h1 className="text-3xl font-semibold">{t.adminTitle}</h1>
        <p className="mt-3 leading-relaxed text-[var(--muted)]">{t.adminGuest}</p>
        <p className="mt-2 text-sm font-semibold">{t.adminNotUnlimited}</p>
        <input className="field mt-4" type="email" placeholder={t.registerEmail} value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="field mt-3" type="password" placeholder={t.registerPassword} value={password} onChange={(e) => setPassword(e.target.value)} />
        <input className="field mt-3" inputMode="numeric" placeholder={t.totpNeeded} value={totp} onChange={(e) => setTotp(e.target.value)} />
        {err ? <p className="mt-2 text-sm text-[var(--red)]">{err}</p> : null}
        <button type="button" className="btn-primary mt-3 w-full" onClick={() => void login()}>
          {t.loginBtn}
        </button>
        <Link href="/check" prefetch={false} className="btn-ghost mt-3 inline-flex w-full">
          {t.checkProperty}
        </Link>
      </div>
    );
  }

  if (!session.totpEnabled) {
    return (
      <div>
        <h1 className="text-3xl font-semibold">{t.adminTitle}</h1>
        <p className="mt-3 leading-relaxed">{t.adminNeedTotp}</p>
        <Link href="/privacy" className="btn-primary mt-4 inline-flex">
          {t.twoFactor}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold">{t.adminTitle}</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {session.email}
        {session.owner ? ` · ${t.adminOwner}` : ""}
      </p>
      <p className="mt-2 leading-relaxed text-[var(--muted)]">{t.adminH}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {desks.map((id) => (
          <button
            key={id}
            type="button"
            className={section === id ? "btn-primary min-h-11 px-3 text-sm" : "btn-ghost min-h-11 px-3 text-sm"}
            onClick={() => setSection(id)}
          >
            {loc(LABELS[id])}
          </button>
        ))}
      </div>
      {err ? <p className="mt-3 text-sm text-[var(--red)]">{err}</p> : null}
      <section className="mt-5 panel p-4">
        <DeskBody
          section={section}
          data={data}
          lang={lang}
          t={t}
          owner={Boolean(session.owner)}
          note={note}
          setNote={setNote}
          reload={() => void load(section)}
        />
      </section>
    </div>
  );
}

function DeskBody({
  section,
  data,
  lang,
  t,
  owner,
  note,
  setNote,
  reload,
}: {
  section: StaffScope | "overview";
  data: Record<string, unknown> | null;
  lang: "en" | "ur" | "roman";
  t: {
    adminEmpty: string;
    adminHint: string;
    adminSave: string;
    adminPack: string;
    planNoHardPrice: string;
    planSee: string;
    planPriceUnset: string;
  };
  owner: boolean;
  note: string;
  setNote: (v: string) => void;
  reload: () => void;
}) {
  if (!data) return <p className="text-[var(--muted)]">{t.adminEmpty}</p>;
  const hint = typeof data.hint === "string" ? data.hint : "";

  if (section === "overview") {
    const counts = (data.counts || {}) as Record<string, number>;
    const scopes = (data.scopes || []) as string[];
    return (
      <div>
        <p className="text-sm">{t.adminHint}</p>
        <p className="mt-2 text-sm text-[var(--muted)]">{scopes.join(" · ")}</p>
        <ul className="mt-3 space-y-1 text-sm">
          {Object.entries(counts).map(([k, v]) => (
            <li key={k}>
              {k}: {v}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm font-semibold">LLM: {String(data.llm)} · {lang === "ur" ? "سرکاری تصدیق" : "Official verification"}: 0</p>
      </div>
    );
  }

  if (section === "ai") {
    return (
      <div>
        <p className="font-semibold">LLM calls: {String(data.calls ?? 0)}</p>
        <p className="mt-2 text-sm">Required: {String(data.llmRequired ?? false)}</p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{hint}</p>
        <p className="mt-3 text-sm">{Array.isArray(data.pipeline) ? (data.pipeline as string[]).join(" → ") : ""}</p>
      </div>
    );
  }

  if (section === "health") {
    return (
      <ul className="space-y-1 text-sm">
        <li>ok: {String(data.ok)}</li>
        <li>persistence: {String(data.persistence)}</li>
        <li>llm: {String(data.llm)}</li>
        <li>flutter: {String(data.flutter)}</li>
        <li>users: {String(data.users)}</li>
        <li>shared checks: {String(data.sharedChecks)}</li>
        <li>official verification: 0</li>
      </ul>
    );
  }

  if (section === "users") {
    const users = (data.users || []) as { id: string; email: string; role: string; grants: string[]; disabled: boolean }[];
    const packs = (data.packs || {}) as Record<string, string[]>;
    return (
      <ul className="space-y-3">
        {users.map((u) => (
          <li key={u.id} className="panel p-3">
            <p className="font-semibold">{u.email}</p>
            <p className="text-sm text-[var(--muted)]">
              {u.role}
              {u.disabled ? " · disabled" : ""}
              {u.grants?.length ? ` · ${u.grants.join(", ")}` : ""}
            </p>
            {owner ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.keys(packs).map((pack) => (
                  <button
                    key={pack}
                    type="button"
                    className="btn-ghost min-h-10 px-3 text-xs"
                    onClick={() => {
                      void fetch("/api/admin/users", {
                        method: "PATCH",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ id: u.id, pack, role: pack ? "staff" : u.role }),
                      }).then(reload);
                    }}
                  >
                    {pack}
                  </button>
                ))}
                <button
                  type="button"
                  className="btn-ghost min-h-10 px-3 text-xs text-[var(--red)]"
                  onClick={() => {
                    void fetch("/api/admin/users", {
                      method: "PATCH",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({ id: u.id, disabled: !u.disabled }),
                    }).then(reload);
                  }}
                >
                  {u.disabled ? "enable" : "disable"}
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    );
  }

  if (section === "billing") {
    const items = (data.items || []) as { id: string; kind: string; note: string; amount?: string; createdAt: string }[];
    const plans = (data.plans || []) as { id: string; amountText: string; interval: string }[];
    const subscriptions = (data.subscriptions || []) as { id: string; email: string; planId: string; status: string }[];
    return (
      <div>
        <p className="text-sm text-[var(--muted)]">{hint}</p>
        <p className="mt-2 text-sm">{t.planNoHardPrice}</p>
        <ul className="mt-3 space-y-2 text-sm">
          {plans.map((p) => (
            <li key={p.id}>
              {p.id} · {p.interval} · {p.amountText || t.planPriceUnset}
            </li>
          ))}
        </ul>
        <label className="mt-4 block text-sm font-semibold">
          {t.planSee}
          <input className="field mt-1" value={note} onChange={(e) => setNote(e.target.value)} placeholder="premium | dealer | professional" />
        </label>
        <button
          type="button"
          className="btn-ghost mt-2 w-full"
          onClick={() => {
            const [planId, ...rest] = note.trim().split(/\s+/);
            const amount = rest.join(" ");
            if (planId !== "premium" && planId !== "dealer" && planId !== "professional") return;
            void fetch("/api/admin/billing", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ kind: "plan", planId, amount }),
            }).then(() => {
              setNote("");
              reload();
            });
          }}
        >
          {t.adminSave}
        </button>
        <button
          type="button"
          className="btn-primary mt-2 w-full"
          onClick={() => {
            void fetch("/api/admin/billing", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ kind: "payment", note: note || "recorded" }),
            }).then(() => {
              setNote("");
              reload();
            });
          }}
        >
          {t.adminSave}
        </button>
        <ul className="mt-4 space-y-2 text-sm">
          {subscriptions.map((row) => (
            <li key={row.id}>
              {row.planId} · {row.email} · {row.status}
            </li>
          ))}
          {items.map((row) => (
            <li key={row.id}>
              {row.kind} · {row.amount || "—"} · {row.note}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (section === "complaints") {
    const items = (data.items || []) as { id: string; body: string; status: string; createdAt: string }[];
    return (
      <ul className="space-y-3">
        {items.map((row) => (
          <li key={row.id} className="panel p-3">
            <p className="text-sm">{row.body}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">{row.status}</p>
            <div className="mt-2 flex gap-2">
              {(["open", "review", "closed"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  className="btn-ghost min-h-10 px-3 text-xs"
                  onClick={() => {
                    void fetch("/api/admin/complaints", {
                      method: "PATCH",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({ id: row.id, status }),
                    }).then(reload);
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (section === "analytics") {
    const counts = (data.counts || {}) as Record<string, number>;
    const conversion = (data.conversion || {}) as Record<string, number>;
    const features = (data.features || {}) as Record<string, number>;
    const dropOff = (data.dropOff || []) as { step: string; count: number }[];
    return (
      <div>
        <p className="text-sm leading-relaxed text-[var(--muted)]">{hint}</p>
        <p className="mt-2 text-sm font-semibold">
          Third-party: {String(data.thirdParty)} · personal data: {String(data.personal)}
        </p>
        <ul className="mt-3 space-y-1 text-sm">
          <li>Property checks started: {counts.check_started ?? 0}</li>
          <li>Property checks completed: {counts.check_completed ?? 0}</li>
          <li>Document uploads: {counts.document_uploaded ?? 0}</li>
          <li>Reports generated: {counts.report_generated ?? 0}</li>
          <li>Verification requests: {counts.verification_requested ?? 0}</li>
          <li>Dealer usage: {counts.dealer_used ?? 0}</li>
          <li>Conversion: {conversion.rate ?? 0}%</li>
        </ul>
        <p className="mt-4 text-sm font-semibold">Feature usage</p>
        <ul className="mt-1 space-y-1 text-sm">
          {Object.keys(features).length ? (
            Object.entries(features).map(([k, v]) => (
              <li key={k}>
                {k}: {v}
              </li>
            ))
          ) : (
            <li className="text-[var(--muted)]">—</li>
          )}
        </ul>
        <p className="mt-4 text-sm font-semibold">Drop-off points</p>
        <ul className="mt-1 space-y-1 text-sm">
          {dropOff.length ? (
            dropOff.map((row) => (
              <li key={row.step}>
                {row.step}: {row.count}
              </li>
            ))
          ) : (
            <li className="text-[var(--muted)]">—</li>
          )}
        </ul>
      </div>
    );
  }

  if (section === "audit") {
    const items = (data.items || []) as { ts: string; action: string; ok: boolean; subject?: string }[];
    return (
      <ul className="space-y-2 text-sm">
        {items.map((row, i) => (
          <li key={`${row.ts}-${i}`}>
            {row.ts.slice(11, 19)} · {row.action} · {row.ok ? "ok" : "fail"} {row.subject || ""}
          </li>
        ))}
      </ul>
    );
  }

  const items = (data.items || data.pages || data.professionals || []) as Record<string, unknown>[];
  return (
    <div>
      {hint ? <p className="mb-3 text-sm text-[var(--muted)]">{hint}</p> : null}
      {items.length === 0 ? <p className="text-[var(--muted)]">{t.adminEmpty}</p> : null}
      <ul className="space-y-2">
        {items.map((row, i) => (
          <li key={String(row.id || i)} className="panel p-3 text-sm">
            <p className="font-semibold">{String(row.headline || row.email || row.id || "")}</p>
            <p className="mt-1 text-[var(--muted)]">
              {[row.city, row.area, row.verdict, row.infoStatus, row.kind].filter(Boolean).join(" · ")}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
