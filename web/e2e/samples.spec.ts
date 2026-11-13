import { expect, test } from "@playwright/test";

function silentWav() {
	const data = Buffer.alloc(44 + 1600);
	data.write("RIFF", 0);
	data.writeUInt32LE(data.length - 8, 4);
	data.write("WAVEfmt ", 8);
	data.writeUInt32LE(16, 16);
	data.writeUInt16LE(1, 20);
	data.writeUInt16LE(1, 22);
	data.writeUInt32LE(8000, 24);
	data.writeUInt32LE(16000, 28);
	data.writeUInt16LE(2, 32);
	data.writeUInt16LE(16, 34);
	data.write("data", 36);
	data.writeUInt32LE(1600, 40);
	return data;
}

function halfToneWav() {
	const data = silentWav();
	for (let index = 0; index < 400; index++)
		data.writeInt16LE(
			Math.round(24000 * Math.sin((2 * Math.PI * 440 * index) / 8000)),
			44 + index * 2,
		);
	return data;
}

test("populated studio fits narrow screens and editor restores focus", async ({
	page,
}) => {
	await page.goto("/");
	await page
		.locator("input[multiple]")
		.setInputFiles({
			name: "layout.wav",
			mimeType: "audio/wav",
			buffer: silentWav(),
		});
	const edit = page.getByRole("button", { name: "Edit layout.wav" });
	await edit.click();
	await expect(page.locator(".sample-editor")).toBeFocused();
	expect(
		await page
			.locator(".sample-editor")
			.evaluate((el) => parseFloat(getComputedStyle(el).paddingLeft)),
	).toBeGreaterThanOrEqual(20);
	await page.getByRole("button", { name: "Close editor" }).click();
	await expect(edit).toBeFocused();
	for (const width of [320, 390, 768, 900, 1440]) {
		await page.setViewportSize({ width, height: 900 });
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth <= innerWidth,
			),
		).toBe(true);
	}
	await page.getByRole("link", { name: "Synthesizer" }).click();
	for (const width of [320, 390, 768, 900, 1440]) {
		await page.setViewportSize({ width, height: 900 });
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth <= innerWidth,
			),
		).toBe(true);
		const keys = page.locator(".synth-key");
		expect(
			await keys.first().evaluate((el) => el.getBoundingClientRect().width),
		).toBeGreaterThanOrEqual(30);
		expect(
			await keys.evaluateAll((nodes) =>
				nodes.every((el) => el.scrollWidth <= el.clientWidth),
			),
		).toBe(true);
	}
	await page.getByLabel("Note to sample").focus();
	await page.keyboard.press("Tab");
	await expect(page.getByLabel("Note length (seconds)")).toBeFocused();
	await page.keyboard.press("Tab");
	await expect(
		page.getByRole("button", { name: "Add to sample editor" }),
	).toBeFocused();
	await page.keyboard.press("Tab");
	await expect(
		page.getByRole("button", { name: "C 4, keyboard A", exact: true }),
	).toBeFocused();
});

test("validate batches, preserve separate sounds, and reset replacement edits", async ({
	page,
}) => {
	await page.goto("/");
	await page.locator("input[multiple]").setInputFiles([
		{ name: "good.wav", mimeType: "audio/wav", buffer: halfToneWav() },
		{
			name: "broken.wav",
			mimeType: "audio/wav",
			buffer: Buffer.from("invalid"),
		},
	]);
	await expect(page.locator(".sample-status").last()).toContainText(
		"broken.wav",
	);
	await expect(page.locator(".sample-track")).toHaveCount(1);
	await page
		.locator("input[multiple]")
		.evaluate((input: HTMLInputElement, bytes) => {
			const data = new DataTransfer();
			data.items.add(new File([new Uint8Array(bytes)], "untyped.wav"));
			input.files = data.files;
			input.dispatchEvent(new Event("change", { bubbles: true }));
		}, Array.from(silentWav()));
	await expect(page.locator(".sample-track")).toHaveCount(2);
	await page.getByRole("button", { name: "Edit good.wav" }).click();
	await expect(page.getByRole("slider", { name: "Trim start" })).toBeVisible();
	await page.getByRole("slider", { name: "Speed", exact: true }).fill("0.5");
	await page.getByRole("slider", { name: "Level", exact: true }).fill("0.4");
	const multiple = await page.evaluateHandle((bytes) => {
		const data = new DataTransfer();
		for (const name of ["one.wav", "two.wav"])
			data.items.add(new File([new Uint8Array(bytes)], name));
		return data;
	}, Array.from(silentWav()));
	await page
		.locator(".sample-editor")
		.dispatchEvent("drop", { dataTransfer: multiple });
	await expect(page.locator(".sample-editor [role=status]")).toContainText(
		"one sound at a time",
	);
	await expect(page.getByLabel("Sample name")).toHaveValue("good.wav");
	await page.locator(".editor-open input").setInputFiles({
		name: "good.wav",
		mimeType: "audio/wav",
		buffer: silentWav(),
	});
	await expect(
		page.getByRole("slider", { name: "Speed", exact: true }),
	).toHaveValue("1");
	await expect(
		page.getByRole("slider", { name: "Level", exact: true }),
	).toHaveValue("1");
	await expect(page.locator(".sample-track")).toHaveCount(2);
});

