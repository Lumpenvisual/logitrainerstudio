import { test, expect } from "@playwright/test";
import { SITE_PASSWORD as ACCESS_PASSWORD } from "./helpers/studio";

test.describe("Studio access gate", () => {
  test("redirects protected routes to studio login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/studio\/login/, { timeout: 15_000 });
    await page.getByLabel(/Contraseña de acceso/i).fill(ACCESS_PASSWORD);
    await page.getByRole("button", { name: /Acceder al Studio/i }).click();
    await expect(page).toHaveURL(/\/studio\/dashboard/);
  });

  test("auth page loads after hub login", async ({ page }) => {
    await page.goto("/studio/login");
    await page.getByLabel(/Contraseña de acceso/i).fill(ACCESS_PASSWORD);
    await page.getByRole("button", { name: /Acceder al Studio/i }).click();
    await page.goto("/auth");
    await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible({ timeout: 20_000 });
  });
});
