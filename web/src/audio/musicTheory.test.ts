import { describe, expect, it } from "vitest";
import { buildChords, buildScale, frequencyForMidi } from "./musicTheory";

describe("music theory", () => {
	it("builds C major notes and diatonic triads", () => {
		const scale = buildScale("C", "major");
		expect(scale.map((note) => note.name)).toEqual([
			"C",
			"D",
			"E",
			"F",
			"G",
			"A",
			"B",
		]);
		expect(buildChords(scale).map((chord) => chord.name)).toEqual([
			"C",
			"Dm",
			"Em",
			"F",
			"G",
			"Am",
			"Bdim",
		]);
		expect(buildChords(scale).map((chord) => chord.roman)).toEqual([
			"I",
			"ii",
			"iii",
			"IV",
			"V",
			"vi",
			"vii°",
		]);
		expect(buildChords(scale)[6].notes.map((note) => note.midi)).toEqual([
			71, 74, 77,
		]);
	});
	it("spells flat and sharp keys correctly", () => {
		expect(buildScale("F", "major").map((note) => note.name)).toEqual([
			"F",
			"G",
			"A",
			"B♭",
			"C",
			"D",
			"E",
		]);
		expect(buildScale("F♯", "major").map((note) => note.name)).toEqual([
			"F♯",
			"G♯",
			"A♯",
			"B",
			"C♯",
			"D♯",
			"E♯",
		]);
		expect(buildScale("A", "minor").map((note) => note.name)).toEqual([
			"A",
			"B",
			"C",
			"D",
			"E",
			"F",
			"G",
		]);
		expect(
			buildChords(buildScale("A", "minor")).map((chord) => chord.roman),
		).toEqual(["i", "ii°", "III", "iv", "v", "VI", "VII"]);
	});
	it("maps concert A to 440 Hz", () => expect(frequencyForMidi(69)).toBe(440));
});
