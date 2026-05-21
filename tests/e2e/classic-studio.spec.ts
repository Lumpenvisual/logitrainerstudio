import { test, expect } from "@playwright/test";
import {
  SITE_PASSWORD,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  skipOnboarding,
  passSiteGate,
  loginAsBackOffice,
  enterWorkspaceFromWelcome,
  gotoApp,
  enterClassicStudio,
} from "./helpers/studio";

async function openClassicFromHub(page: import("@playwright/test").Page) {
  await gotoApp(page, "/studio/dashboard");
  const gate = page.getByLabel(/Contraseña de acceso|Access password/i);
  if (await gate.isVisible({ timeout: 4000 }).catch(() => false)) {
    await gate.fill(SITE_PASSWORD);
    await page.getByRole("button", { name: /Acceder al Studio|Enter studio/i }).click();
    await expect(page).toHaveURL(/\/studio\/dashboard/, { timeout: 15_000 });
  }
  const chunkPromise = page.waitForResponse(
    (res) => res.url().includes("classic-studio") && res.status() === 200,
    { timeout: 90_000 },
  );
  await page.getByRole("link", { name: /Studio clásico/i }).click();
  await expect(page).toHaveURL(/\/classic/, { timeout: 20_000 });
  await chunkPromise;
}

test.describe("Classic studio (/classic)", () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page);
    await page.addInitScript(() => {
      localStorage.setItem("logitrainer-onboarded", "true");
    });
  });

  test("site gate → classic app shell loads", async ({ page }) => {
    await loginAsBackOffice(page);
    await enterClassicStudio(page);
  });

  test("hub links to classic studio", async ({ page }) => {
    await passSiteGate(page);
    await openClassicFromHub(page);
    if (page.url().includes("/auth")) {
      await page.getByPlaceholder("you@example.com").fill(ADMIN_EMAIL);
      await page.locator('input[type="password"]').first().fill(ADMIN_PASSWORD);
      await Promise.all([
        page.waitForURL(/\/classic(\?|$)/, { timeout: 30_000 }),
        page.getByRole("button", { name: /^sign in$/i }).click(),
      ]);
      await page.waitForResponse(
        (res) => res.url().includes("classic-studio") && res.status() === 200,
        { timeout: 90_000 },
      );
    }
    await expect(page).toHaveURL(/\/classic(\?|$)/);
  });
});

test.describe("Studio Pro — export panel", () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page);
  });

  test("render export panel opens from workspace", async ({ page }) => {
    await loginAsBackOffice(page);
    await enterWorkspaceFromWelcome(page);
    await page.getByRole("button", { name: /^Render$/i }).click();
    await expect(page.getByText(/Render & Export/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("button", { name: /Render Video|Backup JSON|Render/i }).first()).toBeVisible();
  });
});
