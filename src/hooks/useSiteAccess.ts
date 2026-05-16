import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { clearSiteAccessGrant, getSiteAccessGrant, setSiteAccessGrant } from "@/lib/siteAccess";
import { matchesAccessPasswordHash } from "@/lib/siteAccessCrypto";

const ACCESS_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const ENV_HASH = import.meta.env.VITE_SITE_ACCESS_SHA256 as string | undefined;

async function verifyViaSupabaseRpc(password: string): Promise<boolean | null> {
  const { data, error } = await supabase.rpc("verify_site_access", { attempt: password });
  if (error) {
    if (error.code === "PGRST202" || error.message?.includes("Could not find")) return null;
    throw error;
  }
  return data === true;
}

async function verifyViaEdgeFunction(password: string): Promise<boolean | null> {
  const { data, error } = await supabase.functions.invoke("verify-site-access", {
    body: { password },
  });
  if (error) {
    if (error.message?.includes("404") || error.message?.includes("not found")) return null;
    throw error;
  }
  if (data?.error) {
    if (data.error.includes("Incorrect")) return false;
    throw new Error(data.error);
  }
  return data?.success === true;
}

async function verifyViaEnvHash(password: string): Promise<boolean> {
  if (!ENV_HASH) return false;
  return matchesAccessPasswordHash(password, ENV_HASH);
}

export function useSiteAccess() {
  const [granted, setGranted] = useState(() => !!getSiteAccessGrant());
  const [checking, setChecking] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    setGranted(!!getSiteAccessGrant());
    setChecking(false);
  }, []);

  const verifyPassword = useCallback(async (password: string) => {
    setVerifying(true);
    try {
      let valid = await verifyViaSupabaseRpc(password);
      if (valid === null) valid = await verifyViaEdgeFunction(password);
      if (valid === null) valid = await verifyViaEnvHash(password);
      if (!valid) return { error: "Incorrect access password" };

      setSiteAccessGrant(Date.now() + ACCESS_TTL_MS);
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
    clearSiteAccessGrant();
    setGranted(false);
  }, []);

  return { granted, checking, verifying, verifyPassword, revokeAccess };
}
