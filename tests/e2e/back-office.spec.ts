import { test, expect } from "@playwright/test";

const SITE_PASSWORD = process.env.STUDIO_ACCESS_PASSWORD ?? "LTS-Mayo2026-7kQ!";
const ADMIN_EMAIL = process.env.BACK_OFFICE_EMAIL ?? "backoffice@logitrainerstudio.app";
const ADMIN_PASSWORD = process.env.BACK_OFFICE_PASSWORD ?? "LTS-BackOffice-2026!mX";

async function passSiteGate(page: import("@playwright/test").Page) {
  await page.goto("/auth");
  const gate = page.getByLabel(/Access password/i);
  if (await gate.isVisible({ timeout: 3000 }).catch(() => false)) {
    await gate.fill(SITE_PASSWORD);
    await page.getByRole("button", { name: /Enter studio/i }).click();
    await expect(page.getByRole("heading", { name: /LogiTrainer Studio/i })).toBeHidden({ timeout: 20_000 });
  }
}

test.describe("Back-office admin", () => {
  test("admin can sign in and reach workspace", async ({ page, request }) => {
    const supabaseUrl = "https://bcobgfxepxmmcheuliai.supabase.co";
    const anonKey =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjb2JnZnhlcHhtbWNoZXVsaWFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5ODI5ODUsImV4cCI6MjA4ODU1ODk4NX0.jiSQ9FJiHgte0GMc4i5W61xRucSGYfU24Z1QK97FO8k";
    const loginProbe = await request.post(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      headers: { apikey: anonKey, "Content-Type": "application/json" },
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    test.skip(
      !loginProbe.ok(),
      "Back-office auth user missing. Run scripts/supabase-back-office-setup.sql in Supabase SQL Editor and create the user in Authentication → Users.",
    );

    await passSiteGate(page);

    await page.getByLabel(/email/i).first().fill(ADMIN_EMAIL);
    await page.getByLabel(/password/i).first().fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByText(/Untitled|Welcome|New project|Architect/i).first()).toBeVisible({
      timeout: 30_000,
    });
  });
});
