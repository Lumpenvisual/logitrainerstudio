#!/usr/bin/env node
/**
 * Genera demo completo LogiTrainer: guion → imagen + voz por escena → MP4.
 * Salida: public/demo/logitrainer/
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const OUT = resolve(root, "public/demo/logitrainer");
const SCENES_DIR = join(OUT, "scenes");

const BRIEF =
  "Video promocional de 45 segundos para LogiTrainer Studio: IDE de producción audiovisual con IA. " +
  "Explica que convierte un brief en guion por escenas, genera imágenes y voz con Gemini, y edita en timeline. " +
  "Tono profesional, inspirador, en español. Marca: LogiTrainer Studio, agencia audiovisual automatizada.";

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

function parseDataUrl(dataUrl) {
  const idx = dataUrl.indexOf(";base64,");
  if (idx === -1) throw new Error("Invalid data URL");
  const meta = dataUrl.slice(5, idx);
  const rateMatch = meta.match(/rate=(\d+)/);
  return {
    mime: meta.split(";")[0],
    rate: rateMatch ? parseInt(rateMatch[1], 10) : 24000,
    buffer: Buffer.from(dataUrl.slice(idx + 8), "base64"),
  };
}

function saveImageDataUrl(dataUrl, dir, base) {
  const { mime, buffer } = parseDataUrl(dataUrl);
  const ext = mime.includes("jpeg") || mime.includes("jpg") ? "jpg" : "png";
  const path = join(dir, `${base}.${ext}`);
  writeFileSync(path, buffer);
  return { ext, path };
}

async function saveAudioAsWav(dataUrl, wavPath) {
  const { mime, rate, buffer } = parseDataUrl(dataUrl);
  if (mime.includes("L16") || mime.includes("pcm")) {
    const pcmPath = `${wavPath}.pcm`;
    writeFileSync(pcmPath, buffer);
    execSync(`ffmpeg -y -f s16le -ar ${rate} -ac 1 -i "${pcmPath}" "${wavPath}"`, { stdio: "pipe" });
    const { unlinkSync } = await import("node:fs");
    try {
      unlinkSync(pcmPath);
    } catch {
      /* ignore */
    }
    return "wav";
  }
  writeFileSync(wavPath, buffer);
  return "wav";
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

mkdirSync(SCENES_DIR, { recursive: true });

console.log("▶ Login...");
const login = await fetch(`${url}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: anon, "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
const { access_token } = await login.json();
if (!access_token) {
  console.error("Login failed");
  process.exit(1);
}

const headers = { apikey: anon, Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" };

async function edge(name, body) {
  const res = await fetch(`${url}/functions/v1/${name}`, { method: "POST", headers, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `${name} HTTP ${res.status}`);
  return json;
}

async function edgeWithRetry(name, body, retries = 3) {
  let last;
  for (let i = 0; i < retries; i++) {
    try {
      return await edge(name, body);
    } catch (e) {
      last = e;
      console.log(`  ⚠ Reintento ${i + 1}/${retries}: ${e.message}`);
      await new Promise((r) => setTimeout(r, 2500 * (i + 1)));
    }
  }
  throw last;
}

console.log("▶ Generando guion (4 escenas)...");
const scriptRes = await edge("ai-generate-script", {
  brief: BRIEF,
  sceneCount: 4,
  model: "google/gemini-2.5-flash",
});
const scenes = scriptRes.scenes;
if (!scenes?.length) throw new Error("No scenes returned");

const manifest = {
  version: 1,
  title: "LogiTrainer Studio — Demo promocional",
  brief: BRIEF,
  generatedAt: new Date().toISOString(),
  model: scriptRes.model,
  videoFile: "logitrainer-promo.mp4",
  scenes: [],
};

for (let i = 0; i < scenes.length; i++) {
  const s = scenes[i];
  const n = String(i + 1).padStart(2, "0");
  const base = `scene-${n}`;
  console.log(`\n▶ Escena ${s.sceneNumber}/${scenes.length}: ${s.sceneType}`);

  console.log("  · Imagen...");
  const img = await edgeWithRetry("ai-generate-image", {
    prompt: `${s.visualPrompt}. Cinematic 16:9, modern tech product aesthetic, LogiTrainer branding colors teal and dark UI.`,
    model: "google/gemini-2.5-flash-image",
  });
  const { ext: imgExt, path: imgPath } = saveImageDataUrl(img.imageUrl, SCENES_DIR, base);

  console.log("  · Voz...");
  const audio = await edgeWithRetry("ai-generate-audio", {
    text: s.voiceOverScript,
    language: "es",
    model: "google/gemini-2.5-flash-preview-tts",
  });
  const audioPath = join(SCENES_DIR, `${base}.wav`);
  const audioExt = await saveAudioAsWav(audio.audioUrl, audioPath);

  const duration = Math.max(s.durationTargetSec || 8, 5);
  const segmentMp4 = join(SCENES_DIR, `${base}.mp4`);
  console.log("  · Segmento video...");
  execSync(
    `ffmpeg -y -loop 1 -i "${imgPath}" -i "${audioPath}" -c:v libx264 -tune stillimage -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -t ${duration} "${segmentMp4}"`,
    { stdio: "pipe" },
  );

  manifest.scenes.push({
    sceneNumber: s.sceneNumber,
    sceneType: s.sceneType,
    durationSec: duration,
    visualPrompt: s.visualPrompt,
    voiceOverScript: s.voiceOverScript,
    image: `scenes/${base}.${imgExt}`,
    audio: `scenes/${base}.${audioExt}`,
    segment: `scenes/${base}.mp4`,
  });
}

const concatList = join(OUT, "concat.txt");
writeFileSync(concatList, manifest.scenes.map((s) => `file '${s.segment}'`).join("\n"));

const finalMp4 = join(OUT, "logitrainer-promo.mp4");
console.log("\n▶ Ensamblando video final...");
execSync(`ffmpeg -y -f concat -safe 0 -i concat.txt -c copy logitrainer-promo.mp4`, { cwd: OUT, stdio: "inherit" });

writeFileSync(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));

const readme = `# Demo LogiTrainer Studio

Generado con \`npm run demo:generate\`.

- **Video:** [logitrainer-promo.mp4](./logitrainer-promo.mp4)
- **Manifiesto:** [manifest.json](./manifest.json)
- **Ver en app:** https://logitrainerstudio.vercel.app/demo

Regenerar: \`npm run demo:generate\` (requiere .env + GEMINI_API_KEY en Supabase).
`;
writeFileSync(join(OUT, "README.md"), readme);

console.log(`\n✓ Demo guardado en public/demo/logitrainer/`);
console.log(`  Video: ${finalMp4}`);
console.log(`  Escenas: ${manifest.scenes.length}`);
