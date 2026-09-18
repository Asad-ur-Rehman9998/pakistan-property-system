/**
 * Code quality contract for PropertyCheck Pakistan.
 * Extend the listed layers. Do not dump a second app or put the whole product in one file.
 */

export const QUALITY_RULE =
  "Follow SOLID, DRY, clean architecture, reusable components, a service layer, proper serializers and API validation, type safety, environment variables, no hardcoded secrets or API keys, no unnecessary dependencies, clear naming, and documentation. Do not put everything into one component or one file.";

export const LAYERS = {
  ui: ["src/components", "src/app"],
  services: ["src/lib/engine", "src/lib/docai", "src/lib/server", "src/lib/billing", "src/lib/ai"],
  validation: ["src/lib/api/checkPayload.ts", "src/lib/api/authPayload.ts"],
  serializers: ["api/checks/serializers.py"],
  env: [".env.example", "src/lib/env/catalog.ts", "src/lib/server/env.ts", "src/lib/server/secret.ts", "docs/ENVIRONMENT.md"],
  docs: ["docs/QUALITY.md", "docs/DEVELOPMENT.md", "docs/TESTING.md", "docs/ENVIRONMENT.md", "README.md"],
} as const;

/** Soft caps — prefer extracting, not growing a monolith. */
export const FILE_SOFT_CAPS = {
  componentLines: 900,
  routeLines: 120,
} as const;

export const FORBIDDEN_IN_SOURCE = [
  "sk-proj-",
  "sk-ant-",
  "AKIA",
  "BEGIN RSA PRIVATE KEY",
  "xoxb-",
] as const;

export const ALLOWED_RUNTIME_DEPS = [
  "@tanstack/react-query",
  "nanoid",
  "next",
  "react",
  "react-dom",
  "tesseract.js",
  "uqr",
  "zod",
] as const;
