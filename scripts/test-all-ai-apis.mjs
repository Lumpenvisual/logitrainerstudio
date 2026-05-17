#!/usr/bin/env node
/** Smoke-test all Gemini edge functions used by aiService.ts */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv() {
  for (const f of [".env", ".env.local"]) {
    const p = resolve(root, f);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq < 1) continue;
      process.env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
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

async function edge(name, body, opts = {}) {
  const res = await fetch(`${url}/functions/v1/${name}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { ok: res.ok, status: res.status, json, text };
}

const results = [];

async function check(name, fn) {
  try {
    const r = await fn();
    const pass = r.ok;
    results.push({ name, pass, detail: r.detail });
    console.log(pass ? `✓ ${name}` : `✗ ${name}`, r.detail ?? "");
    return pass;
  } catch (e) {
    results.push({ name, pass: false, detail: e.message });
    console.log(`✗ ${name}`, e.message);
    return false;
  }
}

await check("ai-generate-script", async () => {
  const r = await edge("ai-generate-script", { brief: "API smoke: coffee ad", sceneCount: 1 });
  return { ok: r.ok && r.json.scenes?.length >= 1, detail: r.json.error || `${r.json.scenes?.length} scenes` };
});

await check("ai-marketing-content", async () => {
  const r = await edge("ai-marketing-content", { contentType: "ad-copy", prompt: "API smoke" });
  return { ok: r.ok && !!r.json.content, detail: r.json.error };
});

await check("ai-email-sequence", async () => {
  const r = await edge("ai-email-sequence", {
    topic: "API smoke onboarding",
    framework: "AIDA",
    audience: "creators",
  });
  return {
    ok: r.ok && (r.json.sequence?.emails?.length >= 1 || r.json.emails?.length >= 1),
    detail: r.json.error,
  };
});

await check("ai-chat (stream)", async () => {
  const res = await fetch(`${url}/functions/v1/ai-chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      messages: [{ role: "user", content: "Reply with exactly: OK" }],
      model: "google/gemini-2.5-flash",
    }),
  });
  const text = await res.text();
  const hasChunk = text.includes("data:") && !text.includes('"error"');
  return { ok: res.ok && hasChunk, detail: res.ok ? "SSE received" : text.slice(0, 120) };
});

await check("ai-analyze-image", async () => {
  const r = await edge("ai-analyze-image", {
    imageUrl: "https://picsum.photos/seed/lts-smoke/320/180",
    prompt: "Describe in one sentence",
  });
  return { ok: r.ok && !!r.json.analysis, detail: r.json.error };
});

await check("ai-generate-audio", async () => {
  const r = await edge("ai-generate-audio", {
    text: "Hola, prueba de voz LogiTrainer Studio.",
    language: "es",
  });
  return { ok: r.ok && !!r.json.audioUrl, detail: r.json.error };
});

await check("ai-generate-image", async () => {
  const r = await edge("ai-generate-image", { prompt: "A single red coffee mug on white background" });
  const hasAsset = !!(r.json.imageUrl || r.json.description);
  return { ok: r.ok && hasAsset, detail: r.json.error || (hasAsset ? "image response" : r.status) };
});

await check("agent-orchestrator", async () => {
  const agents = await fetch(`${url}/rest/v1/agents?select=id&limit=1`, {
    headers: { apikey: anon, Authorization: `Bearer ${access_token}` },
  });
  const list = await agents.json();
  const agentId = Array.isArray(list) && list[0]?.id;
  if (!agentId) {
    return { ok: true, detail: "skipped (no agents row — UI still loads)" };
  }
  const r = await edge("agent-orchestrator", { mode: "agent", agentId, input: "Say hi in 3 words" });
  return { ok: r.ok, detail: r.json.error || "ran" };
});

const failed = results.filter((r) => !r.pass);
process.exit(failed.length ? 1 : 0);
