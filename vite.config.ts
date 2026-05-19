import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";

const DEFAULT_SITE_ACCESS_SHA256 =
  "cb464f67db3b6c4fe8a14fb2ae193b1d7dcd11a939d191c3fb111d8319712454";
const DEFAULT_BACK_OFFICE_EMAIL = "backoffice@logitrainerstudio.app";
const DEFAULT_SUPABASE_URL = "https://zghzhfheyawvbdddsybe.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnaHpoZmhleWF3dmJkZGRzeWJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMDc5MTQsImV4cCI6MjA5MzY4MzkxNH0.zrVyby4i1-18JM4eVVXdqQCgfPTwbRE5W_22VeiTQoM";
const DEFAULT_SUPABASE_PROJECT_ID = "zghzhfheyawvbdddsybe";

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
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
      env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL,
    ),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
      env.VITE_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_ANON_KEY,
    ),
    "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(
      env.VITE_SUPABASE_PROJECT_ID || DEFAULT_SUPABASE_PROJECT_ID,
    ),
    "import.meta.env.VITE_TUNNEL_HOST": JSON.stringify(env.VITE_TUNNEL_HOST || ""),
    "import.meta.env.VITE_TUNNEL_PUBLIC_URL": JSON.stringify(env.VITE_TUNNEL_PUBLIC_URL || ""),
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
