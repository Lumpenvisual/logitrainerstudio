#!/usr/bin/env node
/** Escribe public/tunnel-info.json para el panel /studio/dashboard */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

function git(cmd) {
  try {
    return execSync(`git ${cmd}`, { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

const branch = git("rev-parse --abbrev-ref HEAD");
const commit = git("rev-parse --short HEAD");
const clean = git("status --porcelain") === "";

const info = {
  projectName: pkg.name,
  displayName: "LogiTrainer Studio",
  projectPath: root,
  version: pkg.version,
  gitBranch: branch,
  gitCommit: commit,
  gitClean: clean,
  nodeEngine: pkg.engines?.node ?? ">=20",
  tunnelHost: process.env.CLOUDFLARE_TUNNEL_HOST ?? "studio.logitrainerstudio.com",
  tunnelUrl: `https://${process.env.CLOUDFLARE_TUNNEL_HOST ?? "studio.logitrainerstudio.com"}`,
  productionUrl: "https://logitrainerstudio.vercel.app",
  updatedAt: new Date().toISOString(),
};

const outDir = path.join(root, "public");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "tunnel-info.json"), JSON.stringify(info, null, 2));
console.log("✓ tunnel-info.json");
