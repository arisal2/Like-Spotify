import { synthPatchSchema, type SynthPatch } from "./synthPatch";
import { encodeWav } from "./wav";
import {
	maxPhraseNotes,
	maxPhraseSeconds,
	type SynthNote,
} from "./synthPhrase";

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

function createVoice(
	context: BaseAudioContext,
	note: number,
	patch: SynthPatch,
	now: number,
	output: AudioNode = context.destination,
): Voice {
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
	filter.connect(shaper).connect(gain).connect(limiter).connect(output);
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
	first.start(now);
	second.start(now);
	lfo.start(now);
	return { sources: [first, second, lfo], nodes, gain, note };
}

/** Render the same synth graph used for live notes, including its release tail. */
export async function renderSynthSample(
	note: number,
	input: SynthPatch,
	heldSeconds: number,
): Promise<Blob> {
	if (
		!Number.isInteger(note) ||
		note < 48 ||
		note > 84 ||
		!Number.isFinite(heldSeconds) ||
		heldSeconds < 0.1 ||
		heldSeconds > 5
	)
		throw new Error(
			"Choose a valid note and duration between 0.1 and 5 seconds.",
		);
	const patch = synthPatchSchema.parse(input);
	const sampleRate = 44100;
	const total = heldSeconds + patch.release + 0.05;
	const context = new OfflineAudioContext(
		1,
		Math.ceil(total * sampleRate),
		sampleRate,
	);
	const voice = createVoice(context, note, patch, 0, masterOutput(context));
	releaseOfflineVoice(voice, patch, 0, heldSeconds);
	return encodeWav(await context.startRendering());
}

function releaseOfflineVoice(
	voice: Voice,
	patch: SynthPatch,
	start: number,
	heldSeconds: number,
) {
	let level: number;
	if (heldSeconds < patch.attack)
		level = (patch.volume * heldSeconds) / patch.attack;
	else if (heldSeconds < patch.attack + patch.decay)
		level =
			patch.volume *
			(1 - ((1 - patch.sustain) * (heldSeconds - patch.attack)) / patch.decay);
	else level = patch.volume * patch.sustain;
	const end = start + heldSeconds;
	voice.gain.gain.cancelScheduledValues(end);
	voice.gain.gain.linearRampToValueAtTime(level, end);
	voice.gain.gain.linearRampToValueAtTime(0, end + patch.release);
	for (const source of voice.sources) source.stop(end + patch.release + 0.01);
}

function masterOutput(context: BaseAudioContext) {
	const headroom = context.createGain();
	headroom.gain.value = 0.25;
	const limiter = context.createDynamicsCompressor();
	limiter.threshold.value = -6;
	limiter.ratio.value = 20;
	headroom.connect(limiter).connect(context.destination);
	return headroom;
}

export async function renderSynthPhrase(notes: SynthNote[]): Promise<Blob> {
	if (!notes.length || notes.length > maxPhraseNotes)
		throw new Error("Record a phrase before adding it to the editor.");
	const validated = notes.map((event) => {
		if (
			!Number.isInteger(event.note) ||
			event.note < 48 ||
			event.note > 84 ||
			!Number.isFinite(event.start) ||
			event.start < 0 ||
			!Number.isFinite(event.duration) ||
			event.duration <= 0 ||
			event.start + event.duration > maxPhraseSeconds + 0.001
		)
			throw new Error("Invalid phrase timing or note.");
		return { ...event, patch: synthPatchSchema.parse(event.patch) };
	});
	const total =
		Math.max(
			...validated.map(
				(event) => event.start + event.duration + event.patch.release,
			),
		) + 0.05;
	const context = new OfflineAudioContext(1, Math.ceil(total * 44100), 44100);
	const output = masterOutput(context);
	for (const event of validated) {
		const voice = createVoice(
			context,
			event.note,
			event.patch,
			event.start,
			output,
		);
		releaseOfflineVoice(voice, event.patch, event.start, event.duration);
	}
	return encodeWav(await context.startRendering());
}

/** Polyphonic notes share one context; releasing a key affects only its voice. */
export class SynthEngine {
	private context?: AudioContext;
	private output?: GainNode;
	private voices = new Map<number, Voice>();
	private pending = new Map<number, symbol>();

	async noteOn(note: number, input: SynthPatch) {
		if (!Number.isInteger(note) || note < 48 || note > 84) return;
		const patch = synthPatchSchema.parse(input);
		if (this.voices.has(note) || this.pending.has(note)) return;
		if (this.voices.size + this.pending.size >= 12) return;
		const token = Symbol();
		this.pending.set(note, token);
		this.context ??= new AudioContext();
		const context = this.context;
		try {
			if (context.state === "suspended") await context.resume();
			if (this.pending.get(note) !== token || context.state === "closed")
				return;
			this.output ??= masterOutput(context);
			this.voices.set(
				note,
				createVoice(context, note, patch, context.currentTime, this.output),
			);
		} finally {
			if (this.pending.get(note) === token) this.pending.delete(note);
		}
	}

	noteOff(note: number, release: number) {
		this.pending.delete(note);
		this.stopVoice(note, release);
	}

	private stopVoice(note: number, release = 0.03) {
		const voice = this.voices.get(note);
		const context = this.context;
		this.voices.delete(note);
		if (!voice || !context || context.state === "closed") return;
		const now = context.currentTime;
		const duration = Math.max(0.03, Math.min(2, release));
		voice.gain.gain.cancelAndHoldAtTime(now);
		voice.gain.gain.linearRampToValueAtTime(0, now + duration);
		for (const source of voice.sources) source.stop(now + duration + 0.01);
	}

	dispose() {
		this.pending.clear();
		const voices = [...this.voices.values()];
		for (const note of this.voices.keys()) this.stopVoice(note);
		const context = this.context;
		this.context = undefined;
		this.output = undefined;
		if (context && context.state !== "closed")
			void context.close().then(() => {
				for (const voice of voices)
					for (const node of voice.nodes) node.disconnect();
			});
	}
}
