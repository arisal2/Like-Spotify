import { expect, test } from "@playwright/test";

test("explore scales and chords by ear", async ({ page }) => {
	await page.goto("/");
	await page.getByLabel("Theme").selectOption("cyberpunk");
	await page.getByRole("link", { name: "Music theory" }).click();
	await expect(page.locator(".sample-app")).toHaveAttribute(
		"data-theme",
		"cyberpunk",
	);
	await expect(
		page.getByRole("link", { name: "Music theory" }),
	).toHaveAttribute("aria-current", "page");
	await expect(page).toHaveURL(/\/studio\/theory$/);
	await expect(page.getByRole("heading", { name: "C major" })).toBeVisible();
	await page
		.getByRole("button", { name: "Play Dm chord, ii", exact: true })
		.click();
	await expect(page.getByRole("status")).toContainText("D, F, A");
	await page.getByLabel("Key", { exact: true }).selectOption("F");
	await expect(
		page.getByRole("button", { name: "Play B♭, degree 4" }),
	).toBeVisible();
	await page.getByLabel("Key", { exact: true }).selectOption("A");
	await page.getByLabel("Scale", { exact: true }).selectOption("minor");
	await expect(
		page.getByRole("heading", { name: "A natural minor" }),
	).toBeVisible();
	await page.getByRole("button", { name: "Hear scale" }).click();
	await expect(page.getByRole("status")).toContainText("A minor scale");
	await page.getByRole("link", { name: "Synthesizer" }).click();
	await expect(page.getByLabel("Theme")).toHaveValue("cyberpunk");
	await page.reload();
	await expect(page.locator(".sample-app")).toHaveAttribute(
		"data-theme",
		"cyberpunk",
	);
	await expect(
		page.getByRole("heading", { name: "Make your first sound." }),
	).toBeVisible();
});
