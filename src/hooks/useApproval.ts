import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isBackOfficeEmail } from "@/lib/backOffice";
import { useAuth } from "./useAuth";

async function loadApprovalState(userId: string) {
  const [{ data: approval }, { data: roles }] = await Promise.all([
    supabase.from("user_approvals").select("status").eq("user_id", userId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);

  const hasAdminRole = roles?.some((r) => r.role === "admin") ?? false;
  return {
    isAdmin: hasAdminRole,
    isApproved: hasAdminRole || approval?.status === "approved",
  };
}

export function useApproval() {
  const { user } = useAuth();
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsApproved(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const check = async () => {
      setLoading(true);
      try {
        const state = await loadApprovalState(user.id);
        if (cancelled) return;

        const backOffice = isBackOfficeEmail(user.email);
        setIsAdmin(state.isAdmin || backOffice);
        setIsApproved(state.isApproved || backOffice);
      } catch {
        if (!cancelled) {
          setIsApproved(isBackOfficeEmail(user.email) ? true : false);
          setIsAdmin(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void check();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return { isApproved, isAdmin, loading };
}
