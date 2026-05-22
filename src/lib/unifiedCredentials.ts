/**
 * Single studio account — site gate, hub, and Supabase back-office.
 * Override via VITE_UNIFIED_EMAIL / VITE_UNIFIED_PASSWORD in .env
 */
export const UNIFIED_EMAIL = (
  import.meta.env.VITE_UNIFIED_EMAIL ||
  import.meta.env.VITE_BACK_OFFICE_EMAIL ||
  "backoffice@logitrainerstudio.app"
).toLowerCase();

export const UNIFIED_PASSWORD =
  import.meta.env.VITE_UNIFIED_PASSWORD ||
  import.meta.env.VITE_SITE_ACCESS_PASSWORD ||
  "LTS-Mayo2026-7kQ!";

/** Until `npm run sync:unified-password` runs with service role. */
export const LEGACY_BACK_OFFICE_PASSWORD =
  import.meta.env.VITE_LEGACY_BACK_OFFICE_PASSWORD || "LTS-BackOffice-2026!mX";

export function isUnifiedEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return email.toLowerCase() === UNIFIED_EMAIL;
}
