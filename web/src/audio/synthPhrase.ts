import type { SynthPatch } from "./synthPatch";

export const maxPhraseSeconds = 30;
export const maxPhraseNotes = 128;
export type SynthNote = {
	note: number;
	start: number;
	duration: number;
	patch: SynthPatch;
};

/** Input timings in seconds; held notes close when the take stops. */
export class PhraseRecorder {
	private held = new Map<number, { start: number; patch: SynthPatch }>();
	private notes: SynthNote[] = [];
	constructor(private readonly origin: number) {}
	noteOn(note: number, patch: SynthPatch, now: number) {
		if (this.held.has(note)) return true;
		if (this.notes.length + this.held.size >= maxPhraseNotes) return false;
		this.held.set(note, {
			start: Math.max(0, now - this.origin),
			patch: { ...patch },
		});
		return true;
	}
	noteOff(note: number, now: number) {
		const held = this.held.get(note);
		if (!held) return;
		this.held.delete(note);
		const end = Math.min(maxPhraseSeconds, Math.max(0, now - this.origin));
		if (end > held.start)
			this.notes.push({ note, ...held, duration: end - held.start });
	}
	stop(now: number): SynthNote[] {
		for (const note of this.held.keys()) this.noteOff(note, now);
		return [...this.notes].sort((a, b) => a.start - b.start);
	}
}
