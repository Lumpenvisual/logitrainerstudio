import { test, expect } from "@playwright/test";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  SITE_PASSWORD,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  enterWorkspaceFromWelcome,
  loginAsBackOffice,
  passSiteGate,
} from "./helpers/studio";

test.describe("Full production flow", () => {
  test("site gate → auth → workspace", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByLabel(/Access password/i)).toBeVisible({ timeout: 10_000 });
    await page.getByLabel(/Access password/i).fill(SITE_PASSWORD);
    await page.getByRole("button", { name: /Enter studio/i }).click();
    await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible({ timeout: 20_000 });

    await page.getByPlaceholder("you@example.com").fill(ADMIN_EMAIL);
    await page.locator('input[type="password"]').first().fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /^sign in$/i }).click();

    await expect(page.getByText(/New Project|Welcome|Architect/i).first()).toBeVisible({ timeout: 30_000 });
  });

  test("API health: Gemini script edge", async ({ request }) => {
    const login = await request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    expect(login.ok()).toBeTruthy();
    const { access_token } = await login.json();

    const res = await request.post(`${SUPABASE_URL}/functions/v1/ai-generate-script`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      data: { brief: "E2E health check brief for a tech product", sceneCount: 2 },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.scenes?.length).toBeGreaterThanOrEqual(1);
    expect(body.error).toBeFalsy();
  });
});
