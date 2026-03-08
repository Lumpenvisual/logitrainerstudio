import { useEffect, useState } from 'react';
import { useAlertStore, SmartAlert, AlertType } from '@/store/useAlertStore';
import { useAuth } from '@/hooks/useAuth';
import { Bell, BellOff, AlertTriangle, Zap, TrendingDown, Clock, X, CheckCheck, Settings, ChevronDown, ChevronUp, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const alertTypeConfig: Record<AlertType, { icon: typeof AlertTriangle; color: string; label: string }> = {
  cost_threshold: { icon: TrendingDown, color: 'text-warning', label: 'Costo' },
  repeated_failures: { icon: AlertTriangle, color: 'text-destructive', label: 'Fallas' },
  low_quota: { icon: Zap, color: 'text-warning', label: 'Quota' },
  high_latency: { icon: Clock, color: 'text-primary', label: 'Latencia' },
};

const severityColors: Record<string, string> = {
  info: 'border-l-primary/50 bg-primary/5',
  warning: 'border-l-warning bg-warning/5',
  critical: 'border-l-destructive bg-destructive/5',
};

function AlertItem({ alert, onDismiss, onRead }: { alert: SmartAlert; onDismiss: () => void; onRead: () => void }) {
  const config = alertTypeConfig[alert.alert_type];
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      onClick={onRead}
      className={cn(
        'group relative flex gap-3 rounded-lg border-l-[3px] p-3 cursor-pointer transition-all',
        severityColors[alert.severity],
        !alert.is_read && 'ring-1 ring-primary/20'
      )}
    >
      <div className={cn('mt-0.5 shrink-0', config.color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">{alert.title}</span>
          {!alert.is_read && <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{alert.message}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <Badge variant="outline" className="text-[9px] px-1.5 py-0">{config.label}</Badge>
          {alert.provider_id && <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{alert.provider_id}</Badge>}
          <span className="text-[9px] text-muted-foreground/50 ml-auto">
            {new Date(alert.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDismiss(); }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-foreground transition-all"
      >
        <X className="h-3 w-3" />
      </button>
    </motion.div>
  );
}

function SettingsSection() {
  const { user } = useAuth();
  const { settings, saveSettings } = useAlertStore();
  const [local, setLocal] = useState(settings);
  const [dirty, setDirty] = useState(false);

  useEffect(() => { setLocal(settings); }, [settings]);

  const update = (key: string, value: any) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!user) return;
    await saveSettings(user.id, local);
    setDirty(false);
    toast.success('Configuración de alertas guardada');
  };

  return (
    <div className="space-y-3 p-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs">Alertas activas</Label>
        <Switch checked={local.alerts_enabled} onCheckedChange={(v) => update('alerts_enabled', v)} />
      </div>
      <div className="space-y-2">
        <div>
          <Label className="text-[10px] text-muted-foreground">Umbral de costo ($)</Label>
          <Input type="number" className="h-7 text-xs mt-1" value={local.cost_threshold} onChange={(e) => update('cost_threshold', Number(e.target.value))} />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Fallas antes de alertar</Label>
          <Input type="number" className="h-7 text-xs mt-1" value={local.failure_count_threshold} onChange={(e) => update('failure_count_threshold', Number(e.target.value))} />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Ventana de fallas (min)</Label>
          <Input type="number" className="h-7 text-xs mt-1" value={local.failure_window_minutes} onChange={(e) => update('failure_window_minutes', Number(e.target.value))} />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Umbral de latencia (ms)</Label>
          <Input type="number" className="h-7 text-xs mt-1" value={local.latency_threshold_ms} onChange={(e) => update('latency_threshold_ms', Number(e.target.value))} />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Alerta de quota (%)</Label>
          <Input type="number" className="h-7 text-xs mt-1" value={local.quota_warning_percent} onChange={(e) => update('quota_warning_percent', Number(e.target.value))} />
        </div>
      </div>
      {dirty && (
        <Button size="sm" className="w-full h-7 text-xs gap-1" onClick={handleSave}>
          <Save className="h-3 w-3" /> Guardar configuración
        </Button>
      )}
    </div>
  );
}

export function AlertsPanel() {
  const { user } = useAuth();
  const { alerts, unreadCount, loading, fetchAlerts, fetchSettings, markAsRead, markAllRead, dismissAlert, clearAllAlerts } = useAlertStore();
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAlerts(user.id);
      fetchSettings(user.id);
    }
  }, [user, fetchAlerts, fetchSettings]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <span className="font-display text-sm font-semibold">Alertas Inteligentes</span>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="h-5 min-w-[20px] px-1.5 text-[10px] font-bold">
              {unreadCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {alerts.length > 0 && (
            <>
              <button
                onClick={() => user && markAllRead(user.id)}
                className="rounded p-1 text-muted-foreground/50 hover:text-foreground transition-colors"
                title="Marcar todas como leídas"
              >
                <CheckCheck className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => user && clearAllAlerts(user.id)}
                className="rounded p-1 text-muted-foreground/50 hover:text-foreground transition-colors"
                title="Limpiar alertas"
              >
                <BellOff className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              'rounded p-1 transition-colors',
              showSettings ? 'text-primary bg-primary/10' : 'text-muted-foreground/50 hover:text-foreground'
            )}
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Settings collapse */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-border overflow-hidden"
          >
            <SettingsSection />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alerts list */}
      <div className="flex-1 overflow-auto p-3 space-y-2">
        {loading && (
          <div className="flex items-center justify-center py-8 text-muted-foreground/40 text-xs">
            Cargando alertas...
          </div>
        )}
        {!loading && alerts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-success/10 p-3 mb-3">
              <Bell className="h-5 w-5 text-success" />
            </div>
            <p className="text-xs font-medium text-foreground/70">Todo en orden</p>
            <p className="text-[10px] text-muted-foreground mt-1">No hay alertas activas. El sistema monitorea automáticamente tus APIs.</p>
          </div>
        )}
        <AnimatePresence mode="popLayout">
          {alerts.map((alert) => (
            <AlertItem
              key={alert.id}
              alert={alert}
              onDismiss={() => user && dismissAlert(user.id, alert.id)}
              onRead={() => user && !alert.is_read && markAsRead(user.id, alert.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
