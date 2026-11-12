export const theoryKeys = [
	"C",
	"G",
	"D",
	"A",
	"E",
	"B",
	"F♯",
	"C♯",
	"F",
	"B♭",
	"E♭",
	"A♭",
	"D♭",
	"G♭",
] as const;
export type TheoryKey = (typeof theoryKeys)[number];
export type ScaleMode = "major" | "minor";
export type ScaleNote = { name: string; midi: number; degree: number };
export type ScaleChord = { name: string; roman: string; notes: ScaleNote[] };

const letters = ["C", "D", "E", "F", "G", "A", "B"];
const naturalPitch = [0, 2, 4, 5, 7, 9, 11];
const scaleSteps: Record<ScaleMode, number[]> = {
	major: [0, 2, 4, 5, 7, 9, 11],
	minor: [0, 2, 3, 5, 7, 8, 10],
};

/** Spell scale notes by letter so F major shows B♭, rather than A♯. */
export function buildScale(key: TheoryKey, mode: ScaleMode): ScaleNote[] {
	const letterIndex = letters.indexOf(key[0]);
	const accidental = key.includes("♯") ? 1 : key.includes("♭") ? -1 : 0;
	const root = (naturalPitch[letterIndex] + accidental + 12) % 12;
	return scaleSteps[mode].map((step, index) => {
		const noteLetter = (letterIndex + index) % 7;
		const target = (root + step) % 12;
		const delta = ((target - naturalPitch[noteLetter] + 18) % 12) - 6;
		const suffix = delta > 0 ? "♯".repeat(delta) : "♭".repeat(-delta);
		return {
			name: letters[noteLetter] + suffix,
			midi: 60 + root + step,
			degree: index + 1,
		};
	});
}

export function buildChords(scale: ScaleNote[]): ScaleChord[] {
	if (scale.length !== 7) throw new Error("A seven-note scale is required.");
	const numerals = ["I", "II", "III", "IV", "V", "VI", "VII"];
	return scale.map((root, degree) => {
		const noteAt = (offset: number): ScaleNote => {
			const index = degree + offset;
			const note = scale[index % 7];
			return { ...note, midi: note.midi + Math.floor(index / 7) * 12 };
		};
		const third = noteAt(2);
		const fifth = noteAt(4);
		const thirdInterval = third.midi - root.midi;
		const fifthInterval = fifth.midi - root.midi;
		const diminished = fifthInterval === 6;
		const minor = thirdInterval === 3;
		const roman =
			(minor ? numerals[degree].toLowerCase() : numerals[degree]) +
			(diminished ? "°" : "");
		return {
			name: root.name + (diminished ? "dim" : minor ? "m" : ""),
			roman,
			notes: [root, third, fifth],
		};
	});
}

export function frequencyForMidi(note: number): number {
	return 440 * 2 ** ((note - 69) / 12);
}
