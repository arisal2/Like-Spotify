import type { Sample } from "./sampleStore";

export class SampleMixer {
	private context?: AudioContext;
	private sources = new Set<AudioBufferSourceNode>();
	private generation = 0;

	async play(samples: Sample[]) {
		const generation = ++this.generation;
		this.stopSources();
		this.context ??= new AudioContext();
		const context = this.context;
		if (context.state === "suspended") await context.resume();
		const tracks = samples.filter((sample) => !sample.muted);
		const decoded = await Promise.all(
			tracks.map(async (sample) => ({
				sample,
				buffer: await context.decodeAudioData(await sample.audio.arrayBuffer()),
			})),
		);
		if (generation !== this.generation || context.state === "closed") return;
		const start = context.currentTime + 0.05;
		for (const { sample, buffer } of decoded) {
			const source = context.createBufferSource();
			const gain = context.createGain();
			const pan = context.createStereoPanner();
			const limiter = context.createDynamicsCompressor();
			source.buffer = buffer;
			gain.gain.value =
				Math.max(0, Math.min(1, sample.volume)) / Math.max(1, decoded.length);
			pan.pan.value = Math.max(-1, Math.min(1, sample.pan));
			limiter.threshold.value = -12;
			limiter.ratio.value = 20;
			source
				.connect(gain)
				.connect(pan)
				.connect(limiter)
				.connect(context.destination);
			this.sources.add(source);
			source.onended = () => {
				this.sources.delete(source);
				source.disconnect();
				gain.disconnect();
				pan.disconnect();
				limiter.disconnect();
			};
			source.start(start);
		}
	}
	private stopSources() {
		for (const source of this.sources) source.stop();
		this.sources.clear();
	}
	stop() {
		++this.generation;
		this.stopSources();
	}
	dispose() {
		this.stop();
		const context = this.context;
		this.context = undefined;
		if (context && context.state !== "closed") void context.close();
	}
}
