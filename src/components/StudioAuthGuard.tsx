import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getStudioHubSession } from "@/lib/studioHub";

/**
 * Protects routes behind the unified /studio password (localStorage session).
 * Use for pages that must not render without hub login.
 */
export function StudioAuthGuard({ children }: { children: ReactNode }) {
  const location = useLocation();
  const session = getStudioHubSession();

  if (!session) {
    return (
      <Navigate
        to="/studio/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return <>{children}</>;
}
