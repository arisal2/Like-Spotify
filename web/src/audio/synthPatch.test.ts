import { describe, expect, it } from "vitest";
import {
	defaultSynthPatch,
	readSynthPatch,
	synthPatchSchema,
	synthStorageKey,
} from "./synthPatch";

describe("synth patch persistence", () => {
	it("restores a valid patch", () => {
		const patch = { ...defaultSynthPatch, waveform: "square", cutoff: 1200 };
		expect(
			readSynthPatch({
				getItem: (key) =>
					key === synthStorageKey ? JSON.stringify(patch) : null,
			}),
		).toEqual(patch);
	});
	it("falls back safely for invalid data or inaccessible storage", () => {
		expect(readSynthPatch({ getItem: () => "{" })).toEqual(defaultSynthPatch);
		expect(
			readSynthPatch({
				getItem: () => JSON.stringify({ ...defaultSynthPatch, volume: 2 }),
			}),
		).toEqual(defaultSynthPatch);
		expect(
			readSynthPatch({
				getItem: () => {
					throw new Error("denied");
				},
			}),
		).toEqual(defaultSynthPatch);
	});
	it("rejects out-of-range and non-finite settings", () => {
		expect(
			synthPatchSchema.safeParse({ ...defaultSynthPatch, cutoff: Infinity })
				.success,
		).toBe(false);
		expect(
			synthPatchSchema.safeParse({ ...defaultSynthPatch, release: -1 }).success,
		).toBe(false);
	});
});
