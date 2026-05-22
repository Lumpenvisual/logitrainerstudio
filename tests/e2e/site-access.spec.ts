import { test, expect } from "@playwright/test";
import { UNIFIED_EMAIL, UNIFIED_PASSWORD, gotoApp } from "./helpers/studio";

test.describe("Studio access gate", () => {
  test("redirects protected routes to studio login", async ({ page }) => {
    await gotoApp(page, "/");
    await expect(page).toHaveURL(/\/studio\/login/, { timeout: 15_000 });
    await page.getByLabel(/^Correo$|^Email$/i).fill(UNIFIED_EMAIL);
    await page.getByLabel(/^Contraseña$|^Password$/i).fill(UNIFIED_PASSWORD);
    await page.getByRole("button", { name: /Acceder al Studio/i }).click();
    await expect(page).not.toHaveURL(/\/studio\/login$/, { timeout: 30_000 });
  });

  test("unified login grants app access", async ({ page }) => {
    await gotoApp(page, "/studio/login");
    await page.getByLabel(/^Correo$|^Email$/i).fill(UNIFIED_EMAIL);
    await page.getByLabel(/^Contraseña$|^Password$/i).fill(UNIFIED_PASSWORD);
    await page.getByRole("button", { name: /Acceder al Studio/i }).click();
    await expect(page).toHaveURL(/\/studio\/dashboard/, { timeout: 15_000 });
    await gotoApp(page, "/");
    await expect(page.getByText(/New Project|Welcome|Architect/i).first()).toBeVisible({ timeout: 30_000 });
  });
});
