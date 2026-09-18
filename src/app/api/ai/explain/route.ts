import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/server/rateLimit";
import { assertSafeOrigin } from "@/lib/server/origin";
import { collectPack, explainReport, answerFromEvidence } from "@/lib/ai/explain";
import { maybeLlmRewrite, llmExplainConfigured } from "@/lib/ai/llm";
import { recordLlmCall } from "@/lib/server/aiUsage";
import { examples } from "@/lib/engine/examples";
import { evaluate } from "@/lib/engine/evaluate";
import { emptyAnswers } from "@/types/check";
import { INSUFFICIENT } from "@/lib/ai/types";
import { withSafeErrors } from "@/lib/errors/http";

const schema = z.object({
  question: z.string().max(400).optional(),
  example: z.enum(["urban", "rural", "token", "papers"]).optional(),
});

export async function GET() {
  return NextResponse.json({
    ok: true,
    llm: llmExplainConfigured(),
    llmRequired: false,
    stages: ["ocr", "parser", "structured", "validation", "risk", "explain"],
    insufficient: INSUFFICIENT.en,
  });
}

async function postExplain(req: Request) {
  if (!assertSafeOrigin(req)) {
    return NextResponse.json({ error: "csrf" }, { status: 403 });
  }
  if (!rateLimit("ai-explain", 20, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const answers = parsed.data.example ? examples[parsed.data.example].answers : emptyAnswers();
  const report = parsed.data.example ? examples[parsed.data.example].report : evaluate(answers);
  const local = report.aiExplanation ?? explainReport(answers, report);
  const pack = collectPack(answers, report);

  if (parsed.data.question) {
    return NextResponse.json({
      text: answerFromEvidence(parsed.data.question, pack),
      llm: false,
      llmRequired: false,
    });
  }

  if (!llmExplainConfigured()) {
    return NextResponse.json({ explanation: local, llm: false, llmRequired: false });
  }
  const next = await maybeLlmRewrite(local, pack);
  if (next.llmUsed) recordLlmCall();
  return NextResponse.json({ explanation: next, llm: next.llmUsed, llmRequired: false });
}

export const POST = withSafeErrors("ai_explain", postExplain);
