/**
 * START NOW — inspect first, architect second, then implement incrementally.
 * Do not dump a second app. Do not add features only to look large.
 */

export const START_RULE =
  "First inspect the entire repository. Do not start coding immediately. Deliver architectures, then implement incrementally with a test/security/a11y/performance gate after each major phase.";

export const START_DELIVERABLES = [
  "Current repository analysis",
  "Proposed architecture",
  "Database ERD",
  "API architecture",
  "User journeys",
  "Folder structure",
  "Security model",
  "AI architecture",
  "Offline / PWA strategy",
  "MVP scope",
  "Phase 2 scope",
  "Phase 3 scope",
] as const;

export const PHASE_GATE = [
  "Run tests",
  "Check for errors",
  "Check responsive UI",
  "Check accessibility",
  "Check security",
  "Check performance",
  "Fix issues",
  "Continue",
] as const;

export const ARCHITECTURE_DOC = "docs/ARCHITECTURE.md";

export const MVP_IN_TREE = [
  "src/components/CheckWizard.tsx",
  "src/lib/engine/evaluate.ts",
  "src/lib/docai/pipeline.ts",
  "src/lib/offline/photos.ts",
  "public/sw.js",
  "api/checks/models.py",
  "docs/SCOPE.md",
] as const;
