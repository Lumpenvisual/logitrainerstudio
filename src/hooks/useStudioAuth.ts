import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  clearStudioHubSession,
  getStudioHubSession,
  setStudioHubSession,
  verifyStudioPassword,
} from "@/lib/studioHub";

export function useStudioAuth() {
  const [authenticated, setAuthenticated] = useState(() => !!getStudioHubSession());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAuthenticated(!!getStudioHubSession());
  }, []);

  const login = useCallback((password: string) => {
    setError(null);
    if (!verifyStudioPassword(password)) {
      setError("Contraseña incorrecta. Inténtalo de nuevo.");
      return false;
    }
    setStudioHubSession();
    setAuthenticated(true);
    return true;
  }, []);

  const logout = useCallback(() => {
    clearStudioHubSession();
    setAuthenticated(false);
    setError(null);
  }, []);

  return { authenticated, error, setError, login, logout };
}

/** Redirect to login when session is missing (for protected studio routes). */
export function useRequireStudioAuth(redirectTo = "/studio/login") {
  const navigate = useNavigate();
  const { authenticated } = useStudioAuth();

  useEffect(() => {
    if (!authenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [authenticated, navigate, redirectTo]);

  return authenticated;
}
