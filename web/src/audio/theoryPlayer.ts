import { frequencyForMidi } from "./musicTheory";

export class TheoryPlayer {
	private context?: AudioContext;
	private sources = new Set<OscillatorNode>();
	private generation = 0;

	async play(notes: number[], sequence: boolean) {
		if (!notes.length) return;
		const generation = ++this.generation;
		for (const source of this.sources) source.stop();
		this.sources.clear();
		this.context ??= new AudioContext();
		const context = this.context;
		if (context.state === "suspended") await context.resume();
		if (generation !== this.generation || context.state === "closed") return;
		const initial = context.currentTime + 0.03;
		for (const [index, note] of notes.entries()) {
			const start = initial + (sequence ? index * 0.3 : 0);
			const duration = sequence ? 0.27 : 0.8;
			const oscillator = context.createOscillator();
			const gain = context.createGain();
			oscillator.type = "triangle";
			oscillator.frequency.value = frequencyForMidi(note);
			gain.gain.setValueAtTime(0, start);
			gain.gain.linearRampToValueAtTime(
				sequence ? 0.1 : 0.1 / notes.length,
				start + 0.015,
			);
			gain.gain.setValueAtTime(
				sequence ? 0.1 : 0.1 / notes.length,
				start + duration - 0.05,
			);
			gain.gain.linearRampToValueAtTime(0, start + duration);
			oscillator.connect(gain).connect(context.destination);
			this.sources.add(oscillator);
			oscillator.onended = () => {
				this.sources.delete(oscillator);
				oscillator.disconnect();
				gain.disconnect();
			};
			oscillator.start(start);
			oscillator.stop(start + duration + 0.01);
		}
	}

	dispose() {
		++this.generation;
		for (const source of this.sources) source.stop();
		this.sources.clear();
		const context = this.context;
		this.context = undefined;
		if (context && context.state !== "closed") void context.close();
	}
}
