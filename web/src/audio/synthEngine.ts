import { synthPatchSchema, type SynthPatch } from "./synthPatch";

type Voice = {
	sources: OscillatorNode[];
	nodes: AudioNode[];
	gain: GainNode;
	note: number;
};

export function distortionCurve(drive: number): Float32Array<ArrayBuffer> {
	const curve = new Float32Array(2048);
	const amount = Math.max(0, Math.min(1, drive));
	const factor = 1 + amount * 19;
	for (let i = 0; i < curve.length; i++) {
		const x = (i / (curve.length - 1)) * 2 - 1;
		curve[i] = amount === 0 ? x : Math.tanh(x * factor) / Math.tanh(factor);
	}
	return curve;
}

/** One voice at a time; audio nodes never enter React state. */
export class SynthEngine {
	private context?: AudioContext;
	private voice?: Voice;
	private generation = 0;
	private pendingNote?: number;

	async noteOn(note: number, input: SynthPatch) {
		if (!Number.isInteger(note) || note < 48 || note > 84) return;
		const patch = synthPatchSchema.parse(input);
		const generation = ++this.generation;
		this.pendingNote = note;
		this.stopVoice();
		this.context ??= new AudioContext();
		const context = this.context;
		if (context.state === "suspended") await context.resume();
		if (generation !== this.generation || context.state === "closed") return;
		this.pendingNote = undefined;
		const now = context.currentTime;
		const first = context.createOscillator();
		const second = context.createOscillator();
		const lfo = context.createOscillator();
		const firstLevel = context.createGain();
		const secondLevel = context.createGain();
		const lfoLevel = context.createGain();
		const filter = context.createBiquadFilter();
		const shaper = context.createWaveShaper();
		const gain = context.createGain();
		const limiter = context.createDynamicsCompressor();
		const frequency = 440 * 2 ** ((note - 69) / 12);
		const setWave = (
			oscillator: OscillatorNode,
			wave: SynthPatch["waveform"],
		) => {
			if (wave === "harmonics")
				oscillator.setPeriodicWave(
					context.createPeriodicWave(
						new Float32Array([0, 0, 0, 0]),
						new Float32Array([0, 1, patch.harmonic2, patch.harmonic3]),
					),
				);
			else oscillator.type = wave;
		};
		setWave(first, patch.waveform);
		setWave(second, patch.waveform2);
		first.frequency.value = frequency;
		second.frequency.value = frequency;
		second.detune.value = patch.detune;
		firstLevel.gain.value = 1 - patch.oscMix;
		secondLevel.gain.value = patch.oscMix;
		filter.type = "lowpass";
		filter.frequency.value = patch.cutoff;
		filter.Q.value = patch.resonance;
		lfo.frequency.value = patch.lfoRate;
		lfoLevel.gain.value = Math.min(patch.cutoff * 0.9, 4000) * patch.lfoDepth;
		shaper.curve = distortionCurve(patch.drive);
		limiter.threshold.value = -12;
		limiter.knee.value = 0;
		limiter.ratio.value = 20;
		limiter.attack.value = 0.003;
		limiter.release.value = 0.1;
		gain.gain.setValueAtTime(0, now);
		gain.gain.linearRampToValueAtTime(patch.volume, now + patch.attack);
		gain.gain.linearRampToValueAtTime(
			patch.volume * patch.sustain,
			now + patch.attack + patch.decay,
		);
		first.connect(firstLevel).connect(filter);
		second.connect(secondLevel).connect(filter);
		lfo.connect(lfoLevel).connect(filter.frequency);
		filter
			.connect(shaper)
			.connect(gain)
			.connect(limiter)
			.connect(context.destination);
		const nodes: AudioNode[] = [
			first,
			second,
			lfo,
			firstLevel,
			secondLevel,
			lfoLevel,
			filter,
			shaper,
			gain,
			limiter,
		];
		first.onended = () => {
			for (const node of nodes) node.disconnect();
		};
		this.voice = { sources: [first, second, lfo], nodes, gain, note };
		first.start(now);
		second.start(now);
		lfo.start(now);
	}

	noteOff(note: number, release: number) {
		if (this.pendingNote === note) {
			++this.generation;
			this.pendingNote = undefined;
		}
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
		for (const source of voice.sources) source.stop(now + duration + 0.01);
	}

	dispose() {
		++this.generation;
		this.pendingNote = undefined;
		const voice = this.voice;
		this.stopVoice();
		const context = this.context;
		this.context = undefined;
		if (context && context.state !== "closed")
			void context.close().then(() => {
				if (voice) for (const node of voice.nodes) node.disconnect();
			});
	}
}
