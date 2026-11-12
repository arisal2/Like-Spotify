export type Partial = { frequency: number; strength: number };
export type SoundMatch = { partials: Partial[]; duration: number };

/** Estimate prominent frequencies around the loudest moment, then approximate
 * the recording's decay. This is an additive approximation, not source separation. */
export function analyzeSound(
	samples: Float32Array,
	sampleRate: number,
): SoundMatch {
	if (!Number.isFinite(sampleRate) || sampleRate < 8000 || samples.length < 256)
		throw new Error("Recording is too short to analyze.");
	const windowSize = 2048;
	const step = 256;
	const length = Math.min(samples.length, Math.floor(sampleRate * 5));
	let peakEnergy = 0;
	let peakStart = 0;
	const energies: number[] = [];
	for (let start = 0; start < length; start += step) {
		let energy = 0;
		const end = Math.min(start + step, length);
		for (let i = start; i < end; i++) energy += samples[i] * samples[i];
		energy = Math.sqrt(energy / (end - start));
		energies.push(energy);
		if (energy > peakEnergy) {
			peakEnergy = energy;
			peakStart = start;
		}
	}
	if (peakEnergy < 0.0005)
		throw new Error(
			"The recording is too quiet. Try recording closer to the sound.",
		);
	const start = Math.max(
		0,
		Math.min(peakStart - Math.floor(windowSize / 4), length - windowSize),
	);
	const maxBin = Math.min(
		Math.floor((6000 * windowSize) / sampleRate),
		windowSize / 2 - 1,
	);
	const magnitudes: number[] = [];
	for (let bin = 1; bin <= maxBin; bin++) {
		let real = 0;
		let imaginary = 0;
		for (let i = 0; i < windowSize; i++) {
			const value =
				(samples[start + i] ?? 0) *
				(0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (windowSize - 1)));
			const angle = (2 * Math.PI * bin * i) / windowSize;
			real += value * Math.cos(angle);
			imaginary -= value * Math.sin(angle);
		}
		magnitudes[bin] = Math.hypot(real, imaginary);
	}
	const peaks: Partial[] = [];
	for (let bin = 2; bin < maxBin; bin++) {
		if (
			magnitudes[bin] >= (magnitudes[bin - 1] ?? 0) &&
			magnitudes[bin] > (magnitudes[bin + 1] ?? 0)
		)
			peaks.push({
				frequency: (bin * sampleRate) / windowSize,
				strength: magnitudes[bin],
			});
	}
	peaks.sort((a, b) => b.strength - a.strength);
	const partials = peaks.slice(0, 12);
	if (partials.length === 0)
		throw new Error("Could not identify a sound in this recording.");
	const total = partials.reduce((sum, part) => sum + part.strength, 0);
	const peakIndex = Math.floor(peakStart / step);
	let endIndex = peakIndex;
	for (let i = peakIndex; i < energies.length; i++)
		if (energies[i] > peakEnergy * 0.12) endIndex = i;
	return {
		partials: partials.map((part) => ({
			...part,
			strength: part.strength / total,
		})),
		duration: Math.max(
			0.08,
			Math.min(2, ((endIndex - peakIndex + 1) * step) / sampleRate),
		),
	};
}

export async function playSoundMatch(match: SoundMatch): Promise<void> {
	const context = new AudioContext();
	try {
		if (context.state === "suspended") await context.resume();
		const master = context.createGain();
		const now = context.currentTime;
		master.gain.setValueAtTime(0, now);
		master.gain.linearRampToValueAtTime(0.18, now + 0.005);
		master.gain.exponentialRampToValueAtTime(0.0001, now + match.duration);
		master.connect(context.destination);
		for (const partial of match.partials) {
			const oscillator = context.createOscillator();
			const gain = context.createGain();
			oscillator.frequency.value = partial.frequency;
			gain.gain.value = partial.strength;
			oscillator.connect(gain).connect(master);
			oscillator.start(now);
			oscillator.stop(now + match.duration + 0.02);
		}
		await new Promise<void>((resolve) =>
			setTimeout(resolve, (match.duration + 0.1) * 1000),
		);
	} finally {
		await context.close();
	}
}
