# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: site-access.spec.ts >> Studio access gate >> auth page loads after access grant
- Location: tests\e2e\site-access.spec.ts:23:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/Welcome back|Sign in/i)
Expected: visible
Timeout: 20000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 20000ms
  - waiting for getByText(/Welcome back|Sign in/i)

```

```yaml
- img
- heading "LogiTrainer Studio" [level=1]
- paragraph: Enter the studio access password to continue.
- text: Access password
- img
- textbox "Access password":
  - /placeholder: ••••••••••••
  - text: LTS-Mayo2026-7kQ!
- button "Enter studio"
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | const ACCESS_PASSWORD = process.env.STUDIO_ACCESS_PASSWORD ?? "LTS-Mayo2026-7kQ!";
  4  | 
  5  | test.describe("Studio access gate", () => {
  6  |   test("blocks app without password and unlocks with correct password", async ({ page }) => {
  7  |     await page.goto("/");
  8  |     await expect(page.getByRole("heading", { name: /LogiTrainer Studio/i })).toBeVisible();
  9  |     await expect(page.getByLabel(/Access password/i)).toBeVisible();
  10 | 
  11 |     await page.getByLabel(/Access password/i).fill("wrong-password");
  12 |     await page.getByRole("button", { name: /Enter studio/i }).click();
  13 |     await expect(page.getByRole("heading", { name: /LogiTrainer Studio/i })).toBeVisible({ timeout: 15_000 });
  14 |     await expect(page).not.toHaveURL(/\/auth/);
  15 | 
  16 |     await page.getByLabel(/Access password/i).fill(ACCESS_PASSWORD);
  17 |     await page.getByRole("button", { name: /Enter studio/i }).click();
  18 | 
  19 |     await expect(page).toHaveURL(/\/auth/, { timeout: 20_000 });
  20 |     await expect(page.getByText(/Welcome back|Sign in/i)).toBeVisible();
  21 |   });
  22 | 
  23 |   test("auth page loads after access grant", async ({ page }) => {
  24 |     await page.goto("/auth");
  25 |     await page.getByLabel(/Access password/i).fill(ACCESS_PASSWORD);
  26 |     await page.getByRole("button", { name: /Enter studio/i }).click();
> 27 |     await expect(page.getByText(/Welcome back|Sign in/i)).toBeVisible({ timeout: 20_000 });
     |                                                           ^ Error: expect(locator).toBeVisible() failed
  28 |   });
  29 | });
  30 | 
```