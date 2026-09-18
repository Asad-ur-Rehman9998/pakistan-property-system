/**
 * Development process for PropertyCheck Pakistan.
 * Inspect first. Architect second. Then build in order.
 * Do not immediately generate thousands of lines of code.
 * Do not rewrite the Next.js PWA onto Vite/React Router. Do not build Flutter in this pass.
 */

export const PROCESS_RULE =
  "Do not immediately generate thousands of lines of code. Inspect the repository, write architectures, then build one phase at a time.";

export const ARCHITECTURES = [
  "product",
  "database",
  "api",
  "ui",
  "security",
  "folders",
] as const;

export type ArchitectureId = (typeof ARCHITECTURES)[number];

export type Phase = {
  id: number;
  title: string;
  /** Existing implementation — extend these, do not duplicate them. */
  paths: string[];
};

export const PHASES: Phase[] = [
  { id: 1, title: "Inspect the repository", paths: ["README.md", "package.json", "src", "api"] },
  {
    id: 2,
    title: "Architectures",
    paths: [
      "docs/DEVELOPMENT.md",
      "src/lib/db/schema.ts",
      "src/lib/ui/shell.ts",
      "next.config.ts",
      "api/checks/models.py",
    ],
  },
  { id: 3, title: "Authentication and user roles", paths: ["src/app/api/auth", "src/lib/server/roles.ts", "src/lib/server/jwt.ts"] },
  { id: 4, title: "Property-check wizard", paths: ["src/components/CheckWizard.tsx", "src/lib/engine/wizard.ts"] },
  { id: 5, title: "Document upload", paths: ["src/components/PaperPhoto.tsx", "src/lib/offline/photos.ts"] },
  { id: 6, title: "OCR / document extraction", paths: ["src/lib/docai/pipeline.ts", "src/lib/docai/extract.ts"] },
  { id: 7, title: "Consistency engine", paths: ["src/lib/docai/compare.ts", "src/lib/docai/consistency.ts"] },
  { id: 8, title: "Risk / verification engine", paths: ["src/lib/engine/risk.ts", "src/lib/engine/evaluate.ts"] },
  { id: 9, title: "Report generator", paths: ["src/components/ReportView.tsx", "src/lib/engine/evaluate.ts"] },
  { id: 10, title: "Dealer dashboard", paths: ["src/components/dealer/DealerDashboard.tsx", "src/lib/dealer"] },
  { id: 11, title: "Urdu / Roman Urdu support", paths: ["src/lib/i18n/dictionary.ts", "src/components/LanguageSwitch.tsx"] },
  { id: 12, title: "Low-bandwidth / PWA mode", paths: ["src/components/LowBwToggle.tsx", "src/lib/offline", "public/sw.js"] },
  { id: 13, title: "AI assistant", paths: ["src/lib/ai", "src/app/api/ai/explain/route.ts", "api/intelligence"] },
  { id: 14, title: "Admin dashboard", paths: ["src/components/admin/AdminDesk.tsx", "src/app/api/admin"] },
  { id: 15, title: "Billing architecture", paths: ["src/lib/billing", "src/app/plans/page.tsx"] },
  {
    id: 16,
    title: "Testing",
    paths: ["src/lib/testing/matrix.ts", "docs/TESTING.md", "scripts/ui-e2e.mjs", ".github/workflows/ci.yml"],
  },
  { id: 17, title: "Deployment", paths: ["docker-compose.yml", "Dockerfile", "infra/nginx"] },
];

/** Cross-cutting quality docs — not a separate build phase. */
export const QUALITY_PATHS = [
  "docs/QUALITY.md",
  "src/lib/quality/rules.ts",
  "src/lib/api/checkPayload.ts",
  "src/lib/api/authPayload.ts",
  "src/lib/server/env.ts",
  "api/checks/serializers.py",
  "docs/ENVIRONMENT.md",
  "src/lib/env/catalog.ts",
  ".env.example",
  "docs/PRODUCT.md",
  "src/lib/ui/standard.ts",
  "docs/SCOPE.md",
  "src/lib/product/rule.ts",
  "docs/ARCHITECTURE.md",
  "src/lib/process/start.ts",
] as const;

export const FOLDER_ROOTS = ["src/app", "src/components", "src/lib", "api", "infra", "docs"] as const;

export function phaseById(id: number): Phase | undefined {
  return PHASES.find((p) => p.id === id);
}

export function isSequential(): boolean {
  return PHASES.every((p, i) => p.id === i + 1);
}
