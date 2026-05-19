import { test, expect } from "@playwright/test";
import { SITE_PASSWORD } from "./helpers/studio";

test.describe("Studio hub (/studio)", () => {
  test("login → dashboard → production app", async ({ page }) => {
    await page.goto("/studio/login");
    await expect(page.getByRole("heading", { name: /LogiTrainer/i })).toBeVisible();

    await page.getByLabel(/Contraseña de acceso/i).fill("wrong");
    await page.getByRole("button", { name: /Acceder al Studio/i }).click();
    await expect(page.getByText(/Contraseña incorrecta/i)).toBeVisible();

    await page.getByLabel(/Contraseña de acceso/i).fill(SITE_PASSWORD);
    await page.getByRole("button", { name: /Acceder al Studio/i }).click();

    await expect(page).toHaveURL(/\/studio\/dashboard/, { timeout: 10_000 });
    await expect(page.getByText(/Sesión activa/i)).toBeVisible();

    if (process.env.PLAYWRIGHT_BASE_URL?.includes("trycloudflare.com")) {
      await page.goto("/auth");
      await expect(page.getByPlaceholder("you@example.com")).toBeVisible({ timeout: 20_000 });
      return;
    }

    await page.goto("/");
    await expect(
      page.getByRole("button", { name: /New Project|Nuevo Proyecto|Nouveau Projet/i }).or(
        page.getByText(/Welcome|Untitled|Architect|Bienvenido/i),
      ).first(),
    ).toBeVisible({ timeout: 30_000 });
  });

  test("logout clears session", async ({ page }) => {
    await page.goto("/studio/login");
    await page.getByLabel(/Contraseña de acceso/i).fill(SITE_PASSWORD);
    await page.getByRole("button", { name: /Acceder al Studio/i }).click();
    await expect(page).toHaveURL(/\/studio\/dashboard/);

    await page.getByRole("button", { name: /Cerrar sesión/i }).click();
    await expect(page).toHaveURL(/\/studio\/login/);

    await page.goto("/");
    await expect(page).toHaveURL(/\/studio\/login/);
  });
});
