import { useEffect, useRef } from 'react';
import { useAPIStore } from '@/store/useAPIStore';
import { useAlertStore } from '@/store/useAlertStore';
import { useAuth } from '@/hooks/useAuth';
import { getModelById } from '@/services/apiRegistry';

/**
 * Hook that monitors API call logs and triggers smart alert evaluation.
 * Place this once in the app layout (e.g. Index page).
 */
export function useAlertEngine() {
  const { user } = useAuth();
  const callLogs = useAPIStore((s) => s.callLogs);
  const evaluateCall = useAlertStore((s) => s.evaluateCall);
  const lastProcessed = useRef(0);

  useEffect(() => {
    if (!user || callLogs.length === 0) return;

    // Process only new logs since last check
    const newLogs = callLogs.slice(0, callLogs.length - lastProcessed.current);
    lastProcessed.current = callLogs.length;

    for (const log of newLogs) {
      const model = getModelById(log.model);
      const providerId = model?.provider || log.model.split('/')[0] || 'unknown';
      evaluateCall(user.id, {
        provider_id: providerId,
        model_id: log.model,
        status: log.status,
        latencyMs: log.latencyMs,
      });
    }
  }, [callLogs.length, user, evaluateCall, callLogs]);
}
