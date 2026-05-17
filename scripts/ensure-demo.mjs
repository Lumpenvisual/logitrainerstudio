#!/usr/bin/env node
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const mp4 = resolve(root, "public/demo/logitrainer/logitrainer-promo.mp4");
const manifest = resolve(root, "public/demo/logitrainer/manifest.json");

if (existsSync(mp4) && existsSync(manifest)) {
  console.log("✓ Demo assets present");
  process.exit(0);
}

console.log("Demo missing — generating (npm run demo:generate)...");
const r = spawnSync("npm", ["run", "demo:generate"], { cwd: root, stdio: "inherit", shell: true });
process.exit(r.status ?? 1);
