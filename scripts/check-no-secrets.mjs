#!/usr/bin/env node
/**
 * Fails if likely secrets are committed in tracked files.
 * GEMINI_API_KEY belongs only in Supabase Secrets (+ optional .env.local, gitignored).
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const FORBIDDEN = [
  { name: "Gemini API key (AQ.*)", pattern: /GEMINI_API_KEY\s*=\s*['"]?AQ\./ },
  { name: "Gemini API key inline", pattern: /['"]AQ\.[A-Za-z0-9_-]{20,}/ },
  { name: "Service role JWT", pattern: /SUPABASE_SERVICE_ROLE_KEY\s*=\s*['"]?eyJ/ },
  { name: "Gemini in committed .env", pattern: /^GEMINI_API_KEY\s*=\s*\S+/m },
  { name: "Google API key in .env", pattern: /^GOOGLE_API_KEY\s*=\s*\S+/m },
];

const ALLOWED_PATHS = /\.(example|mdc|SKILL\.md)$/i;
const SCAN_GLOBS = ["src", "supabase", "scripts", ".env", ".env.production", "vite.config.ts", "tests"];

let files;
try {
  files = execSync("git ls-files", { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((f) => SCAN_GLOBS.some((g) => f === g || f.startsWith(g + "/") || f.startsWith(g)));
} catch {
  console.warn("Not a git repo or git unavailable — skipping secret scan");
  process.exit(0);
}

const violations = [];

for (const file of files) {
  if (ALLOWED_PATHS.test(file)) continue;
  if (file.endsWith(".local") || file.includes(".env.local")) continue;
  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  for (const rule of FORBIDDEN) {
    if (rule.pattern.test(content)) {
      violations.push({ file, rule: rule.name });
    }
  }
}

if (violations.length) {
  console.error("Secret scan failed — remove keys from tracked files:\n");
  for (const v of violations) {
    console.error(`  • ${v.file} (${v.rule})`);
  }
  console.error("\nStore GEMINI_API_KEY only in:");
  console.error("  npx supabase secrets set GEMINI_API_KEY=... --project-ref zghzhfheyawvbdddsybe");
  console.error("  optional local: .env.local (gitignored)\n");
  process.exit(1);
}

console.log("✓ No forbidden API keys in tracked files");
