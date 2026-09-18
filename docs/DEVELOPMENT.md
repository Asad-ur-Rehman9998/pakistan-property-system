# Development process

**Do not immediately generate thousands of lines of code.**

Sequence: inspect the repository → write architectures → then build one phase at a time. Guest `/check` stays account-free. Keep the Next.js PWA. Do not rewrite it onto Vite/React Router. Do not build Flutter until this product is validated. Full START NOW brief: `docs/ARCHITECTURE.md`. Tests: `docs/TESTING.md`. Code quality: `docs/QUALITY.md`. Scope filter: `docs/SCOPE.md` — do not add random features to look large.

This repository already contains phases 3–17. New work extends those folders. It does not start a second app. Do not put the product into one component or one file.

## PHASE 1 — Inspect

Read `README.md`, `package.json`, `src/`, and `api/` before adding code. Stack: Next.js App Router PWA (`src/`), optional Django+Postgres (`api/`), Docker Compose.

## PHASE 2 — Architectures

### Product

Due-diligence / decision-support for ordinary Pakistanis. Not a listing site, CRM, chatbot, marketplace, or document vault. Never mark a property legally **Verified** unless an official source or qualified professional confirmed it through this platform. No invented land-record APIs. Default UI language: Roman Urdu (also Urdu + English).

### Database

Normalized UUID tables in PostgreSQL, owned by Django (`api/checks/models.py`, contract in `src/lib/db/schema.ts`): user, profile, dealer, customer, property, location, document **metadata**, extraction (CNIC last-4 only), verification request, check, risk, comparison, source card, follow-up, visit, report, audit, plan, subscription, payment, notification.

Never store paper photos, share keys, card numbers, or full CNICs. Guests do not need a user row.

### API

Browser talks only to this origin (`connect-src 'self'`):

| Surface | Role |
| --- | --- |
| `/api/auth/*` | Optional login, 2FA, session |
| `/api/checks` | Shared JSON report (not papers) |
| `/api/reviews` | Professional review requests |
| `/api/admin/*` | Permissioned staff desks |
| `/api/billing/*` | Plan catalog / entitlements |
| `/api/ai/explain` | Optional evidence restatement |
| `/api/analytics` | First-party counts, no PII |
| `/v1/*` | Django when `DJANGO_API_URL` is set |

No live government land-record endpoints.

### UI

`src/app` routes, `src/components` screens. One question at a time in the wizard. Quiet Pakistani financial look. Viewports: 360, 390, tablet, laptop, desktop (`src/lib/ui/shell.ts`). Four home CTAs only: check, token, dealer, understand. Final look must be presentable to dealers, buyers, developers, banks, legal professionals, investors, verification partners, and overseas Pakistanis — not a student CRUD project and not a generic AI-generated dashboard (`docs/PRODUCT.md`).

### Security

HTTPS in production. HttpOnly session cookie. CSRF origin check. Rate limits. Audit JSONL. Staff grants (not unlimited). Professional/staff 2FA. Papers encrypted on the phone. Guest errors never show TypeError / 500 phrasing. CSP in `next.config.ts`.

### Folder structure

```
src/app           routes + /api
src/components    wizard, report, dealer, admin
src/lib           engine, docai, i18n, billing, server
api/              Django models + /v1
infra/nginx       reverse proxy
docs/             this process
```

## PHASES 3–17 — Build (already in tree)

| Phase | What | Where |
| ---: | --- | --- |
| 3 | Auth and roles (guest, member, professional, staff) | `src/app/api/auth`, `src/lib/server/roles.ts` |
| 4 | Property-check wizard | `src/components/CheckWizard.tsx` |
| 5 | Document upload (on-device) | `src/components/PaperPhoto.tsx` |
| 6 | OCR / extraction | `src/lib/docai/pipeline.ts` |
| 7 | Consistency engine | `src/lib/docai/compare.ts` |
| 8 | Risk / verification engine | `src/lib/engine/risk.ts` |
| 9 | Report generator | `src/components/ReportView.tsx` |
| 10 | Dealer dashboard (information pages, not CRM) | `src/components/dealer/` |
| 11 | Urdu / Roman Urdu | `src/lib/i18n/dictionary.ts` |
| 12 | Low-bandwidth / PWA | `src/lib/offline`, `public/sw.js` |
| 13 | AI assistant (explain evidence; not a chatbot; LLM optional) | `src/lib/ai` |
| 14 | Admin dashboard (granted desks) | `src/components/admin/` |
| 15 | Billing (configurable plans, no card processor) | `src/lib/billing` |
| 16 | Testing | `docs/TESTING.md`, `npm test`, `scripts/ui-e2e.mjs` |
| 17 | Deployment | `docker compose up --build` |

Machine-readable map: `src/lib/process/phases.ts`.
