import { useAPIStore } from '@/store/useAPIStore';
import {
  AI_PROVIDERS,
  getModelsWithCapability,
  getModelById,
  ModelPreferences,
} from '@/services/apiRegistry';
import {
  Settings2, Zap, Activity, Clock, AlertTriangle, CheckCircle,
  XCircle, ChevronDown, BarChart3, Cpu, Image, MessageSquare,
  Sparkles, Eye, Wand2, RotateCcw, X
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const taskConfig: {
  key: keyof ModelPreferences;
  label: string;
  icon: typeof Sparkles;
  capability: string;
  description: string;
}[] = [
  { key: 'scriptGeneration', label: 'Script Generation', icon: Sparkles, capability: 'text', description: 'AI model for generating video scripts from briefs' },
  { key: 'chatAssistant', label: 'Chat Assistant', icon: MessageSquare, capability: 'text', description: 'Neural Assistant conversation model' },
  { key: 'imageGeneration', label: 'Image Generation', icon: Image, capability: 'image-gen', description: 'Model for creating scene visuals' },
  { key: 'imageAnalysis', label: 'Image Analysis', icon: Eye, capability: 'image-analysis', description: 'Composition & lighting analysis' },
  { key: 'imageEdit', label: 'Image Editing', icon: Wand2, capability: 'image-gen', description: 'Edit existing images with AI' },
];

const speedBadge = (speed: string) => {
  const colors = { fast: 'bg-success/20 text-success', balanced: 'bg-warning/20 text-warning', slow: 'bg-primary/20 text-primary' };
  return colors[speed as keyof typeof colors] || '';
};

const costBadge = (cost: string) => {
  const colors = { 'free-tier': 'bg-success/20 text-success', low: 'bg-success/20 text-success', medium: 'bg-warning/20 text-warning', high: 'bg-destructive/20 text-destructive' };
  return colors[cost as keyof typeof colors] || '';
};

export function APIManagementPanel({ onClose }: { onClose: () => void }) {
  const { preferences, setPreference, resetPreferences, callLogs, totalCalls, totalErrors, avgLatency, clearCallLogs } = useAPIStore();
  const [activeTab, setActiveTab] = useState<'models' | 'providers' | 'logs'>('models');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xl"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl mx-4 max-h-[85vh] overflow-hidden rounded-lg border border-border bg-card"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/20 border border-primary/30">
              <Settings2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">API Management</h2>
              <p className="text-xs text-muted-foreground font-mono">Multi-Provider AI Configuration</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-px border-b border-border bg-border">
          {[
            { icon: BarChart3, label: 'Total Calls', value: totalCalls, color: 'text-primary' },
            { icon: CheckCircle, label: 'Success Rate', value: totalCalls > 0 ? `${Math.round(((totalCalls - totalErrors) / totalCalls) * 100)}%` : '—', color: 'text-success' },
            { icon: Clock, label: 'Avg Latency', value: avgLatency > 0 ? `${avgLatency}ms` : '—', color: 'text-warning' },
            { icon: AlertTriangle, label: 'Errors', value: totalErrors, color: 'text-destructive' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-card px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`h-3.5 w-3.5 ${color}`} />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
              </div>
              <span className="text-lg font-bold font-mono text-foreground">{value}</span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {(['models', 'providers', 'logs'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 px-4 py-2.5 text-xs font-medium uppercase tracking-wider transition-colors',
                activeTab === tab ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-auto max-h-[calc(85vh-220px)] p-6">
          {activeTab === 'models' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">Select which AI model to use for each task</p>
                <button
                  onClick={resetPreferences}
                  className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset Defaults
                </button>
              </div>

              {taskConfig.map(({ key, label, icon: Icon, capability, description }) => {
                const availableModels = getModelsWithCapability(capability as any);
                const currentModel = getModelById(preferences[key]);
                return (
                  <div key={key} className="rounded-md border border-border bg-background p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary" />
                        <div>
                          <h4 className="text-sm font-medium text-foreground">{label}</h4>
                          <p className="text-xs text-muted-foreground">{description}</p>
                        </div>
                      </div>
                      {currentModel && (
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] rounded-full px-2 py-0.5 ${speedBadge(currentModel.speed)}`}>
                            {currentModel.speed}
                          </span>
                          <span className={`text-[10px] rounded-full px-2 py-0.5 ${costBadge(currentModel.costTier)}`}>
                            ${currentModel.costTier}
                          </span>
                        </div>
                      )}
                    </div>

                    <select
                      value={preferences[key]}
                      onChange={(e) => setPreference(key, e.target.value)}
                      className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {availableModels.map((m) => (
                        <option key={m.id} value={m.id}>
                          [{m.providerLabel}] {m.name} — {m.description.slice(0, 60)}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'providers' && (
            <div className="space-y-4">
              {AI_PROVIDERS.map((provider) => (
                <div key={provider.id} className="rounded-md border border-border bg-background overflow-hidden">
                  <div className="flex items-center gap-3 border-b border-border px-4 py-3 bg-card/50">
                    <span className="text-xl">{provider.logo}</span>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-foreground">{provider.name}</h4>
                      <p className="text-xs text-muted-foreground">{provider.description}</p>
                    </div>
                    <span className={cn(
                      'rounded-full px-2.5 py-0.5 text-[10px] font-medium',
                      provider.status === 'active' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
                    )}>
                      {provider.status}
                    </span>
                  </div>

                  <div className="p-3 space-y-2">
                    {provider.models.map((model) => (
                      <div key={model.id} className="flex items-center gap-3 rounded-md bg-card/30 px-3 py-2">
                        <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground">{model.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{model.description}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {model.capabilities.map((cap) => (
                            <span key={cap} className="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground">
                              {cap}
                            </span>
                          ))}
                          <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${speedBadge(model.speed)}`}>
                            {model.speed}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'logs' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">{callLogs.length} API calls logged</p>
                <button
                  onClick={clearCallLogs}
                  className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear Logs
                </button>
              </div>

              {callLogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground/40">
                  <Activity className="mx-auto h-8 w-8 mb-2" />
                  <p className="text-sm">No API calls yet. Start generating to see logs here.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {callLogs.map((log) => (
                    <div key={log.id} className="flex items-center gap-3 rounded-md bg-background px-3 py-2 font-mono text-xs">
                      <span className="text-muted-foreground/50 shrink-0">
                        {log.timestamp.toLocaleTimeString('en-US', { hour12: false })}
                      </span>
                      {log.status === 'success' ? (
                        <CheckCircle className="h-3 w-3 text-success shrink-0" />
                      ) : (
                        <XCircle className="h-3 w-3 text-destructive shrink-0" />
                      )}
                      <span className="text-primary shrink-0">{log.function}</span>
                      <span className="text-muted-foreground truncate flex-1">{log.model}</span>
                      <span className={cn('shrink-0', log.latencyMs > 5000 ? 'text-destructive' : log.latencyMs > 2000 ? 'text-warning' : 'text-success')}>
                        {log.latencyMs}ms
                      </span>
                      {log.error && <span className="text-destructive truncate max-w-[150px]">{log.error}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
