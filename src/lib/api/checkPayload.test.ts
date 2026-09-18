import { describe, expect, it } from "vitest";
import { makeSavedCheck } from "@/lib/engine/evaluate";
import { emptyAnswers } from "@/types/check";
import { validateSharedCheckJson } from "./checkPayload";

function valid() {
  const saved = makeSavedCheck("payload01abcd", {
    ...emptyAnswers(),
    intent: "buy",
    propertyKind: "plot",
    city: "Lahore",
  });
  return {
    id: saved.id,
    createdAt: saved.createdAt,
    answers: saved.answers,
    report: saved.report,
  };
}

describe("API validation", () => {
  it("accepts a shared report JSON and rejects paper dumps", () => {
    expect(validateSharedCheckJson(valid()).ok).toBe(true);
    const dump = validateSharedCheckJson({ photo: "data:image/png;base64,AAAA" });
    expect(dump.ok).toBe(false);
    if (!dump.ok) expect(dump.error).toBe("papers_stay_on_phone");
  });

  it("rejects a short id, a missing verdict, and overlong notes", () => {
    expect(validateSharedCheckJson({ ...valid(), id: "abc" }).ok).toBe(false);
    const noVerdict = valid();
    delete (noVerdict.report as { verdict?: string }).verdict;
    expect(validateSharedCheckJson(noVerdict).ok).toBe(false);
    const long = valid();
    long.answers = { ...emptyAnswers(), notes: "n".repeat(4001) };
    const longResult = validateSharedCheckJson(long);
    expect(longResult.ok).toBe(false);
    if (!longResult.ok) expect(longResult.error).toBe("too_long");
  });
});
