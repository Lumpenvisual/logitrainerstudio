import { test, expect } from "@playwright/test";
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabasePasswordLogin, unifiedLogin } from "./helpers/studio";

test.describe("Full production flow", () => {
  test("unified login → workspace", async ({ page }) => {
    await unifiedLogin(page, { expectUrl: /\/studio\/dashboard/ });
    await page.goto("/");
    await expect(page.getByText(/New Project|Welcome|Architect/i).first()).toBeVisible({ timeout: 30_000 });
  });

  test("API health: Gemini script edge", async ({ request }) => {
    const login = await supabasePasswordLogin(request);
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
