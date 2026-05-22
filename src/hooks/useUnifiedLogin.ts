import { useCallback, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSiteAccess } from "@/hooks/useSiteAccess";
import {
  isUnifiedEmail,
  LEGACY_BACK_OFFICE_PASSWORD,
  UNIFIED_EMAIL,
  UNIFIED_PASSWORD,
} from "@/lib/unifiedCredentials";

export function useUnifiedLogin() {
  const { signIn } = useAuth();
  const { verifyPassword } = useSiteAccess();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const login = useCallback(
    async (email: string, password: string) => {
      setError(null);
      setSubmitting(true);
      try {
        const normalized = email.trim().toLowerCase();
        if (!isUnifiedEmail(normalized)) {
          setError(`Usa la cuenta oficial: ${UNIFIED_EMAIL}`);
          return false;
        }

        const gate = await verifyPassword(password);
        if (gate.error) {
          setError(
            gate.error.includes("Incorrect") || gate.error.includes("incorrect")
              ? "Correo o contraseña incorrectos."
              : gate.error,
          );
          return false;
        }

        let { error: authError } = await signIn(normalized, password);
        if (authError && password === UNIFIED_PASSWORD) {
          const retry = await signIn(normalized, LEGACY_BACK_OFFICE_PASSWORD);
          if (!retry.error) authError = null;
        }
        if (authError) {
          setError(
            "No se pudo iniciar sesión. Ejecuta npm run sync:unified-password (requiere SUPABASE_SERVICE_ROLE_KEY en .env.local).",
          );
          return false;
        }

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Acceso denegado";
        setError(message);
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [signIn, verifyPassword],
  );

  return { login, error, setError, submitting };
}
