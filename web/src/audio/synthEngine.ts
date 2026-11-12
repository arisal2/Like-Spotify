import { synthPatchSchema, type SynthPatch } from "./synthPatch";

type Voice = { oscillator: OscillatorNode; gain: GainNode; note: number };

/** One short-lived voice at a time; audio nodes never enter React state. */
export class SynthEngine {
	private context?: AudioContext;
	private voice?: Voice;
	private generation = 0;

	async noteOn(note: number, input: SynthPatch) {
		if (!Number.isInteger(note) || note < 48 || note > 84) return;
		const patch = synthPatchSchema.parse(input);
		const generation = ++this.generation;
		this.stopVoice();
		this.context ??= new AudioContext();
		const context = this.context;
		if (context.state === "suspended") await context.resume();
		if (generation !== this.generation || context.state === "closed") return;
		const now = context.currentTime;
		const oscillator = context.createOscillator();
		const filter = context.createBiquadFilter();
		const gain = context.createGain();
		const limiter = context.createDynamicsCompressor();
		oscillator.type = patch.waveform;
		oscillator.frequency.value = 440 * 2 ** ((note - 69) / 12);
		filter.type = "lowpass";
		filter.frequency.value = patch.cutoff;
		limiter.threshold.value = -12;
		limiter.knee.value = 0;
		limiter.ratio.value = 20;
		limiter.attack.value = 0.003;
		limiter.release.value = 0.1;
		gain.gain.setValueAtTime(0, now);
		gain.gain.linearRampToValueAtTime(patch.volume, now + patch.attack);
		oscillator
			.connect(filter)
			.connect(gain)
			.connect(limiter)
			.connect(context.destination);
		oscillator.onended = () => {
			oscillator.disconnect();
			filter.disconnect();
			gain.disconnect();
			limiter.disconnect();
		};
		this.voice = { oscillator, gain, note };
		oscillator.start(now);
	}

	noteOff(note: number, release: number) {
		++this.generation;
		if (this.voice?.note !== note) return;
		this.stopVoice(release);
	}

	private stopVoice(release = 0.03) {
		const voice = this.voice;
		const context = this.context;
		this.voice = undefined;
		if (!voice || !context || context.state === "closed") return;
		const now = context.currentTime;
		const duration = Math.max(0.03, Math.min(2, release));
		voice.gain.gain.cancelAndHoldAtTime(now);
		voice.gain.gain.linearRampToValueAtTime(0, now + duration);
		voice.oscillator.stop(now + duration + 0.01);
	}

	dispose() {
		++this.generation;
		this.stopVoice();
		const context = this.context;
		this.context = undefined;
		if (context && context.state !== "closed") void context.close();
	}
}
