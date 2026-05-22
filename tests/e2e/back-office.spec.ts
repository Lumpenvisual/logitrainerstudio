import { test, expect } from "@playwright/test";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  loginAsBackOffice,
  supabasePasswordLogin,
  skipOnboarding,
} from "./helpers/studio";

test.describe("Back-office admin", () => {
  test("admin can sign in and reach workspace", async ({ page, request }) => {
    const loginProbe = await supabasePasswordLogin(request);
    test.skip(!loginProbe.ok(), "Back-office user missing — run npm run seed:back-office");

    await skipOnboarding(page);
    await loginAsBackOffice(page);
    await expect(page.getByText(/Untitled|Welcome|New Project|Architect/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
