let calls = 0;

export function recordLlmCall(): void {
  calls += 1;
}

export function llmCallCount(): number {
  return calls;
}
