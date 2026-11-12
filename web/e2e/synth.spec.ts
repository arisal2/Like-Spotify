import { expect, test } from "@playwright/test";

test("playable synth saves its patch and releases keys", async ({ page }) => {
	await page.goto("/studio/synth");
	await expect(
		page.getByRole("heading", { name: "Make your first sound." }),
	).toBeVisible();
	await page.getByLabel("Waveform").selectOption("sawtooth");
	await page.getByRole("slider", { name: "Filter cutoff" }).fill("1200");
	const c = page.getByRole("button", { name: "C 4, keyboard A" });
	await c.focus();
	await page.keyboard.down("Space");
	await expect(c).toHaveAttribute("aria-pressed", "true");
	await page.keyboard.up("Space");
	await expect(c).toHaveAttribute("aria-pressed", "false");
	await page.keyboard.down("a");
	await expect(c).toHaveAttribute("aria-pressed", "true");
	await page.keyboard.up("a");
	await expect(c).toHaveAttribute("aria-pressed", "false");
	await page.reload();
	await expect(page.getByLabel("Waveform")).toHaveValue("sawtooth");
	await expect(page.getByRole("slider", { name: "Filter cutoff" })).toHaveValue("1200");
	await page.getByRole("button", { name: "Sample library" }).click();
	await expect(page).toHaveURL(/\/$/);
	await expect(page.getByRole("heading", { name: "Make your first sound." })).not.toBeVisible();
});
