import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "https://logitrainerstudio.vercel.app";
const accessPassword = process.env.STUDIO_ACCESS_PASSWORD ?? "LTS-Mayo2026-7kQ!";
const isTunnel =
  baseURL.includes("trycloudflare.com") ||
  baseURL.includes("127.0.0.1") ||
  baseURL.includes("localhost");

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 120_000,
  workers: isTunnel ? 1 : undefined,
  fullyParallel: !isTunnel,
  use: {
    baseURL,
    headless: true,
    navigationTimeout: isTunnel ? 90_000 : 60_000,
    actionTimeout: 30_000,
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:8080",
        reuseExistingServer: true,
        timeout: 60_000,
      },
  metadata: { accessPassword },
});
