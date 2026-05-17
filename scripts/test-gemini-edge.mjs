#!/usr/bin/env node
/** Smoke-test Gemini edge functions (requires .env + back-office user). */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv() {
  // .env.local is gitignored — never commit GEMINI_API_KEY; edge uses Supabase secret
  for (const f of [".env", ".env.local"]) {
    const p = resolve(root, f);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq < 1) continue;
      let v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      process.env[t.slice(0, eq).trim()] = v;
    }
  }
}

loadEnv();

const url = process.env.VITE_SUPABASE_URL;
const anon = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const email = process.env.BACK_OFFICE_EMAIL || "backoffice@logitrainerstudio.app";
const password = process.env.BACK_OFFICE_PASSWORD || "LTS-BackOffice-2026!mX";

if (!url || !anon) {
  console.error("Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY");
  process.exit(1);
}

const login = await fetch(`${url}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: anon, "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
const { access_token } = await login.json();
if (!access_token) {
  console.error("Login failed", await login.text());
  process.exit(1);
}

const headers = { apikey: anon, Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" };

const script = await fetch(`${url}/functions/v1/ai-generate-script`, {
  method: "POST",
  headers,
  body: JSON.stringify({ brief: "Gemini smoke test", sceneCount: 1 }),
});
const scriptBody = await script.json();
console.log(script.ok ? `✓ ai-generate-script (${scriptBody.scenes?.length} scenes)` : `✗ script ${script.status}`, scriptBody.error);

const mkt = await fetch(`${url}/functions/v1/ai-marketing-content`, {
  method: "POST",
  headers,
  body: JSON.stringify({ contentType: "ad-copy", prompt: "Smoke test" }),
});
const mktBody = await mkt.json();
console.log(mkt.ok ? "✓ ai-marketing-content" : `✗ marketing ${mkt.status}`, mktBody.error);

process.exit(script.ok && mkt.ok ? 0 : 1);
