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
  openSuiteViaSidebar,
  expectHomePath,
} from "./helpers/studio";

async function openStudioFromHub(page: import("@playwright/test").Page) {
  await gotoApp(page, "/studio/dashboard");
  const gate = page.getByLabel(/Contraseña de acceso|Access password/i);
  if (await gate.isVisible({ timeout: 4000 }).catch(() => false)) {
    await gate.fill(SITE_PASSWORD);
    await page.getByRole("button", { name: /Acceder al Studio|Enter studio/i }).click();
    await expect(page).toHaveURL(/\/studio\/dashboard/, { timeout: 15_000 });
  }
  await page.getByRole("link", { name: /LogiTrainer Studio/i }).click();
  if (new URL(page.url()).pathname === "/auth") {
    await page.getByPlaceholder("you@example.com").fill(ADMIN_EMAIL);
    await page.locator('input[type="password"]').first().fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /^sign in$/i }).click();
  }
  await expectHomePath(page);
}

test.describe("Production Suite (integrado en Studio Pro)", () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page);
    await page.addInitScript(() => {
      localStorage.setItem("logitrainer-onboarded", "true");
    });
  });

  test("legacy /classic redirect → suite loads", async ({ page }) => {
    await passSiteGate(page);
    await enterClassicStudio(page);
  });

  test("sidebar opens production suite", async ({ page }) => {
    await loginAsBackOffice(page);
    await enterWorkspaceFromWelcome(page);
    await openSuiteViaSidebar(page);
  });

  test("hub opens unified studio", async ({ page }) => {
    await passSiteGate(page);
    await openStudioFromHub(page);
    await expect(
      page.getByRole("button", { name: /New Project|Nuevo Proyecto|Nouveau Projet/i }).or(
        page.getByText(/Welcome|Untitled|Architect|Bienvenido/i),
      ).first(),
    ).toBeVisible({ timeout: 30_000 });
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
