import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

/** Legacy /auth — redirects to unified login; preserves return state. */
export default function Auth() {
  const location = useLocation();
  const { user, loading } = useAuth();
  const state = location.state as { from?: string; initialView?: "suite" } | null;

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    const redirectTo = state?.from === "/classic" ? "/" : state?.from || "/";
    const redirectState = state?.initialView === "suite" ? { initialView: "suite" as const } : undefined;
    return <Navigate to={redirectTo} replace state={redirectState} />;
  }

  return <Navigate to="/studio/login" replace state={state ?? undefined} />;
}
