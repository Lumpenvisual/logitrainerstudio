import { test, expect } from "@playwright/test";
import { SITE_PASSWORD as ACCESS_PASSWORD } from "./helpers/studio";

test.describe("Studio access gate", () => {
  test("blocks app without password and unlocks with correct password", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /LogiTrainer Studio/i })).toBeVisible();
    await expect(page.getByLabel(/Access password/i)).toBeVisible();

    await page.getByLabel(/Access password/i).fill("wrong-password");
    await page.getByRole("button", { name: /Enter studio/i }).click();
    await expect(page.getByRole("heading", { name: /LogiTrainer Studio/i })).toBeVisible({ timeout: 15_000 });
    await expect(page).not.toHaveURL(/\/auth/);

    await page.getByLabel(/Access password/i).fill(ACCESS_PASSWORD);
    await page.getByRole("button", { name: /Enter studio/i }).click();

    await expect(page.getByRole("heading", { name: /LogiTrainer Studio/i })).toBeHidden({ timeout: 20_000 });
    await expect(
      page.getByText(/Welcome back|Sign in|Untitled|New project/i).first(),
    ).toBeVisible({ timeout: 20_000 });
  });

  test("auth page loads after access grant", async ({ page }) => {
    await page.goto("/auth");
    await page.getByLabel(/Access password/i).fill(ACCESS_PASSWORD);
    await page.getByRole("button", { name: /Enter studio/i }).click();
    await expect(page.getByRole("heading", { name: /LogiTrainer Studio/i })).toBeHidden({ timeout: 20_000 });
    await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible({ timeout: 20_000 });
  });
});
