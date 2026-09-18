# PropertyCheck Pakistan

A **property due-diligence and decision-support** platform. The job is to **make property due diligence understandable to ordinary Pakistanis** — not to compete on more property listings.

Especially: rural users, first-time buyers, overseas Pakistanis, small dealers, people with low digital literacy, users who rely on WhatsApp, and people who cannot easily understand property documents.

It is not:

- a listing website
- a real-estate CRM
- a chatbot
- a marketplace
- a generic document vault

It does **not** say a property is legally safe or verified unless an appropriate official source or qualified professional has confirmed that through this platform. There are **no invented APIs** for land records, fard, registry, mutation, NOC, or government databases. When those sources are unavailable the report says **Official verification required.** Slots exist so a real official integration can be added later. **Verified is always 0** until that happens. Overseas Pakistani mode is a decision-support path for buyers abroad — it does **not** certify a power of attorney or identity.

Every finding is labelled as one of:

| Label | Meaning |
| --- | --- |
| Verified | Official office or qualified professional confirmed it here |
| User-provided | The user told us this |
| System-detected | The due-diligence engine inferred it from answers or notes |
| Needs verification | Must be confirmed at an office or by a professional |
| Unknown | Not answered, not seen, or not enough information |

## Who it is for

- Ordinary Pakistanis who need due diligence explained in plain language
- Rural users
- First-time buyers
- Overseas Pakistanis
- Small dealers (an information page for a deal — not more listings)
- People with low digital literacy (one question at a time, large buttons, speak-to-type)
- Users who rely on WhatsApp
- People who cannot easily understand property documents
- Urban society plots, houses, flats, shops, and files
- Rural / agricultural land (khasra, fard, warasat)
- Slow internet (PWA shell cache; the engine runs on the phone). Offline-first: fill a check without a network, see **Saved on this device**, then sync when the net returns. A failed sync stays on the device — answers are not silently dropped.
- Urdu script, Roman Urdu, and English

## Development process

**Do not immediately generate thousands of lines of code.** Inspect the repository first, write the six architectures (product, database, API, UI, security, folder structure), then build in 17 phases. Sequence and file map: [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md). Guest `/check` does not need an account. Keep this Next.js PWA — do not rewrite it onto Vite.

## Testing

Unit, integration, and two e2e journeys (customer check → upload → review → report; dealer add → upload → report → share) are mapped in [`docs/TESTING.md`](docs/TESTING.md). `npm test` and `npm run test:e2e`.

## Code quality

SOLID, DRY, layered services, Zod/DRF validation, env-based secrets, and no one-file dumps: [`docs/QUALITY.md`](docs/QUALITY.md). Map: `src/lib/quality/rules.ts`.

## Environment

Copy [`.env.example`](.env.example) to `.env` locally. Never commit `.env`, API keys, passwords, secret keys, database credentials, or private tokens. Details: [`docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md).

## Final product standard

Presentable to dealers, buyers, developers, banks, legal professionals, investors, verification partners, and overseas Pakistanis — not a student CRUD app or a generic AI dashboard. Contract: [`docs/PRODUCT.md`](docs/PRODUCT.md).

## Scope

**Do not add random features simply to make the application look large.** Every feature must make buying/selling property in Pakistan safer, easier, clearer, or more accessible — otherwise do not build it. [`docs/SCOPE.md`](docs/SCOPE.md).

## START NOW

Inspect first, then architectures (analysis, ERD, API, journeys, security, AI, offline/PWA, MVP / Phase 2 / Phase 3), then incremental build with a quality gate after each phase: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Architecture

The web MVP is a high-quality **PWA**. Flutter is not built until this product is validated.

| Layer | What we use |
| --- | --- |
| Frontend | React, TypeScript, Tailwind CSS, TanStack Query, accessible controls. Hosted by **Next.js** (App Router) so we do not rewrite the working PWA onto Vite/React Router in this pass. The UI is a quiet Pakistani financial/legal look: trust, clarity, speed — no extra gradients, fake 3D, or overloaded dashboards. Layouts are checked at 360px, 390px, tablet, laptop, and desktop. Every report states it is decision support — not legal advice, title certification, ownership certification, or a safety guarantee. |
| Backend | Python, Django, Django REST Framework, PostgreSQL (`api/`). Next.js `/api/checks` is the browser-facing API (`connect-src 'self'`). Set `DJANGO_API_URL` to persist shared reports in Postgres. The schema is **normalized UUID tables** (user, profile, dealer, customer, property, location, document metadata, extraction, verification request, check, risk, comparison, source card, follow-up, visit, report, audit, plan, subscription, payment, notification). Paper photos, share keys, card numbers, and full CNICs are not stored. Plans (free / premium / dealer monthly / professional) are configurable — amounts live in env or `data/billing/plans.json`, not in UI code. |
| AI | On-device OCR → document parser → structured fields → validation rules → risk engine → optional LLM explanation. The PWA does not need a language model. A model may only restate cited evidence (paper, user answers, official source, this database, or a labelled estimate). Missing evidence: “I don't have enough information to determine this.” No LLM verdict. Photos stay encrypted on the phone. Python rule classifier: `/v1/ai/classify/`. |
| Infra | Docker, Docker Compose, Nginx, GitHub Actions, AWS-compatible object storage (MinIO in Compose), PostgreSQL. |

Local Next.js without Django still stores shared links as JSON under `./data/checks`.

## Run locally

```bash
npm install
npm test
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Optional Django API: `cd api && pip install -r requirements.txt && python manage.py migrate && python manage.py runserver 8000`, then set `DJANGO_API_URL=http://127.0.0.1:8000`.

## Production (Docker)

```bash
docker compose up --build
```

Nginx listens on port 80 (`/` → Next.js, `/v1/` → Django). Postgres and MinIO run alongside. MinIO stores shared-check JSON only — never paper photos.

## What the engine checks (examples)

- Token without a written bayana
- No fard / allotment / original file
- Seller name vs papers
- Occupied property (qabza / tenant)
- Court / family dispute
- Unapproved society
- Incomplete warasat
- Agent or mukhtarnama without talking to the owner
- Roman Urdu notes such as “aaj hi token do, sirf cash”

This is **decision support**, not a substitute for a lawyer, patwari, registrar, society transfer office, or development authority.

## Privacy

A check can stay only on the phone. Sharing a link stores a copy so another person can open the report. Do not type CNIC numbers, full home addresses, or bank secrets. Users never see technical errors (500 Internal Server Error, TypeError, undefined, null); they see **Something went wrong. Your information has been saved. Please try again.** Technical detail is written to the staff audit log. Analytics are first-party counts (checks started/completed, uploads, reports, verification requests, dealer usage, conversion, feature usage, drop-off) — no names, emails, CNICs, papers, or third-party trackers. Sample reports are clearly labelled **DEMO DATA — NOT A REAL PROPERTY** (for example Demo Property · DHA Phase 6 · 5 Marla · Rs. 2.40 Crore) and never use real CNICs, paper photos, or phone numbers.
