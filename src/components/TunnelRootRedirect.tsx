import { Navigate, useLocation } from "react-router-dom";
import { isTunnelHost } from "@/lib/studioHub";

/** On the tunnel hostname, send visitors from / to /studio. */
export function TunnelRootRedirect() {
  const { pathname, search } = useLocation();
  if (!isTunnelHost() || pathname !== "/") return null;
  return <Navigate to={`/studio${search}`} replace />;
}
