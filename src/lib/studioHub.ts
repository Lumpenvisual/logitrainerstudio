/** Unified studio access — localStorage session + sync with site gate. */
import { setSiteAccessGrant, clearSiteAccessGrant } from "@/lib/siteAccess";

const HUB_STORAGE_KEY = "lts_studio_hub_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const STUDIO_ACCESS_PASSWORD = "LTS-Mayo2026-7kQ!";
export const PRODUCTION_APP_URL = "https://logitrainerstudio.vercel.app";

export interface StudioHubSession {
  authenticated: boolean;
  expiresAt: number;
}

export function getStudioHubSession(): StudioHubSession | null {
  try {
    const raw = localStorage.getItem(HUB_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StudioHubSession;
    if (!parsed?.authenticated || !parsed.expiresAt || parsed.expiresAt <= Date.now()) {
      localStorage.removeItem(HUB_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(HUB_STORAGE_KEY);
    return null;
  }
}

export function setStudioHubSession() {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  localStorage.setItem(
    HUB_STORAGE_KEY,
    JSON.stringify({ authenticated: true, expiresAt } satisfies StudioHubSession),
  );
  setSiteAccessGrant(expiresAt);
}

export function clearStudioHubSession() {
  localStorage.removeItem(HUB_STORAGE_KEY);
  clearSiteAccessGrant();
}

export function verifyStudioPassword(password: string): boolean {
  return password.trim() === STUDIO_ACCESS_PASSWORD;
}

export function isLocalDevHost(): boolean {
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

export function getHubLinks() {
  const local = isLocalDevHost();
  const origin = window.location.origin;
  return {
    production: PRODUCTION_APP_URL,
    demo: local ? `${origin}/demo` : `${PRODUCTION_APP_URL}/demo`,
    localApp: local ? `${origin}/` : "http://localhost:8080/",
    isLocal: local,
  };
}
