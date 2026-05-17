import { test, expect } from "@playwright/test";

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "https://logitrainerstudio.vercel.app";

test.describe("Public demo page", () => {
  test("loads video and manifest without site gate", async ({ page }) => {
    await page.goto(`${BASE}/demo`);
    await expect(page.getByRole("heading", { name: /LogiTrainer Studio/i })).toBeVisible({
      timeout: 15_000,
    });
    const video = page.locator("video");
    await expect(video).toBeVisible({ timeout: 10_000 });
    await expect(video).toHaveAttribute("src", /logitrainer-promo\.mp4/);
  });

  test("manifest.json is served", async ({ request }) => {
    const res = await request.get(`${BASE}/demo/logitrainer/manifest.json`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.scenes?.length).toBeGreaterThanOrEqual(1);
    expect(body.videoFile).toBe("logitrainer-promo.mp4");
  });
});
