import { expect, type Page } from "@playwright/test";

/** Unified studio credentials (site gate + Supabase). */
export const UNIFIED_EMAIL = process.env.BACK_OFFICE_EMAIL ?? "backoffice@logitrainerstudio.app";
export const UNIFIED_PASSWORD = process.env.STUDIO_ACCESS_PASSWORD ?? "LTS-Mayo2026-7kQ!";
const LEGACY_PASSWORD = process.env.LEGACY_BACK_OFFICE_PASSWORD ?? "LTS-BackOffice-2026!mX";

export async function supabasePasswordLogin(
  request: import("@playwright/test").APIRequestContext,
) {
  for (const password of [UNIFIED_PASSWORD, LEGACY_PASSWORD]) {
    const res = await request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      data: { email: UNIFIED_EMAIL, password },
    });
    if (res.ok()) return res;
  }
  return request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    data: { email: UNIFIED_EMAIL, password: UNIFIED_PASSWORD },
  });
}

/** @deprecated Use UNIFIED_PASSWORD */
export const SITE_PASSWORD = UNIFIED_PASSWORD;
/** @deprecated Use UNIFIED_EMAIL */
export const ADMIN_EMAIL = UNIFIED_EMAIL;
/** @deprecated Use UNIFIED_PASSWORD */
export const ADMIN_PASSWORD = UNIFIED_PASSWORD;

export const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "https://zghzhfheyawvbdddsybe.supabase.co";
export const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnaHpoZmhleWF3dmJkZGRzeWJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMDc5MTQsImV4cCI6MjA5MzY4MzkxNH0.zrVyby4i1-18JM4eVVXdqQCgfPTwbRE5W_22VeiTQoM";

const NAV_OPTS = { waitUntil: "domcontentloaded" as const };

export function expectHomePath(page: Page, timeout = 30_000) {
  return expect.poll(() => new URL(page.url()).pathname, { timeout }).toBe("/");
}

export async function gotoApp(page: Page, path: string) {
  await page.goto(path, NAV_OPTS);
}

export async function skipOnboarding(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("lt-onboarding-complete", "true");
  });
}

/** Single login: hub gate + Supabase session. */
export async function unifiedLogin(page: Page, opts?: { expectUrl?: RegExp }) {
  await gotoApp(page, "/studio/login");
  const emailField = page.getByLabel(/^Correo$|^Email$/i);
  if (await emailField.isVisible({ timeout: 8000 }).catch(() => false)) {
    await emailField.fill(UNIFIED_EMAIL);
    await page.getByLabel(/^Contraseña$|^Password$/i).fill(UNIFIED_PASSWORD);
    await page.getByRole("button", { name: /Acceder al Studio|Enter studio/i }).click();
    if (opts?.expectUrl) {
      await expect(page).toHaveURL(opts.expectUrl, { timeout: 30_000 });
    } else {
      await expect(page).not.toHaveURL(/\/studio\/login$/, { timeout: 30_000 });
    }
  }
}

export async function passSiteGate(page: Page) {
  await unifiedLogin(page);
}

export async function loginAsBackOffice(page: Page) {
  await unifiedLogin(page, { expectUrl: /\/studio\/dashboard/ });
  await gotoApp(page, "/");
  await expect(page.getByText(/Welcome|New Project|Untitled|Architect/i).first()).toBeVisible({
    timeout: 30_000,
  });
}

async function openSuiteViaSidebar(page: Page) {
  const chunkPromise = page
    .waitForResponse((res) => res.url().includes("classic-studio") && res.status() === 200, {
      timeout: 90_000,
    })
    .catch(() => null);
  const suiteBtn = page.getByRole("button", { name: /Production Suite/i });
  await suiteBtn.click({ timeout: 30_000 });
  await chunkPromise;
  await expect(page.locator("header").getByText(/LogiTrainer/i).first()).toBeVisible({
    timeout: 60_000,
  });
}

/** Production Suite integrado (vista `suite` en Studio Pro). */
export async function enterClassicStudio(page: Page) {
  await gotoApp(page, "/classic");
  await expect
    .poll(() => new URL(page.url()).pathname, { timeout: 20_000 })
    .not.toBe("/classic");

  const path = new URL(page.url()).pathname;
  if (path === "/studio/login" || path === "/auth") {
    await unifiedLogin(page, { expectUrl: /\// });
  }

  await expectHomePath(page);
  await expect(page.locator("header").getByText(/LogiTrainer/i).first()).toBeVisible({
    timeout: 90_000,
  });
}

export { openSuiteViaSidebar };

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
