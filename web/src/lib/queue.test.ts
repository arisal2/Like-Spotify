import { describe, expect, it } from "vitest";
import { formatTime, shuffled } from "./queue";
describe("playback helpers", () => {
  it("shuffles without losing tracks or mutating the original queue", () => {
    const original = [1, 2, 3, 4];
    const result = shuffled(original, () => 0);
    expect(original).toEqual([1, 2, 3, 4]);
    expect([...result].sort()).toEqual(original);
    expect(result).not.toEqual(original);
  });
  it("formats unloaded metadata and track durations", () => {
    expect(formatTime(NaN)).toBe("0:00");
    expect(formatTime(Infinity)).toBe("0:00");
    expect(formatTime(125.9)).toBe("2:05");
  });
});
