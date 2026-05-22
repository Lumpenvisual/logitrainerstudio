import { test, expect } from "@playwright/test";
import { SITE_PASSWORD, gotoApp } from "./helpers/studio";

test.describe("Studio hub (/studio)", () => {
  test("login → dashboard → production app", async ({ page }) => {
    await gotoApp(page, "/studio/login");
    await expect(page.getByRole("heading", { name: /LogiTrainer/i })).toBeVisible();

    await page.getByLabel(/^Contraseña$|^Password$/i).fill("wrong");
    await page.getByRole("button", { name: /Acceder al Studio/i }).click();
    await expect(page.getByText(/incorrectos|incorrecta|Incorrect/i)).toBeVisible();

    await page.getByLabel(/^Contraseña$|^Password$/i).fill(SITE_PASSWORD);
    await page.getByRole("button", { name: /Acceder al Studio/i }).click();

    await expect(page).toHaveURL(/\/studio\/dashboard/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /LogiTrainer/i }).first()).toBeVisible({
      timeout: 15_000,
    });

    await gotoApp(page, "/");
    await expect(
      page.getByRole("button", { name: /New Project|Nuevo Proyecto|Nouveau Projet/i }).or(
        page.getByText(/Welcome|Untitled|Architect|Bienvenido/i),
      ).first(),
    ).toBeVisible({ timeout: 30_000 });
  });

  test("logout clears session", async ({ page }) => {
    await gotoApp(page, "/studio/login");
    await page.getByLabel(/^Correo$|^Email$/i).fill(process.env.BACK_OFFICE_EMAIL ?? "backoffice@logitrainerstudio.app");
    await page.getByLabel(/^Contraseña$|^Password$/i).fill(SITE_PASSWORD);
    await page.getByRole("button", { name: /Acceder al Studio/i }).click();
    await expect(page).toHaveURL(/\/studio\/dashboard/);

    await page.getByRole("button", { name: /Cerrar sesión/i }).click({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/studio\/login/);

    await gotoApp(page, "/");
    await expect(page).toHaveURL(/\/studio\/login/);
  });
});
