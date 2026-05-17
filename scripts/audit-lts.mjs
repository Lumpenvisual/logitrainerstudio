#!/usr/bin/env node
/** Full LTS audit: secrets, APIs, optional build. */
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
  return r.status === 0;
}

const steps = [
  ["check:secrets", ["npm", "run", "check:secrets"]],
  ["test:ai-apis", ["npm", "run", "test:ai-apis"]],
  ["build", ["npm", "run", "build"]],
];

console.log("\n═══ LogiTrainer Studio — Auditoría ═══\n");
const failed = [];
for (const [name, args] of steps) {
  console.log(`\n▶ ${name}\n`);
  if (!run(args[0], args.slice(1))) failed.push(name);
}

console.log("\n═══ Resumen ═══\n");
if (failed.length) {
  console.error("✗ Falló:", failed.join(", "));
  process.exit(1);
}
console.log("✓ Auditoría OK — secrets, APIs Gemini, build");
console.log("  Siguiente: npm run demo:generate  |  npm run verify:prod\n");
