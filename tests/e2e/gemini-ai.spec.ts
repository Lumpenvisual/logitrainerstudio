import { test, expect } from "@playwright/test";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  enterWorkspaceFromWelcome,
  loginAsBackOffice,
  skipOnboarding,
} from "./helpers/studio";

test.describe("Gemini AI (Supabase edge)", () => {
  test.beforeEach(async ({ request }) => {
    const loginProbe = await request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    test.skip(!loginProbe.ok(), "Back-office user not available — run npm run seed:back-office");
  });

  test("generates script scenes via Gemini edge function", async ({ page }) => {
    test.setTimeout(180_000);

    await skipOnboarding(page);
    await loginAsBackOffice(page);
    await enterWorkspaceFromWelcome(page);

    const brief = page.locator("textarea").first();
    await brief.fill(
      "30-second promo for a coffee subscription box: morning ritual, fresh beans, free delivery.",
    );

    await page.getByRole("button", { name: /Generate Script|Generar Guión|Générer le Script/i }).click();

    await expect(page.getByText(/\d+ scenes generated|escenas generadas|scènes générées/i)).toBeVisible({
      timeout: 120_000,
    });

    await expect(page.getByText(/Establishing|Interior|Detail|Action|Closing|Transition/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
