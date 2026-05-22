import { test, expect } from "@playwright/test";
import {
  enterWorkspaceFromWelcome,
  supabasePasswordLogin,
  loginAsBackOffice,
  skipOnboarding,
} from "./helpers/studio";

test.describe("Gemini AI (Supabase edge)", () => {
  test.beforeEach(async ({ request }) => {
    const loginProbe = await supabasePasswordLogin(request);
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
