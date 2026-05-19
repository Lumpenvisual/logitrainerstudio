#!/usr/bin/env node
/**
 * E2E del hub /studio vía túnel Cloudflare (quick o named).
 * Uso:
 *   node scripts/e2e-tunnel.mjs https://xxx.trycloudflare.com
 *   PLAYWRIGHT_BASE_URL=https://studio.logitrainerstudio.com node scripts/e2e-tunnel.mjs
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let base = process.argv[2] || process.env.PLAYWRIGHT_BASE_URL;
if (!base) {
  const urlFile = path.join(root, ".cloudflared", "quick-tunnel-url.txt");
  if (fs.existsSync(urlFile)) {
    base = fs.readFileSync(urlFile, "utf8").trim();
  }
}
if (!base?.startsWith("http")) {
  console.error("Uso: node scripts/e2e-tunnel.mjs <tunnel-base-url>");
  process.exit(1);
}

const env = { ...process.env, PLAYWRIGHT_BASE_URL: base.replace(/\/$/, "") };

console.log("E2E tunnel base:", env.PLAYWRIGHT_BASE_URL);

const child = spawn(
  "npx",
  ["playwright", "test", "tests/e2e/studio-hub.spec.ts", "tests/e2e/site-access.spec.ts", "--reporter=line"],
  { cwd: root, env, stdio: "inherit", shell: true },
);

child.on("exit", (code) => process.exit(code ?? 1));