test("mixer changes survive slow storage and a legacy invalid sample", async ({
	page,
}) => {
	await page.addInitScript(() => {
		const open = IDBFactory.prototype.open;
		IDBFactory.prototype.open = function (
			...args: Parameters<IDBFactory["open"]>
		) {
			const request = open.apply(this, args);
			Object.defineProperty(request, "onsuccess", {
				set(handler) {
					request.addEventListener("success", (event) =>
						setTimeout(() => handler.call(request, event), 100),
					);
				},
			});
			return request;
		};
	});
	await page.goto("/");
	await page.locator("input[multiple]").setInputFiles({
		name: "mix.wav",
		mimeType: "audio/wav",
		buffer: halfToneWav(),
	});
	const volume = page.getByRole("slider", { name: "Volume for mix.wav" });
	const pan = page.getByRole("slider", { name: "Pan for mix.wav" });
	await volume.fill("0.3");
	await pan.fill("0.8");
	// Wait for the actual persisted values, not optimistic UI updates.
	await expect
		.poll(() =>
			page.evaluate(async () => {
				const db = await new Promise<IDBDatabase>((resolve) => {
					const request = indexedDB.open("bedlam-sample-studio", 1);
					request.onsuccess = () => resolve(request.result);
				});
				return new Promise((resolve) => {
					const tx = db.transaction("samples");
					const request = tx.objectStore("samples").getAll();
					tx.oncomplete = () => {
						db.close();
						resolve(
							request.result.map((sample) => [sample.volume, sample.pan]),
						);
					};
				});
			}),
		)
		.toEqual([[0.3, 0.8]]);
	await page.evaluate(async () => {
		const db = await new Promise<IDBDatabase>((resolve) => {
			const request = indexedDB.open("bedlam-sample-studio", 1);
			request.onsuccess = () => resolve(request.result);
		});
		await new Promise<void>((resolve) => {
			const tx = db.transaction("samples", "readwrite");
			tx.objectStore("samples").put({
				id: "legacy-bad",
				name: "legacy.wav",
				album: "My first album",
				audio: new Blob(["bad"]),
				volume: 1,
				pan: 0,
				muted: false,
			});
			tx.oncomplete = () => {
				db.close();
				resolve();
			};
		});
	});
	await page.reload();
	await expect(volume).toHaveValue("0.3");
	await expect(pan).toHaveValue("0.8");
	await page.getByRole("button", { name: "▶ Play mix", exact: true }).click();
	await expect(page.locator(".sample-status").last()).toHaveText(
		"Playing supported samples. Could not decode: legacy.wav.",
	);
});

test("import samples, mix, and restore an album", async ({ page }) => {
	await page.goto("/");
	await page.getByLabel("New album name").fill("Game sounds");
	await page.getByRole("button", { name: "Create", exact: true }).click();
	await page.locator('input[type="file"]').setInputFiles([
		{ name: "kick.wav", mimeType: "audio/wav", buffer: silentWav() },
		{ name: "snare.wav", mimeType: "audio/wav", buffer: silentWav() },
	]);
	await expect(page.getByText("kick.wav", { exact: true })).toBeVisible();
	await expect(page.getByText("snare.wav", { exact: true })).toBeVisible();
	await page.getByRole("button", { name: "Edit kick.wav" }).click();
	await expect(
		page.getByRole("heading", { name: "Cut and shape your sound." }),
	).toBeVisible();
	await page.getByText("Precise trim").click();
	await page.getByLabel("End (seconds)").fill("0.05");
	await page.getByLabel("Sample name").fill("Short kick");
	await page.getByRole("slider", { name: /Speed/ }).fill("0.5");
	await page.getByRole("button", { name: "Preview edit" }).click();
	await expect(page.getByLabel("Edited sample preview")).toBeVisible();
	await expect
		.poll(async () =>
			page
				.getByLabel("Edited sample preview")
				.evaluate((element) => (element as HTMLAudioElement).duration),
		)
		.toBeCloseTo(0.1, 2);
	await page.getByRole("button", { name: "Save edited copy" }).click();
	await expect(page.getByText("Short kick.wav", { exact: true })).toBeVisible();
	await page.getByLabel("Theme").selectOption("cyberpunk");
	await page.getByRole("slider", { name: "Volume for kick.wav" }).fill("0.5");
	await page.getByRole("button", { name: "▶ Play mix" }).click();
	await expect(page.getByText(/Playing samples together/)).toBeVisible();
	await page.getByRole("button", { name: "■ Stop", exact: true }).click();
	await page.reload();
	await expect(page.getByLabel("Theme")).toHaveValue("cyberpunk");
	await page.getByRole("button", { name: "Game sounds" }).click();
	await expect(page.getByText("kick.wav", { exact: true })).toBeVisible();
	await expect(page.getByText("Short kick.wav", { exact: true })).toBeVisible();
	await expect(
		page.getByRole("slider", { name: "Volume for kick.wav" }),
	).toHaveValue("0.5");
});

