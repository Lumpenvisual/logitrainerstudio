import { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";
import { useSiteAccess } from "@/hooks/useSiteAccess";

export function SiteAccessGuard({ children }: { children: ReactNode }) {
  const { granted, checking } = useSiteAccess();
  const location = useLocation();

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!granted) {
    return <Navigate to="/studio/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return <>{children}</>;
}
