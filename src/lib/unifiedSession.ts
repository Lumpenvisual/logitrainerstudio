import { clearSiteAccessGrant } from "@/lib/siteAccess";
import { clearStudioHubSession } from "@/lib/studioHub";

export function clearUnifiedSession() {
  clearStudioHubSession();
  clearSiteAccessGrant();
}

export async function signOutUnified(signOut?: () => Promise<void>) {
  clearUnifiedSession();
  if (signOut) await signOut();
}
