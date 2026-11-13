import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
	// Inspect rendered bytes directly; nginx deliberately blocks fetch(blob:).
	await page.addInitScript(() => {
		const blobs = new Map<string, Blob>();
		const create = URL.createObjectURL.bind(URL);
		URL.createObjectURL = (value) => {
			const url = create(value);
			if (value instanceof Blob) blobs.set(url, value);
			return url;
		};
		(window as Window & { synthBlobs?: Map<string, Blob> }).synthBlobs = blobs;
	});
});

test("capture overlapping notes and keep separate saved takes", async ({
	page,
}) => {
	await page.addInitScript(() => {
		const create = AudioContext.prototype.createDynamicsCompressor;
		AudioContext.prototype.createDynamicsCompressor = function () {
			const compressor = create.call(this);
			const state = window as Window & { polyAnalyser?: AnalyserNode };
			if (!state.polyAnalyser) {
				const analyser = this.createAnalyser();
				analyser.fftSize = 8192;
				analyser.smoothingTimeConstant = 0;
				compressor.connect(analyser);
				state.polyAnalyser = analyser;
			}
			return compressor;
		};
	});
	await page.goto("/studio/synth");
	await page
		.getByRole("combobox", { name: "Waveform", exact: true })
		.selectOption("sine");
	await page.getByRole("slider", { name: "Filter cutoff" }).fill("10000");
	await page.getByRole("slider", { name: "Attack", exact: true }).fill("0.01");
	await page
		.getByRole("button", { name: "Record phrase", exact: true })
		.click();
	await expect(
		page.getByRole("button", { name: "Add phrase to editor" }),
	).toBeDisabled();
	await page.keyboard.down("a");
	await page.keyboard.down("g");
	const c = page.getByRole("button", { name: "C 4, keyboard A", exact: true });
	const g = page.getByRole("button", { name: "G 4, keyboard G", exact: true });
	await expect(c).toHaveAttribute("aria-pressed", "true");
	await expect(g).toHaveAttribute("aria-pressed", "true");
	const pitches = () =>
		page.evaluate(() => {
			const analyser = (window as Window & { polyAnalyser?: AnalyserNode })
				.polyAnalyser;
			if (!analyser) return [-Infinity, -Infinity];
			const data = new Float32Array(analyser.frequencyBinCount);
			analyser.getFloatFrequencyData(data);
			return [261.63, 392].map((hz) => {
				const bin = Math.round(
					(hz * analyser.fftSize) / analyser.context.sampleRate,
				);
				return Math.max(...data.slice(bin - 2, bin + 3));
			});
		});
	await expect
		.poll(async () => (await pitches()).every((db) => db > -55))
		.toBe(true);
	await page.keyboard.up("a");
	await expect(c).toHaveAttribute("aria-pressed", "false");
	await expect(g).toHaveAttribute("aria-pressed", "true");
	await expect
		.poll(async () => {
			const [cDb, gDb] = await pitches();
			return cDb < -65 && gDb > -55;
		})
		.toBe(true);
	await page.keyboard.up("g");
	await page.getByRole("button", { name: "Stop phrase", exact: true }).click();
	await expect(page.locator(".sound-status")).toContainText("2 notes");
	await page.getByRole("button", { name: "Add phrase to editor" }).click();
	const audio = page.getByLabel("Original sample playback");
	await expect(audio).toBeVisible();
	const rendered = await audio.evaluate(async (element: HTMLAudioElement) => {
		const context = new AudioContext();
		const blob = (
			window as Window & { synthBlobs?: Map<string, Blob> }
		).synthBlobs?.get(element.src);
		if (!blob) throw new Error("Missing rendered phrase bytes");
		const buffer = await context.decodeAudioData(await blob.arrayBuffer());
		const samples = buffer.getChannelData(0);
		const amplitudes = [261.63, 392].map((hz) => {
			let real = 0;
			let imaginary = 0;
			for (let i = 0; i < samples.length; i++) {
				const phase = (2 * Math.PI * hz * i) / buffer.sampleRate;
				real += samples[i] * Math.cos(phase);
				imaginary += samples[i] * Math.sin(phase);
			}
			return (Math.hypot(real, imaginary) * 2) / samples.length;
		});
		await context.close();
		return { duration: buffer.duration, amplitudes };
	});
	expect(rendered.duration).toBeGreaterThan(0.4);
	expect(rendered.amplitudes.every((value) => value > 0.001)).toBe(true);
	await page.getByLabel("Sample name").fill("Take one");
	await page.getByRole("button", { name: "Save edited copy" }).click();
	await expect(page.getByText("Take one.wav", { exact: true })).toBeVisible();
	await page.getByRole("link", { name: "Synthesizer" }).click();
	await page
		.getByRole("button", { name: "Record phrase", exact: true })
		.click();
	await page.keyboard.down("d");
	await page.waitForTimeout(120);
	await page.evaluate(() => window.dispatchEvent(new Event("blur")));
	await page.keyboard.up("d");
	await expect(
		page.getByRole("button", { name: "Stop phrase", exact: true }),
	).toBeDisabled();
	await expect(
		page.getByRole("button", { name: "E 4, keyboard D", exact: true }),
	).toHaveAttribute("aria-pressed", "false");
	await page.getByRole("button", { name: "Add phrase to editor" }).click();
	await page.getByLabel("Sample name").fill("Take two");
	await expect(page.getByRole("slider", { name: "Trim start" })).toBeVisible();
	await page.getByRole("button", { name: "Save edited copy" }).click();
	await expect(page.getByText("Take two.wav", { exact: true })).toBeVisible();
	await page.reload();
	await expect(page.getByText("Take one.wav", { exact: true })).toBeVisible();
	await expect(page.getByText("Take two.wav", { exact: true })).toBeVisible();
});

