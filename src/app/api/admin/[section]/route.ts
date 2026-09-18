import { NextResponse } from "next/server";
import { z } from "zod";
import { isStaffOk, requireStaff } from "@/lib/server/staffAuth";
import { audit, clientIp, listAudit } from "@/lib/server/audit";
import { listUsers, loadUser, saveUser, applyOwnerBootstrap } from "@/lib/server/users";
import {
  STAFF_PACKS,
  STAFF_SCOPES,
  effectiveScopes,
  hasGrant,
  isOwner,
  isStaffGrant,
  publicStaffUser,
  type StaffGrant,
  type StaffScope,
} from "@/lib/server/grants";
import { listSharedChecks, persistenceLabel } from "@/lib/server/checksStore";
import { hasDuplicate, isFlagged, needsVerify, propertyCard } from "@/lib/server/adminView";
import { listComplaints, newComplaint, saveComplaint } from "@/lib/server/complaints";
import { listBilling, newBilling, saveBilling } from "@/lib/server/billing";
import { isPlanId } from "@/lib/billing/catalog";
import { loadPlanCatalog, listSubscriptions, newSubscription, savePlanPrice, saveSubscription } from "@/lib/billing/store";
import { isRole } from "@/lib/server/roles";
import { llmExplainConfigured } from "@/lib/ai/llm";
import { llmCallCount } from "@/lib/server/aiUsage";
import { analyticsSummary } from "@/lib/analytics/store";
import { withSafeErrors } from "@/lib/errors/http";

const SECTIONS = [
  "overview",
  "users",
  "dealers",
  "properties",
  "reports",
  "documents",
  "verify",
  "flags",
  "duplicates",
  "billing",
  "complaints",
  "audit",
  "analytics",
  "ai",
  "health",
] as const;

type Section = (typeof SECTIONS)[number];

function asSection(raw: string): Section | null {
  return (SECTIONS as readonly string[]).includes(raw) ? (raw as Section) : null;
}

function scopeFor(section: Section): StaffScope {
  if (section === "overview") return "health";
  return section;
}

