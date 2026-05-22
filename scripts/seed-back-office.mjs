#!/usr/bin/env node
/**
 * Creates back-office admin in Supabase Auth + user_roles.
 *
 * Option A (preferred): SUPABASE_SERVICE_ROLE_KEY + BACK_OFFICE_SETUP_SECRET
 *   node scripts/seed-back-office.mjs
 *
 * Option B: Sign up at /auth then run migration SQL in Supabase dashboard
 *   (trigger grants admin automatically)
 *
 * Option C: After signup, call bootstrap_back_office RPC:
 *   node scripts/seed-back-office.mjs --bootstrap-only
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv() {
  const files = [".env", ".env.local"];
  for (const f of files) {
    const p = resolve(root, f);
    if (!existsSync(p)) continue;
    const text = readFileSync(p, "utf8").replace(/^\uFEFF/, "");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
}

loadEnv();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const setupSecret = process.env.BACK_OFFICE_SETUP_SECRET || "LTS-Bootstrap-2026-xK9";

const ADMIN_EMAIL = process.env.BACK_OFFICE_EMAIL || "backoffice@logitrainerstudio.app";
const ADMIN_PASSWORD = process.env.BACK_OFFICE_PASSWORD || process.env.STUDIO_ACCESS_PASSWORD || "LTS-Mayo2026-7kQ!";

const bootstrapOnly = process.argv.includes("--bootstrap-only");

if (!url || !anonKey) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env");
  process.exit(1);
}

async function tryEdgeSeed() {
  if (!serviceKey) return false;
  const res = await fetch(`${url}/functions/v1/seed-back-office`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${anonKey}`,
      "x-setup-secret": setupSecret,
    },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const data = await res.json().catch(() => ({}));
  if (res.ok && data.success) {
    console.log("✓ seed-back-office:", data);
    return true;
  }
  console.warn("seed-back-office:", res.status, data);
  return false;
}

async function trySeedAdmin() {
  if (!serviceKey) return false;
  const res = await fetch(`${url}/functions/v1/seed-admin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
    },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const data = await res.json().catch(() => ({}));
  if (res.ok && data.success) {
    console.log("✓ seed-admin:", data);
    return true;
  }
  console.warn("seed-admin:", res.status, data);
  return false;
}

async function trySignup() {
  const supabase = createClient(url, anonKey);
  const { data, error } = await supabase.auth.signUp({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    options: { data: { display_name: "Back Office Admin" } },
  });
  if (error && !error.message.includes("already registered")) {
    console.warn("signup:", error.message);
    return false;
  }
  console.log("✓ signup ok:", data.user?.id ?? "(existing user)");
  return true;
}

async function tryBootstrapRpc() {
  const supabase = createClient(url, anonKey);
  const { data, error } = await supabase.rpc("bootstrap_back_office", { setup_token: setupSecret });
  if (error) {
    console.warn("bootstrap_back_office RPC:", error.message);
    return false;
  }
  if (data?.success) {
    console.log("✓ bootstrap_back_office:", data);
    return true;
  }
  console.warn("bootstrap_back_office:", data);
  return false;
}

async function forceUpdatePassword() {
  if (!serviceKey) return false;
  const admin = createClient(url, serviceKey);
  const { data: list, error: listErr } = await admin.auth.admin.listUsers();
  if (listErr) {
    console.warn("listUsers:", listErr.message);
    return false;
  }
  const user = list?.users?.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());
  if (!user?.id) return false;
  const { error } = await admin.auth.admin.updateUserById(user.id, { password: ADMIN_PASSWORD });
  if (error) {
    console.warn("updateUserById:", error.message);
    return false;
  }
  console.log("✓ password updated to unified value");
  return true;
}

async function verifyLogin() {
  const supabase = createClient(url, anonKey);
  let { data, error } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  if (error) {
    const updated = await forceUpdatePassword();
    if (updated) {
      ({ data, error } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }));
    }
  }
  if (error) {
    console.error("✗ login failed:", error.message);
    return false;
  }
  const userId = data.user?.id;
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const isAdmin = roles?.some((r) => r.role === "admin");
  console.log(isAdmin ? "✓ login + admin role confirmed" : "✗ login ok but admin role missing");
  await supabase.auth.signOut();
  return isAdmin;
}

async function main() {
  console.log("Back-office seed:", ADMIN_EMAIL);

  if (bootstrapOnly) {
    await tryBootstrapRpc();
    await verifyLogin();
    return;
  }

  if (await tryEdgeSeed()) {
    await verifyLogin();
    return;
  }
  if (await trySeedAdmin()) {
    await verifyLogin();
    return;
  }

  await trySignup();
  if (await tryBootstrapRpc()) {
    await verifyLogin();
    return;
  }

  console.log(`
Could not complete automatically. Run this SQL in Supabase Dashboard → SQL:
  supabase/migrations/20260516170000_back_office_config.sql

Then sign in at /auth with:
  Email: ${ADMIN_EMAIL}
  Password: ${ADMIN_PASSWORD}
`);
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
