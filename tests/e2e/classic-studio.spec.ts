import { test, expect } from "@playwright/test";
import { SITE_PASSWORD, skipOnboarding, loginAsBackOffice, enterWorkspaceFromWelcome, gotoApp } from "./helpers/studio";

test.describe("Classic studio (/classic)", () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page);
    await page.addInitScript(() => {
      localStorage.setItem("logitrainer-onboarded", "true");
    });
  });

  test("site gate → classic welcome loads", async ({ page }) => {
    await loginAsBackOffice(page);
    await gotoApp(page, "/classic");
    await expect(page).toHaveURL(/\/classic/, { timeout: 15_000 });
    await expect(page.getByText(/LogiTrainer/i).first()).toBeVisible({ timeout: 30_000 });
  });

  test("hub links to classic studio", async ({ page }) => {
    await gotoApp(page, "/studio/login");
    await page.getByLabel(/Contraseña de acceso/i).fill(SITE_PASSWORD);
    await page.getByRole("button", { name: /Acceder al Studio/i }).click();
    await expect(page.getByText(/Studio clásico/i)).toBeVisible({ timeout: 10_000 });
    await page.getByRole("link", { name: /Studio clásico/i }).first().click();
    await expect(page).toHaveURL(/\/classic/, { timeout: 15_000 });
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