async function getAdmin(req: Request, { params }: { params: Promise<{ section: string }> }) {
  const section = asSection((await params).section);
  if (!section) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const gate = await requireStaff(req, section === "overview" ? undefined : scopeFor(section));
  if (!isStaffOk(gate)) return gate.error;

  const checks = await listSharedChecks();
  const cards = checks.map(propertyCard);

  if (section === "overview") {
    const scopes = effectiveScopes(gate.user);
    const counts: Record<string, number> = {};
    if (hasGrant(gate.user, "users")) counts.users = (await listUsers()).length;
    if (hasGrant(gate.user, "properties") || hasGrant(gate.user, "reports")) counts.properties = cards.length;
    if (hasGrant(gate.user, "flags")) counts.flags = checks.filter(isFlagged).length;
    if (hasGrant(gate.user, "verify")) counts.verify = checks.filter(needsVerify).length;
    if (hasGrant(gate.user, "duplicates")) counts.duplicates = checks.filter(hasDuplicate).length;
    if (hasGrant(gate.user, "dealers")) counts.dealers = (await listUsers()).filter((u) => u.role === "professional").length;
    if (hasGrant(gate.user, "complaints")) counts.complaints = (await listComplaints()).length;
    if (hasGrant(gate.user, "billing")) counts.billing = (await listBilling()).length;
    if (hasGrant(gate.user, "analytics")) {
      const a = await analyticsSummary();
      counts.checksStarted = a.counts.check_started;
      counts.checksCompleted = a.counts.check_completed;
    }
    return NextResponse.json({
      ok: true,
      scopes,
      owner: isOwner(gate.user),
      packs: STAFF_PACKS,
      counts,
      llm: false,
      officialVerification: 0,
    });
  }

  if (section === "users") {
    const users = await listUsers();
    return NextResponse.json({ users: users.map(publicStaffUser), packs: isOwner(gate.user) ? STAFF_PACKS : undefined });
  }

  if (section === "dealers") {
    const pros = (await listUsers()).filter((u) => u.role === "professional").map(publicStaffUser);
    return NextResponse.json({
      professionals: pros,
      pages: cards.filter((c) => c.foundVia === "dealer"),
      hint: "Dealer pages on phones are not a CRM. This list is shared JSON only.",
    });
  }

  if (section === "properties") {
    return NextResponse.json({ items: cards, papers: "not_stored" });
  }

  if (section === "reports") {
    return NextResponse.json({
      items: cards.map((c) => ({
        id: c.id,
        createdAt: c.createdAt,
        headline: c.headline,
        verdict: c.verdict,
        infoStatus: c.infoStatus,
        officialVerification: 0,
      })),
    });
  }

  if (section === "documents") {
    return NextResponse.json({
      items: cards.map((c) => ({ id: c.id, createdAt: c.createdAt, papers: c.papers })),
      storedOnServer: false,
      hint: "Paper photos stay on the phone. Admin sees kinds and field counts only.",
    });
  }

  if (section === "verify") {
    return NextResponse.json({
      items: cards.filter((_, i) => needsVerify(checks[i])),
      hint: "Staff cannot mark a property legally verified. Official verification through this platform stays 0.",
    });
  }

  if (section === "flags") {
    return NextResponse.json({
      items: cards.filter((_, i) => isFlagged(checks[i])),
      hint: "High attention — not a finding of fraud.",
    });
  }

  if (section === "duplicates") {
    return NextResponse.json({
      items: cards.filter((_, i) => hasDuplicate(checks[i])),
      hint: "Possible similar pages. Several dealers may share one plot. Not an accusation.",
    });
  }

  if (section === "billing") {
    return NextResponse.json({
      items: await listBilling(),
      subscriptions: await listSubscriptions(),
      plans: await loadPlanCatalog(),
      processor: false,
      hint: "Configurable plans. No card processor and not a marketplace. Amounts come from configuration, not from code.",
    });
  }

  if (section === "complaints") {
    return NextResponse.json({ items: await listComplaints() });
  }

  if (section === "audit") {
    return NextResponse.json({ items: await listAudit(80) });
  }

  if (section === "analytics") {
    const summary = await analyticsSummary();
    return NextResponse.json({
      ...summary,
      thirdParty: false,
      personal: false,
      hint: "First-party counts only. No names, emails, CNICs, papers, notes, GPS, or share keys. No Google Analytics.",
    });
  }

  if (section === "ai") {
    return NextResponse.json({
      llm: llmExplainConfigured(),
      llmRequired: false,
      calls: llmCallCount(),
      embeddings: false,
      pipeline: ["ocr", "parser", "structured", "validation", "risk", "explain"],
      hint: "OCR → parser → structured data → validation rules → risk engine → optional LLM explanation. The app does not need a model. A model may only restate cited evidence. It cannot invent a verdict, a price, or fraud.",
    });
  }

  return NextResponse.json({
    ok: true,
    service: "propertycheck-pakistan",
    persistence: persistenceLabel(),
    pwa: true,
    flutter: false,
    llm: false,
    officialVerification: 0,
    users: (await listUsers()).length,
    sharedChecks: checks.length,
  });
}

export const GET = withSafeErrors("admin_get", getAdmin);

const userPatch = z.object({
  disabled: z.boolean().optional(),
  pack: z.string().optional(),
  grants: z.array(z.string()).optional(),
  role: z.enum(["member", "professional", "staff"]).optional(),
});

const billingPost = z.object({
  kind: z.enum(["subscription", "payment", "plan"]),
  email: z.string().max(120).optional(),
  amount: z.string().max(40).optional(),
  note: z.string().max(500).optional(),
  planId: z.enum(["premium", "dealer", "professional"]).optional(),
});

const complaintPost = z.object({
  body: z.string().min(4).max(2000),
  checkId: z.string().max(32).optional(),
  email: z.string().max(120).optional(),
});

