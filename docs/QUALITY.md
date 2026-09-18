# Code quality

**Do not put everything into one component or one file.**

Map: `src/lib/quality/rules.ts`.

## Rules

| Rule | How this repo does it |
| --- | --- |
| SOLID / DRY | Engines and stores live under `src/lib/*`. UI calls them. Shared Zod schemas in `src/lib/api/`. |
| Clean architecture | `src/app` routes → `src/components` → `src/lib` services → optional Django `api/` |
| Reusable components | Small UI pieces (`BigChoice`, `DemoDataBanner`, share controls). Screens compose them. |
| Service layer | `src/lib/engine`, `docai`, `server`, `billing`, `ai`, `dealer` |
| Serializers | Django DRF: `api/checks/serializers.py`. Browser payloads: Zod in `src/lib/api/` |
| API validation | Reject paper dumps, short ids, CSRF mismatches, weak passwords |
| Type safety | TypeScript strict app; typed Zod infer; Django models with UUID schema policy |
| Environment variables | `.env.example` + `docs/ENVIRONMENT.md`. Secrets via `SESSION_SECRET` / `DJANGO_SECRET_KEY` — never in UI |
| No hardcoded secrets / API keys | Never commit `.env`, API keys, passwords, secret keys, database credentials, or private tokens |
| No unnecessary dependencies | Keep `package.json` lean — engines stay in-repo |
| Clear naming | Roles `guest \| member \| professional \| staff`; findings never invent “Verified” |
| Documentation | `docs/DEVELOPMENT.md`, `docs/TESTING.md`, this file, How-it-works steps |

## Split work

- Wizard UI: `CheckWizard.tsx` — logic stays in `src/lib/engine/wizard.ts`, `evaluate.ts`, `docai/`
- Reports: `ReportView.tsx` + `ShareableSheet.tsx` + engines
- API routes stay thin: validate → service → JSON

Guest `/check` still needs no account. Keep the Next.js PWA.
