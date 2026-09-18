import { describe, expect, it } from "vitest";
import { areasCompare, parseAreaPhrase, toKanal, toMarla } from "./area";

describe("property area calculations", () => {
  it("reads marla and kanal the way papers write them", () => {
    expect(parseAreaPhrase("10 Marla")).toEqual({ amount: 10, unit: "marla" });
    expect(parseAreaPhrase("0.5 kanal")).toEqual({ amount: 0.5, unit: "kanal" });
    expect(toMarla(0.5, "kanal")).toBe(10);
    expect(toKanal(10, "marla")).toBe(0.5);
  });

  it("flags 10 Marla vs 8 Marla as a mismatch, not fraud", () => {
    expect(areasCompare("10 Marla", "8 Marla")).toBe("mismatch");
    expect(areasCompare("10 Marla", "0.5 kanal")).toBe("match");
    expect(areasCompare("10 Marla", "")).toBe("undetermined");
  });
});
