import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadSharedCheck, saveSharedCheck } from "./checksStore";

describe("shared check store", () => {
  it("writes and reads JSON on the local disk when Django is not configured", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "pc-checks-"));
    const prev = process.env.CHECKS_DIR;
    const prevApi = process.env.DJANGO_API_URL;
    process.env.CHECKS_DIR = dir;
    delete process.env.DJANGO_API_URL;
    const row = {
      id: "storetest01ab",
      createdAt: "2026-08-27T00:00:00.000Z",
      answers: { notes: "" },
      report: { verdict: "wait", hasOfficialVerification: false },
    };
    await saveSharedCheck(row);
    const back = await loadSharedCheck("storetest01ab");
    expect(back?.id).toBe("storetest01ab");
    const raw = await readFile(path.join(dir, "storetest01ab.json"), "utf8");
    expect(JSON.parse(raw).id).toBe("storetest01ab");
    if (prev === undefined) delete process.env.CHECKS_DIR;
    else process.env.CHECKS_DIR = prev;
    if (prevApi === undefined) delete process.env.DJANGO_API_URL;
    else process.env.DJANGO_API_URL = prevApi;
  });
});
