import { test, expect } from "@playwright/test";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  loginAsBackOffice,
  skipOnboarding,
} from "./helpers/studio";

test.describe("Back-office admin", () => {
  test("admin can sign in and reach workspace", async ({ page, request }) => {
    const loginProbe = await request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    test.skip(!loginProbe.ok(), "Back-office user missing — run npm run seed:back-office");

    await skipOnboarding(page);
    await loginAsBackOffice(page);
    await expect(page.getByText(/Untitled|Welcome|New Project|Architect/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
