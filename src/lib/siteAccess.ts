const STORAGE_KEY = "lts_site_access";

export interface SiteAccessGrant {
  expiresAt: number;
}

export function getSiteAccessGrant(): SiteAccessGrant | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SiteAccessGrant;
    if (!parsed?.expiresAt || parsed.expiresAt <= Date.now()) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function setSiteAccessGrant(expiresAt: number) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ expiresAt }));
}

export function clearSiteAccessGrant() {
  sessionStorage.removeItem(STORAGE_KEY);
}
