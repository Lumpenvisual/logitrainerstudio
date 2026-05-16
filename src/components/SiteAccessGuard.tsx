import { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useSiteAccess } from "@/hooks/useSiteAccess";
import { SiteAccessGate } from "@/pages/SiteAccessGate";

export function SiteAccessGuard({ children }: { children: ReactNode }) {
  const { granted, checking, verifying, verifyPassword } = useSiteAccess();

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!granted) {
    return <SiteAccessGate verifyPassword={verifyPassword} verifying={verifying} />;
  }

  return <>{children}</>;
}
