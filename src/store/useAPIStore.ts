import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { ModelPreferences, DEFAULT_PREFERENCES } from '@/services/apiRegistry';

export interface APICallLog {
  id: string;
  timestamp: Date;
  function: string;
  model: string;
  status: 'success' | 'error';
  latencyMs: number;
  error?: string;
}

interface APIStore {
  preferences: ModelPreferences;
  setPreference: (key: keyof ModelPreferences, modelId: string) => void;
  resetPreferences: () => void;

  callLogs: APICallLog[];
  addCallLog: (log: Omit<APICallLog, 'id' | 'timestamp'>) => void;
  clearCallLogs: () => void;

  totalCalls: number;
  totalErrors: number;
  avgLatency: number;
}

export const useAPIStore = create<APIStore>()(
  immer((set) => ({
    preferences: { ...DEFAULT_PREFERENCES },
    setPreference: (key, modelId) =>
      set((s) => { s.preferences[key] = modelId; }),
    resetPreferences: () =>
      set((s) => { s.preferences = { ...DEFAULT_PREFERENCES }; }),

    callLogs: [],
    addCallLog: (log) =>
      set((s) => {
        const entry: APICallLog = {
          ...log,
          id: crypto.randomUUID(),
          timestamp: new Date(),
        };
        s.callLogs.unshift(entry);
        if (s.callLogs.length > 200) s.callLogs.pop();
        s.totalCalls++;
        if (log.status === 'error') s.totalErrors++;
        const successLogs = s.callLogs.filter((l) => l.status === 'success');
        s.avgLatency = successLogs.length > 0
          ? Math.round(successLogs.reduce((a, l) => a + l.latencyMs, 0) / successLogs.length)
          : 0;
      }),
    clearCallLogs: () =>
      set((s) => { s.callLogs = []; s.totalCalls = 0; s.totalErrors = 0; s.avgLatency = 0; }),

    totalCalls: 0,
    totalErrors: 0,
    avgLatency: 0,
  }))
);
