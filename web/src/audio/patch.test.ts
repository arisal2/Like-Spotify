import { describe, expect, it } from "vitest";
import { retroCoinPatch, soundPatchSchema } from "./patch";

describe("soundPatchSchema", () => {
  it("round-trips the versioned prototype patch", () => {
    expect(soundPatchSchema.parse(retroCoinPatch)).toEqual(retroCoinPatch);
  });

  it("rejects an envelope longer than its sound", () => {
    expect(() =>
      soundPatchSchema.parse({
        ...retroCoinPatch,
        duration: 0.1,
        attack: 0.08,
        release: 0.08,
      }),
    ).toThrow("Attack and release must fit inside the sound duration");
  });
});
