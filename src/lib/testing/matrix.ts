/**
 * Required tests for PropertyCheck Pakistan.
 * Extend the files below. Do not spin up a second suite or dump thousands of lines.
 */
export const UNIT = {
  risk: ["src/lib/engine/risk.test.ts", "src/lib/engine/evaluate.test.ts"],
  extraction: ["src/lib/docai/docai.test.ts"],
  property: ["src/lib/pakistan/money.test.ts", "src/lib/pakistan/area.test.ts", "src/lib/engine/priceIntel.test.ts"],
  permissions: ["src/lib/server/roles.test.ts", "src/lib/server/admin.test.ts", "src/lib/billing/billing.test.ts"],
  apiValidation: ["src/lib/api/checkPayload.test.ts", "src/lib/server/security.test.ts"],
} as const;

export const INTEGRATION = {
  authentication: ["src/lib/server/security.test.ts", "src/e2e/http.test.ts"],
  uploads: ["src/lib/server/security.test.ts", "src/lib/testing/workflows.test.ts"],
  reports: ["src/lib/server/checksStore.test.ts", "src/lib/share/sheet.test.ts", "src/e2e/http.test.ts"],
  propertyWorkflow: ["src/lib/engine/wizard.test.ts", "src/lib/testing/workflows.test.ts"],
  dealerWorkflow: ["src/lib/dealer/dealer.test.ts", "src/lib/testing/workflows.test.ts"],
} as const;

export const E2E = {
  customer: {
    steps: ["Check Property", "Upload Document", "Review Information", "Generate Report"] as const,
    script: "scripts/ui-e2e.mjs",
  },
  dealer: {
    steps: ["Add Property", "Upload Documents", "Generate Report", "Share with Customer"] as const,
    script: "scripts/ui-e2e.mjs",
  },
} as const;

export const RUN = {
  unit: "npm test",
  e2e: "npm run test:e2e",
  ci: ".github/workflows/ci.yml",
} as const;
