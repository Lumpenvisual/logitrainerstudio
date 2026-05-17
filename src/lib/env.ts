/** Strip BOM / whitespace from Vite env (avoids fetch header ISO-8859-1 errors). */
export function cleanEnv(value: string | undefined): string {
  if (value == null) return "";
  return value.replace(/^\uFEFF/, "").trim();
}

/** HTTP headers must be ISO-8859-1; remove other code points. */
export function toHeaderValue(value: string): string {
  const normalized = value.normalize("NFC");
  let out = "";
  for (let i = 0; i < normalized.length; i++) {
    const code = normalized.charCodeAt(i);
    if (code <= 0xff) out += normalized[i];
  }
  return out;
}

export const SUPABASE_URL = cleanEnv(import.meta.env.VITE_SUPABASE_URL);
export const SUPABASE_ANON_KEY = cleanEnv(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
