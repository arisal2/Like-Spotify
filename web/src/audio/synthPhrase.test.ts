import { describe, expect, it } from "vitest";
import { PhraseRecorder, maxPhraseNotes } from "./synthPhrase";
import { defaultSynthPatch } from "./synthPatch";
import { renderSynthPhrase } from "./synthEngine";

describe("phrase capture", () => {
	it("preserves overlaps, individual releases, and patch snapshots", () => {
		const recorder = new PhraseRecorder(10);
		const patch = { ...defaultSynthPatch };
		recorder.noteOn(60, patch, 10.1);
		recorder.noteOn(64, patch, 10.2);
		patch.volume = 0;
		recorder.noteOff(60, 10.4);
		const notes = recorder.stop(10.7);
		expect(notes.map((event) => event.note)).toEqual([60, 64]);
		expect(notes[0].start).toBeCloseTo(0.1);
		expect(notes[0].duration).toBeCloseTo(0.3);
		expect(notes[1].duration).toBeCloseTo(0.5);
		expect(notes[0].patch.volume).toBe(defaultSynthPatch.volume);
	});
	it("ignores repeat downs and unmatched ups, and caps held notes at 30 seconds", () => {
		const recorder = new PhraseRecorder(0);
		recorder.noteOff(60, 0);
		recorder.noteOn(60, defaultSynthPatch, 1);
		recorder.noteOn(60, defaultSynthPatch, 2);
		const notes = recorder.stop(40);
		expect(notes).toHaveLength(1);
		expect(notes[0]).toMatchObject({ start: 1, duration: 29 });
	});
	it("bounds note count and produces no take for an empty performance", () => {
		const recorder = new PhraseRecorder(0);
		expect(recorder.stop(0)).toEqual([]);
		for (let i = 0; i < maxPhraseNotes; i++) {
			expect(recorder.noteOn(60, defaultSynthPatch, i / 10)).toBe(true);
			recorder.noteOff(60, (i + 0.5) / 10);
		}
		expect(recorder.noteOn(60, defaultSynthPatch, 20)).toBe(false);
		expect(recorder.stop(20)).toHaveLength(maxPhraseNotes);
	});
	it("rejects empty, unbounded, and invalid phrases before allocating audio", async () => {
		await expect(renderSynthPhrase([])).rejects.toThrow("Record a phrase");
		for (const event of [
			{ note: 60, start: 0, duration: 31 },
			{ note: 60, start: -1, duration: 1 },
			{ note: 60, start: 0, duration: Number.NaN },
			{ note: 200, start: 0, duration: 1 },
		])
			await expect(
				renderSynthPhrase([{ ...event, patch: defaultSynthPatch }]),
			).rejects.toThrow("Invalid phrase");
	});
});
