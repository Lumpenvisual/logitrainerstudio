/** Unified studio access — localStorage session + sync with site gate + tunnel detection. */
import { setSiteAccessGrant, clearSiteAccessGrant } from "@/lib/siteAccess";

const HUB_STORAGE_KEY = "lts_studio_hub_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const STUDIO_ACCESS_PASSWORD = "LTS-Mayo2026-7kQ!";
export const PRODUCTION_APP_URL = "https://logitrainerstudio.vercel.app";
export const DEFAULT_TUNNEL_HOST = "studio.logitrainerstudio.com";
export const DEFAULT_TUNNEL_URL = `https://${DEFAULT_TUNNEL_HOST}`;

export const TUNNEL_HOSTS = [
  DEFAULT_TUNNEL_HOST,
  "tunel.logitrainerstudio.com",
] as const;

export interface StudioHubSession {
  authenticated: boolean;
  expiresAt: number;
}

export interface TunnelProjectInfo {
  projectName: string;
  displayName: string;
  projectPath: string;
  version: string;
  gitBranch: string | null;
  gitCommit: string | null;
  gitClean: boolean;
  nodeEngine: string;
  tunnelHost: string;
  tunnelUrl: string;
  productionUrl: string;
  updatedAt: string;
}

export interface HubLinks {
  appPrincipal: string;
  classicStudio: string;
  demo: string;
  production: string;
  studioHub: string;
  isLocal: boolean;
  isTunnel: boolean;
  isVercelProduction: boolean;
  tunnelPublicUrl: string;
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

export function isQuickTunnelHost(): boolean {
  return window.location.hostname.toLowerCase().endsWith(".trycloudflare.com");
}

export function isTunnelHost(): boolean {
  const host = window.location.hostname.toLowerCase();
  if (isQuickTunnelHost()) return true;
  if (TUNNEL_HOSTS.includes(host as (typeof TUNNEL_HOSTS)[number])) return true;
  const envHost = import.meta.env.VITE_TUNNEL_HOST as string | undefined;
  if (envHost && host === envHost.toLowerCase()) return true;
  return false;
}

export function isVercelProductionHost(): boolean {
  const host = window.location.hostname.toLowerCase();
  return host === "logitrainerstudio.vercel.app" || host.endsWith(".vercel.app");
}

export function getTunnelPublicUrl(): string {
  const fromEnv = import.meta.env.VITE_TUNNEL_PUBLIC_URL as string | undefined;
  if (fromEnv?.startsWith("http")) return fromEnv.replace(/\/$/, "");
  return DEFAULT_TUNNEL_URL;
}

export function getHubLinks(): HubLinks {
  const origin = window.location.origin;
  const local = isLocalDevHost();
  const tunnel = isTunnelHost();
  const vercel = isVercelProductionHost();

  return {
    appPrincipal: `${origin}/`,
    classicStudio: `${origin}/classic`,
    demo: `${origin}/demo`,
    production: PRODUCTION_APP_URL,
    studioHub: `${origin}/studio`,
    isLocal: local,
    isTunnel: tunnel,
    isVercelProduction: vercel,
    tunnelPublicUrl: getTunnelPublicUrl(),
  };
}

export async function fetchTunnelProjectInfo(): Promise<TunnelProjectInfo | null> {
  try {
    const res = await fetch("/tunnel-info.json", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as TunnelProjectInfo;
  } catch {
    return null;
  }
}
