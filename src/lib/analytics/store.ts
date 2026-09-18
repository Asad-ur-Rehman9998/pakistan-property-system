import { appendFile, mkdir, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { summarizeEvents, type AnalyticsEvent, type AnalyticsSummary } from "./events";

function analyticsDir() {
  return process.env.ANALYTICS_DIR || path.join(process.cwd(), "data", "analytics");
}

export async function recordAnalytics(events: AnalyticsEvent[]): Promise<void> {
  if (!events.length) return;
  try {
    const dir = analyticsDir();
    await mkdir(dir, { recursive: true });
    const day = (events[0]?.ts || new Date().toISOString()).slice(0, 10);
    const lines = events.map((e) => JSON.stringify(e)).join("\n");
    await appendFile(path.join(dir, `${day}.jsonl`), `${lines}\n`, "utf8");
  } catch {
    /* never fail a user request because the log disk is full */
  }
}

export async function listAnalytics(limit = 4000): Promise<AnalyticsEvent[]> {
  try {
    const names = (await readdir(analyticsDir())).filter((n) => n.endsWith(".jsonl")).sort().reverse();
    const rows: AnalyticsEvent[] = [];
    for (const name of names.slice(0, 14)) {
      const raw = await readFile(path.join(analyticsDir(), name), "utf8");
      for (const line of raw.split("\n").reverse()) {
        if (!line.trim()) continue;
        try {
          rows.push(JSON.parse(line) as AnalyticsEvent);
        } catch {
          /* skip */
        }
        if (rows.length >= limit) return rows;
      }
    }
    return rows;
  } catch {
    return [];
  }
}

export async function analyticsSummary(): Promise<AnalyticsSummary> {
  return summarizeEvents(await listAnalytics());
}
