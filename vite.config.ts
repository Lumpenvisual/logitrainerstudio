import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";

const DEFAULT_SITE_ACCESS_SHA256 =
  "cb464f67db3b6c4fe8a14fb2ae193b1d7dcd11a939d191c3fb111d8319712454";
const DEFAULT_BACK_OFFICE_EMAIL = "backoffice@logitrainerstudio.app";

function readSiteAccessHash(mode: string): string {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  if (env.VITE_SITE_ACCESS_SHA256) return env.VITE_SITE_ACCESS_SHA256;

  const prodFile = path.resolve(process.cwd(), ".env.production");
  if (fs.existsSync(prodFile)) {
    const match = fs.readFileSync(prodFile, "utf8").match(/^VITE_SITE_ACCESS_SHA256=(.+)$/m);
    if (match?.[1]) return match[1].trim().replace(/^["']|["']$/g, "");
  }
  return DEFAULT_SITE_ACCESS_SHA256;
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const siteAccessHash = readSiteAccessHash(mode);
  return {
  define: {
    "import.meta.env.VITE_SITE_ACCESS_SHA256": JSON.stringify(siteAccessHash),
    "import.meta.env.VITE_BACK_OFFICE_EMAIL": JSON.stringify(
      env.VITE_BACK_OFFICE_EMAIL || DEFAULT_BACK_OFFICE_EMAIL,
    ),
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
