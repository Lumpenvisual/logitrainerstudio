export const BACK_OFFICE_EMAIL = (
  import.meta.env.VITE_BACK_OFFICE_EMAIL || "backoffice@logitrainerstudio.app"
).toLowerCase();

export function isBackOfficeEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return email.toLowerCase() === BACK_OFFICE_EMAIL;
}
