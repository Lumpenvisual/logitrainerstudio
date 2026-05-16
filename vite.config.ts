import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";

function readSiteAccessHash(mode: string): string {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  if (env.VITE_SITE_ACCESS_SHA256) return env.VITE_SITE_ACCESS_SHA256;

  const prodFile = path.resolve(process.cwd(), ".env.production");
  if (fs.existsSync(prodFile)) {
    const match = fs.readFileSync(prodFile, "utf8").match(/^VITE_SITE_ACCESS_SHA256=(.+)$/m);
    if (match?.[1]) return match[1].trim().replace(/^["']|["']$/g, "");
  }
  return "";
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const siteAccessHash = readSiteAccessHash(mode);
  return {
  define: {
    "import.meta.env.VITE_SITE_ACCESS_SHA256": JSON.stringify(siteAccessHash),
  },
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
};
});