test("playable synth saves its patch and releases keys", async ({ page }) => {
	await page.addInitScript(() => {
		const create = AudioContext.prototype.createDynamicsCompressor;
		AudioContext.prototype.createDynamicsCompressor = function () {
			const compressor = create.call(this);
			const analyser = this.createAnalyser();
			compressor.connect(analyser);
			(window as Window & { synthAnalyser?: AnalyserNode }).synthAnalyser =
				analyser;
			return compressor;
		};
	});
	await page.goto("/studio/synth");
	await expect(
		page.getByRole("heading", { name: "Make your first sound." }),
	).toBeVisible();
	const keyboard = page.getByLabel("Piano keyboard");
	expect(
		await keyboard.evaluate(
			(element) => element.scrollWidth <= element.clientWidth,
		),
	).toBe(true);
	await page.setViewportSize({ width: 390, height: 844 });
	expect(
		await keyboard.evaluate(
			(element) => element.scrollWidth <= element.clientWidth,
		),
	).toBe(true);
	await page.setViewportSize({ width: 1280, height: 720 });
	await page
		.getByRole("combobox", { name: "Waveform", exact: true })
		.selectOption("harmonics");
	await page.getByLabel("Second oscillator waveform").selectOption("square");
	await page.getByRole("slider", { name: "Oscillator 2 mix" }).fill("0.5");
	await page.getByRole("slider", { name: "Second harmonic" }).fill("0.75");
	await page.getByRole("slider", { name: "Filter LFO depth" }).fill("0.3");
	await page.getByRole("slider", { name: "Distortion drive" }).fill("0.4");
	await page.getByRole("slider", { name: "Filter cutoff" }).fill("1200");
	const c = page.getByRole("button", { name: "C 4, keyboard A" });
	await c.focus();
	await page.keyboard.down("Space");
	await expect(c).toHaveAttribute("aria-pressed", "true");
	await expect
		.poll(() =>
			page.evaluate(() => {
				const analyser = (window as Window & { synthAnalyser?: AnalyserNode })
					.synthAnalyser;
				if (!analyser) return 0;
				const samples = new Float32Array(analyser.fftSize);
				analyser.getFloatTimeDomainData(samples);
				return Math.max(...samples.map(Math.abs));
			}),
		)
		.toBeGreaterThan(0.001);
	await page.keyboard.up("Space");
	await expect(c).toHaveAttribute("aria-pressed", "false");
	await page.keyboard.down("a");
	await expect(c).toHaveAttribute("aria-pressed", "true");
	await page.keyboard.up("a");
	await expect(c).toHaveAttribute("aria-pressed", "false");
	await page.reload();
	await expect(
		page.getByRole("combobox", { name: "Waveform", exact: true }),
	).toHaveValue("harmonics");
	await expect(page.getByLabel("Second oscillator waveform")).toHaveValue(
		"square",
	);
	await expect(
		page.getByRole("slider", { name: "Second harmonic" }),
	).toHaveValue("0.75");
	await expect(page.getByRole("slider", { name: "Filter cutoff" })).toHaveValue(
		"1200",
	);
	await page.getByRole("link", { name: "Sample library" }).click();
	await expect(page).toHaveURL(/\/$/);
	await expect(
		page.getByRole("heading", { name: "Make your first sound." }),
	).not.toBeVisible();
});

test("render a synth note into the sample editor and save it", async ({
	page,
}) => {
	await page.goto("/studio/synth");
	await page
		.getByRole("combobox", { name: "Waveform", exact: true })
		.selectOption("harmonics");
	await page
		.getByRole("combobox", { name: "Note to sample" })
		.selectOption("69");
	await page.getByLabel("Note length (seconds)").fill("0.5");
	await page.getByRole("button", { name: "Add to sample editor" }).click();
	await expect(page).toHaveURL(/\/$/);
	await expect(
		page.getByRole("heading", { name: "Cut and shape your sound." }),
	).toBeVisible();
	await expect(page.getByLabel("Original sample playback")).toBeVisible();
	await expect(page.getByLabel("Sample name")).toHaveValue("Synth A 4");
	await expect
		.poll(async () =>
			page
				.getByLabel("Original sample playback")
				.evaluate((element) => (element as HTMLAudioElement).duration),
		)
		.toBeCloseTo(0.75, 2);
	const peak = await page
		.getByLabel("Original sample playback")
		.evaluate(async (element) => {
			const context = new AudioContext();
			const blob = (
				window as Window & { synthBlobs?: Map<string, Blob> }
			).synthBlobs?.get((element as HTMLAudioElement).src);
			if (!blob) throw new Error("Missing rendered sample bytes");
			const audio = await context.decodeAudioData(await blob.arrayBuffer());
			const samples = audio.getChannelData(0);
			let maximum = 0;
			for (const sample of samples)
				maximum = Math.max(maximum, Math.abs(sample));
			await context.close();
			return maximum;
		});
	expect(peak).toBeGreaterThan(0.001);
	await page.getByText("Precise trim").click();
	await page.getByLabel("End (seconds)").fill("0.4");
	await page.getByRole("button", { name: "Preview edit" }).click();
	await expect(page.getByLabel("Edited sample preview")).toBeVisible();
	await page.getByRole("button", { name: "Save edited copy" }).click();
	await expect(page.getByText("Synth A 4.wav", { exact: true })).toBeVisible();
	await page.reload();
	await expect(page.getByText("Synth A 4.wav", { exact: true })).toBeVisible();
});
