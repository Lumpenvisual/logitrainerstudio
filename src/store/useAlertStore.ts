import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { supabase } from '@/integrations/supabase/client';
import { sendBrowserNotification } from '@/lib/notifications';

export type AlertType = 'cost_threshold' | 'repeated_failures' | 'low_quota' | 'high_latency';
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface SmartAlert {
  id: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  provider_id?: string;
  model_id?: string;
  metric_value?: number;
  threshold_value?: number;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
}

export interface AlertSettings {
  cost_threshold: number;
  failure_count_threshold: number;
  failure_window_minutes: number;
  latency_threshold_ms: number;
  quota_warning_percent: number;
  alerts_enabled: boolean;
}

const DEFAULT_SETTINGS: AlertSettings = {
  cost_threshold: 50,
  failure_count_threshold: 5,
  failure_window_minutes: 10,
  latency_threshold_ms: 5000,
  quota_warning_percent: 20,
  alerts_enabled: true,
};

interface AlertStore {
  alerts: SmartAlert[];
  settings: AlertSettings;
  loading: boolean;
  unreadCount: number;

  fetchAlerts: (userId: string) => Promise<void>;
  fetchSettings: (userId: string) => Promise<void>;
  saveSettings: (userId: string, settings: Partial<AlertSettings>) => Promise<void>;
  markAsRead: (userId: string, alertId: string) => Promise<void>;
  markAllRead: (userId: string) => Promise<void>;
  dismissAlert: (userId: string, alertId: string) => Promise<void>;
  clearAllAlerts: (userId: string) => Promise<void>;
  createAlert: (userId: string, alert: Omit<SmartAlert, 'id' | 'is_read' | 'is_dismissed' | 'created_at'>) => Promise<void>;

  // Engine: evaluate API call logs for alert conditions
  evaluateCall: (userId: string, callData: {
    provider_id: string;
    model_id: string;
    status: 'success' | 'error';
    latencyMs: number;
  }) => void;
}

// Track recent failures in memory for windowed counting
const recentFailures: Map<string, number[]> = new Map();

export const useAlertStore = create<AlertStore>()(
  immer((set, get) => ({
    alerts: [],
    settings: { ...DEFAULT_SETTINGS },
    loading: false,
    unreadCount: 0,

    fetchAlerts: async (userId) => {
      set((s) => { s.loading = true; });
      const { data } = await supabase
        .from('smart_alerts' as any)
        .select('*')
        .eq('user_id', userId)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(100);

      const alerts = (data as any[] || []) as SmartAlert[];
      set((s) => {
        s.alerts = alerts;
        s.unreadCount = alerts.filter((a) => !a.is_read).length;
        s.loading = false;
      });
    },

    fetchSettings: async (userId) => {
      const { data } = await supabase
        .from('alert_settings' as any)
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (data) {
        const d = data as any;
        set((s) => {
          s.settings = {
            cost_threshold: d.cost_threshold,
            failure_count_threshold: d.failure_count_threshold,
            failure_window_minutes: d.failure_window_minutes,
            latency_threshold_ms: d.latency_threshold_ms,
            quota_warning_percent: d.quota_warning_percent,
            alerts_enabled: d.alerts_enabled,
          };
        });
      }
    },

    saveSettings: async (userId, newSettings) => {
      const merged = { ...get().settings, ...newSettings };
      await supabase
        .from('alert_settings' as any)
        .upsert({
          user_id: userId,
          ...merged,
          updated_at: new Date().toISOString(),
        } as any, { onConflict: 'user_id' });

      set((s) => { s.settings = merged; });
    },

    markAsRead: async (userId, alertId) => {
      await supabase
        .from('smart_alerts' as any)
        .update({ is_read: true } as any)
        .eq('id', alertId)
        .eq('user_id', userId);

      set((s) => {
        const a = s.alerts.find((x) => x.id === alertId);
        if (a && !a.is_read) {
          a.is_read = true;
          s.unreadCount = Math.max(0, s.unreadCount - 1);
        }
      });
    },

    markAllRead: async (userId) => {
      await supabase
        .from('smart_alerts' as any)
        .update({ is_read: true } as any)
        .eq('user_id', userId)
        .eq('is_read', false);

      set((s) => {
        s.alerts.forEach((a) => { a.is_read = true; });
        s.unreadCount = 0;
      });
    },

    dismissAlert: async (userId, alertId) => {
      await supabase
        .from('smart_alerts' as any)
        .update({ is_dismissed: true } as any)
        .eq('id', alertId)
        .eq('user_id', userId);

      set((s) => {
        s.alerts = s.alerts.filter((a) => a.id !== alertId);
        s.unreadCount = s.alerts.filter((a) => !a.is_read).length;
      });
    },

    clearAllAlerts: async (userId) => {
      await supabase
        .from('smart_alerts' as any)
        .update({ is_dismissed: true } as any)
        .eq('user_id', userId);

      set((s) => { s.alerts = []; s.unreadCount = 0; });
    },

    createAlert: async (userId, alert) => {
      const { data } = await supabase
        .from('smart_alerts' as any)
        .insert({
          user_id: userId,
          ...alert,
        } as any)
        .select()
        .single();

      if (data) {
        const created = data as any as SmartAlert;
        set((s) => {
          s.alerts.unshift(created);
          s.unreadCount++;
        });

        // Browser push notification for warning/critical alerts
        if (created.severity === 'critical' || created.severity === 'warning') {
          sendBrowserNotification(created.title, {
            body: created.message,
            tag: `alert-${created.id}`,
            silent: created.severity !== 'critical',
          });
        }
      }
    },

    evaluateCall: (userId, callData) => {
      const { settings, createAlert } = get();
      if (!settings.alerts_enabled) return;

      // 1. High latency check
      if (callData.latencyMs > settings.latency_threshold_ms) {
        createAlert(userId, {
          alert_type: 'high_latency',
          severity: callData.latencyMs > settings.latency_threshold_ms * 2 ? 'critical' : 'warning',
          title: 'Alta latencia detectada',
          message: `${callData.model_id} respondió en ${(callData.latencyMs / 1000).toFixed(1)}s (umbral: ${(settings.latency_threshold_ms / 1000).toFixed(1)}s)`,
          provider_id: callData.provider_id,
          model_id: callData.model_id,
          metric_value: callData.latencyMs,
          threshold_value: settings.latency_threshold_ms,
        });
      }

      // 2. Repeated failures check (windowed)
      if (callData.status === 'error') {
        const key = callData.provider_id;
        const now = Date.now();
        const windowMs = settings.failure_window_minutes * 60 * 1000;

        if (!recentFailures.has(key)) recentFailures.set(key, []);
        const timestamps = recentFailures.get(key)!;
        timestamps.push(now);

        // Clean old entries
        const cutoff = now - windowMs;
        const filtered = timestamps.filter((t) => t > cutoff);
        recentFailures.set(key, filtered);

        if (filtered.length >= settings.failure_count_threshold) {
          createAlert(userId, {
            alert_type: 'repeated_failures',
            severity: 'critical',
            title: 'Fallas repetidas en API',
            message: `${callData.provider_id} ha fallado ${filtered.length} veces en los últimos ${settings.failure_window_minutes} minutos`,
            provider_id: callData.provider_id,
            metric_value: filtered.length,
            threshold_value: settings.failure_count_threshold,
          });
          // Reset counter after alert
          recentFailures.set(key, []);
        }
      }
    },
  }))
);
