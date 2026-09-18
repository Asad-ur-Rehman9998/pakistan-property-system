# Testing

Unit, integration, and e2e coverage already lives next to the code. Map: `src/lib/testing/matrix.ts`.

## Unit

| Area | Where |
| --- | --- |
| Risk calculations | `src/lib/engine/risk.test.ts`, `evaluate.test.ts` |
| Document extraction | `src/lib/docai/docai.test.ts` |
| Property calculations | `src/lib/pakistan/money.test.ts`, `area.test.ts`, `src/lib/engine/priceIntel.test.ts` |
| Permissions | `src/lib/server/roles.test.ts`, `admin.test.ts` |
| API validation | `src/lib/api/checkPayload.test.ts` |

## Integration

Authentication, uploads, reports, property workflow, dealer workflow: `src/lib/testing/workflows.test.ts`, `src/e2e/http.test.ts` (live when `E2E_URL` is set). Papers are never stored on the server.

## E2E (`npm run test:e2e`)

Customer: Check Property → Upload Document → Review Information → Generate Report.

Dealer: Add Property → Upload Documents → Generate Report → Share with Customer.

Guest `/check` does not need an account. Reports never say **Verified** unless an official source confirmed it here.
