import { expect, test } from "@playwright/test";

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
	await page.getByRole("button", { name: "Sample library" }).click();
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
			const audio = await context.decodeAudioData(
				await (await fetch((element as HTMLAudioElement).src)).arrayBuffer(),
			);
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