async function postAdmin(req: Request, { params }: { params: Promise<{ section: string }> }) {
  const section = asSection((await params).section);
  if (!section) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const gate = await requireStaff(req, scopeFor(section), { mutate: true });
  if (!isStaffOk(gate)) return gate.error;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (section === "billing") {
    const parsed = billingPost.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
    const body = parsed.data;
    if (body.kind === "plan") {
      if (!body.planId || !isPlanId(body.planId) || body.planId === "free") {
        return NextResponse.json({ error: "invalid" }, { status: 400 });
      }
      await savePlanPrice(body.planId, body.amount || "");
      await audit({ ts: new Date().toISOString(), action: "admin_plan", ok: true, ip: clientIp(req), role: "staff", subject: gate.user.id });
      return NextResponse.json({ ok: true, plans: await loadPlanCatalog() });
    }
    if (body.kind === "subscription") {
      if (!body.planId || !body.email) return NextResponse.json({ error: "invalid" }, { status: 400 });
      const row = newSubscription({ email: body.email, planId: body.planId, note: body.note });
      await saveSubscription(row);
      await audit({ ts: new Date().toISOString(), action: "admin_subscription", ok: true, ip: clientIp(req), role: "staff", subject: gate.user.id });
      return NextResponse.json({ ok: true, id: row.id });
    }
    if (!body.note || body.note.length < 2) return NextResponse.json({ error: "invalid" }, { status: 400 });
    const row = newBilling({ kind: "payment", email: body.email, amount: body.amount, note: body.note });
    await saveBilling(row);
    await audit({ ts: new Date().toISOString(), action: "admin_billing", ok: true, ip: clientIp(req), role: "staff", subject: gate.user.id });
    return NextResponse.json({ ok: true, id: row.id });
  }

  if (section === "complaints") {
    const parsed = complaintPost.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
    const row = newComplaint(parsed.data);
    await saveComplaint(row);
    await audit({ ts: new Date().toISOString(), action: "admin_complaint", ok: true, ip: clientIp(req), role: "staff", subject: gate.user.id });
    return NextResponse.json({ ok: true, id: row.id });
  }

  return NextResponse.json({ error: "method" }, { status: 405 });
}

export const POST = withSafeErrors("admin_post", postAdmin);

async function patchAdmin(req: Request, { params }: { params: Promise<{ section: string }> }) {
  const section = asSection((await params).section);
  if (section !== "users" && section !== "complaints") {
    return NextResponse.json({ error: "method" }, { status: 405 });
  }
  const gate = await requireStaff(req, scopeFor(section), { mutate: true });
  if (!isStaffOk(gate)) return gate.error;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (section === "complaints") {
    const parsed = z.object({ id: z.string().min(8).max(32), status: z.enum(["open", "review", "closed"]), note: z.string().max(400).optional() }).safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
    const { loadComplaint } = await import("@/lib/server/complaints");
    const row = await loadComplaint(parsed.data.id);
    if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const next = { ...row, status: parsed.data.status, note: parsed.data.note ?? row.note };
    await saveComplaint(next);
    await audit({ ts: new Date().toISOString(), action: "admin_complaint_patch", ok: true, ip: clientIp(req), subject: row.id });
    return NextResponse.json({ ok: true });
  }

  const parsed = userPatch.extend({ id: z.string().min(8).max(48) }).safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  if (parsed.data.id === gate.user.id && parsed.data.disabled) {
    return NextResponse.json({ error: "self" }, { status: 400 });
  }
  const target = await loadUser(parsed.data.id);
  if (!target) return NextResponse.json({ error: "not_found" }, { status: 404 });

  let grants: StaffGrant[] | undefined = target.grants;
  if (parsed.data.pack || parsed.data.grants) {
    if (!isOwner(gate.user)) return NextResponse.json({ error: "forbidden", need: "owner" }, { status: 403 });
    if (parsed.data.pack && STAFF_PACKS[parsed.data.pack]) {
      grants = STAFF_PACKS[parsed.data.pack];
    } else if (parsed.data.grants) {
      grants = parsed.data.grants.filter(isStaffGrant);
    }
  }

  let role = target.role;
  if (parsed.data.role) {
    if (!isOwner(gate.user)) return NextResponse.json({ error: "forbidden", need: "owner" }, { status: 403 });
    if (!isRole(parsed.data.role)) return NextResponse.json({ error: "invalid" }, { status: 400 });
    role = parsed.data.role;
    if (role !== "staff") grants = [];
  }

  const next = {
    ...target,
    role,
    grants: role === "staff" ? grants : [],
    disabled: parsed.data.disabled ?? target.disabled,
  };
  await saveUser(await applyOwnerBootstrap(next));
  await audit({
    ts: new Date().toISOString(),
    action: "admin_user_patch",
    ok: true,
    ip: clientIp(req),
    role: "staff",
    subject: target.id,
    detail: parsed.data.pack || (parsed.data.disabled ? "disabled" : "updated"),
  });
  return NextResponse.json({ ok: true, user: publicStaffUser(next) });
}

export const PATCH = withSafeErrors("admin_patch", patchAdmin);
