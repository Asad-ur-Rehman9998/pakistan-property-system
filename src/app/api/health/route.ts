import { NextResponse } from "next/server";
import { persistenceLabel } from "@/lib/server/checksStore";
import { llmExplainConfigured } from "@/lib/ai/llm";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "propertycheck-pakistan",
    persistence: persistenceLabel(),
    pwa: true,
    flutter: false,
    llm: llmExplainConfigured(),
    llmRequired: false,
    officialLive: false,
    pipeline: ["ocr", "parser", "structured", "validation", "risk", "explain"],
  });
}
