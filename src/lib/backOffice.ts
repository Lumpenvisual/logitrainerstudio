import { UNIFIED_EMAIL } from "@/lib/unifiedCredentials";

export const BACK_OFFICE_EMAIL = UNIFIED_EMAIL;

export function isBackOfficeEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return email.toLowerCase() === BACK_OFFICE_EMAIL;
}
