import { expect, type Page } from "@playwright/test";

export const SITE_PASSWORD = process.env.STUDIO_ACCESS_PASSWORD ?? "LTS-Mayo2026-7kQ!";
export const ADMIN_EMAIL = process.env.BACK_OFFICE_EMAIL ?? "backoffice@logitrainerstudio.app";
export const ADMIN_PASSWORD = process.env.BACK_OFFICE_PASSWORD ?? "LTS-BackOffice-2026!mX";
export const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "https://zghzhfheyawvbdddsybe.supabase.co";
export const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnaHpoZmhleWF3dmJkZGRzeWJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMDc5MTQsImV4cCI6MjA5MzY4MzkxNH0.zrVyby4i1-18JM4eVVXdqQCgfPTwbRE5W_22VeiTQoM";

export async function skipOnboarding(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("lt-onboarding-complete", "true");
  });
}

export async function passSiteGate(page: Page) {
  await page.goto("/studio/login");
  const gate = page.getByLabel(/Contraseña de acceso|Access password/i);
  if (await gate.isVisible({ timeout: 5000 }).catch(() => false)) {
    await gate.fill(SITE_PASSWORD);
    await page.getByRole("button", { name: /Acceder al Studio|Enter studio/i }).click();
    await expect(page).toHaveURL(/\/studio\/dashboard/, { timeout: 15_000 });
  }
  await page.goto("/auth");
}

export async function loginAsBackOffice(page: Page) {
  await passSiteGate(page);
  await expect(page.getByPlaceholder("you@example.com")).toBeVisible({ timeout: 20_000 });
  await page.getByPlaceholder("you@example.com").fill(ADMIN_EMAIL);
  await page.locator('input[type="password"]').first().fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(page.getByText(/Welcome|New Project|Untitled|Architect/i).first()).toBeVisible({
    timeout: 30_000,
  });
}

export async function enterWorkspaceFromWelcome(page: Page) {
  const newProject = page.getByRole("button", { name: /New Project|Nuevo Proyecto|Nouveau Projet/i });
  await expect(newProject).toBeVisible({ timeout: 20_000 });

  const recentProject = page.locator("button.flex-1.text-left").first();

  if (await recentProject.isVisible({ timeout: 12_000 }).catch(() => false)) {
    await recentProject.click();
  } else {
    await newProject.click();
    const createBtn = page.getByRole("button", { name: /Create & Enter|Crear & Entrar|Créer & Entrer/i });
    await expect(createBtn).toBeVisible({ timeout: 10_000 });
    await createBtn.click();
  }

  await expect(page.locator("textarea").first()).toBeVisible({ timeout: 30_000 });
}
