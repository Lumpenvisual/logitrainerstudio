import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isBackOfficeEmail } from "@/lib/backOffice";
import { clearSiteAccessGrant, getSiteAccessGrant, setSiteAccessGrant } from "@/lib/siteAccess";
import { clearStudioHubSession, getStudioHubSession, setStudioHubSession } from "@/lib/studioHub";
import { matchesAccessPasswordHash } from "@/lib/siteAccessCrypto";
import { verifySiteAccess } from "@/services/aiService";

const ACCESS_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const ENV_HASH =
  (import.meta.env.VITE_SITE_ACCESS_SHA256 as string | undefined) ||
  "cb464f67db3b6c4fe8a14fb2ae193b1d7dcd11a939d191c3fb111d8319712454";

async function verifyViaEdge(password: string): Promise<boolean | null> {
  const { data, error } = await verifySiteAccess(password);
  if (error?.includes("404") || error?.includes("not found")) return null;
  if (error) throw new Error(error);
  return data?.success === true;
}

async function verifyViaSupabaseRpc(password: string): Promise<boolean | null> {
  const { data, error } = await supabase.rpc("verify_site_access", { attempt: password });
  if (error) {
    const msg = error.message ?? "";
    if (
      error.code === "PGRST202" ||
      error.code === "42883" ||
      error.code === "42501" ||
      msg.includes("Could not find") ||
      msg.includes("does not exist")
    ) {
      return null;
    }
    throw error;
  }
  if (typeof data === "boolean") return data;
  return null;
}

async function verifyViaEnvHash(password: string): Promise<boolean> {
  if (!ENV_HASH) return false;
  return matchesAccessPasswordHash(password, ENV_HASH);
}

export function useSiteAccess() {
  const [granted, setGranted] = useState(
    () => !!getSiteAccessGrant() || !!getStudioHubSession(),
  );
  const [checking, setChecking] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const hub = getStudioHubSession();
      if (getSiteAccessGrant() || hub) {
        if (hub && !getSiteAccessGrant()) {
          setSiteAccessGrant(hub.expiresAt);
        }
        if (!cancelled) {
          setGranted(true);
          setChecking(false);
        }
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!cancelled && isBackOfficeEmail(session?.user?.email)) {
        setSiteAccessGrant(Date.now() + ACCESS_TTL_MS);
        setGranted(true);
      }
      if (!cancelled) setChecking(false);
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  const verifyPassword = useCallback(async (password: string) => {
    setVerifying(true);
    try {
      let valid: boolean | null = await verifyViaEdge(password);
      if (valid === null) valid = await verifyViaSupabaseRpc(password);
      if (valid === null) valid = await verifyViaEnvHash(password);
      if (!valid) return { error: "Incorrect access password" };

      setStudioHubSession();
      setGranted(true);
      return { error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Access denied";
      return { error: message };
    } finally {
      setVerifying(false);
    }
  }, []);

  const revokeAccess = useCallback(() => {
    clearStudioHubSession();
    setGranted(false);
  }, []);

  return { granted, checking, verifying, verifyPassword, revokeAccess };
}