test("drag waveform handles, preview the cut, and drop another file", async ({
	page,
}) => {
	await page.goto("/");
	await page.locator('input[type="file"]').setInputFiles({
		name: "tap.wav",
		mimeType: "audio/wav",
		buffer: halfToneWav(),
	});
	await page.getByRole("button", { name: "Edit tap.wav" }).click();
	const timeline = page.getByLabel("Audio waveform timeline");
	const start = page.getByRole("slider", { name: "Trim start" });
	const end = page.getByRole("slider", { name: "Trim end" });
	await expect(start).toBeVisible();
	await expect
		.poll(async () =>
			timeline.locator("canvas").evaluate((canvas: HTMLCanvasElement) => {
				const context = canvas.getContext("2d");
				if (!context) return false;
				const { width, height } = canvas;
				const pixels = context.getImageData(0, 0, width, height).data;
				let left = 0;
				let right = 0;
				for (let y = 0; y < height; y++)
					for (let x = 0; x < width; x++) {
						if (pixels[(y * width + x) * 4 + 3] === 0) continue;
						if (x < width / 4) left++;
						if (x >= (width * 3) / 4) right++;
					}
				return left > right * 3;
			}),
		)
		.toBe(true);
	const bounds = await timeline.boundingBox();
	const startBounds = await start.boundingBox();
	const endBounds = await end.boundingBox();
	if (!bounds || !startBounds || !endBounds)
		throw new Error("Waveform did not render");
	await page.mouse.move(
		startBounds.x + startBounds.width / 2,
		startBounds.y + startBounds.height / 2,
	);
	await page.mouse.down();
	await page.mouse.move(
		bounds.x + bounds.width * 0.25,
		bounds.y + bounds.height / 2,
		{ steps: 5 },
	);
	await page.mouse.up();
	await page.mouse.move(
		endBounds.x + endBounds.width / 2,
		endBounds.y + endBounds.height / 2,
	);
	await page.mouse.down();
	await page.mouse.move(
		bounds.x + bounds.width * 0.75,
		bounds.y + bounds.height / 2,
		{ steps: 5 },
	);
	await page.mouse.up();
	await expect
		.poll(async () => Number(await start.getAttribute("aria-valuenow")))
		.toBeCloseTo(0.025, 2);
	await expect
		.poll(async () => Number(await end.getAttribute("aria-valuenow")))
		.toBeCloseTo(0.075, 2);
	await page.getByRole("button", { name: "Preview edit" }).click();
	await expect
		.poll(async () =>
			page
				.getByLabel("Edited sample preview")
				.evaluate((element) => (element as HTMLAudioElement).duration),
		)
		.toBeCloseTo(0.05, 2);
	await page.getByRole("button", { name: "Save edited copy" }).click();
	await expect(page.getByText("tap.wav", { exact: true })).toHaveCount(2);
	await start.focus();
	await page.keyboard.press("ArrowRight");
	await expect
		.poll(async () => Number(await start.getAttribute("aria-valuenow")))
		.toBeGreaterThan(0.025);
	const transfer = await page.evaluateHandle((bytes) => {
		const data = new DataTransfer();
		data.items.add(
			new File([new Uint8Array(bytes)], "replacement.wav", {
				type: "audio/wav",
			}),
		);
		return data;
	}, Array.from(silentWav()));
	await page
		.locator(".sample-editor")
		.dispatchEvent("drop", { dataTransfer: transfer });
	await expect(page.getByLabel("Sample name")).toHaveValue("replacement.wav");
});
