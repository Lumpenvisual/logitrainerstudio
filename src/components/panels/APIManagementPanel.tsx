import { useAPIStore } from '@/store/useAPIStore';
import { useApiKeys } from '@/hooks/useApiKeys';
import { useI18n } from '@/i18n/useI18n';
import {
  AI_PROVIDERS,
  getModelsWithCapability,
  getModelById,
  getExternalProviders,
  ModelPreferences,
} from '@/services/apiRegistry';
import {
  Settings2, Activity, Clock, AlertTriangle, CheckCircle,
  XCircle, BarChart3, Cpu, Image, MessageSquare,
  Sparkles, Eye, Wand2, RotateCcw, X, Key, Video,
  Music, Mic, ExternalLink, Trash2, Shield, ShieldCheck, ShieldAlert
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TranslationKey } from '@/i18n/translations';
import { toast } from 'sonner';

const taskConfig: {
  key: keyof ModelPreferences;
  label: string;
  desc: string;
  icon: typeof Sparkles;
  capability: string;
}[] = [
  { key: 'scriptGeneration', label: 'Script Generation', desc: 'AI writes video scripts from briefs', icon: Sparkles, capability: 'text' },
  { key: 'chatAssistant', label: 'Chat Assistant', desc: 'Neural assistant for creative direction', icon: MessageSquare, capability: 'text' },
  { key: 'imageGeneration', label: 'Image Generation', desc: 'Create visuals from text prompts', icon: Image, capability: 'image-gen' },
  { key: 'imageAnalysis', label: 'Image Analysis', desc: 'Understand & describe images', icon: Eye, capability: 'image-analysis' },
  { key: 'imageEdit', label: 'Image Editing', desc: 'AI-powered image modifications', icon: Wand2, capability: 'image-gen' },
  { key: 'videoGeneration', label: 'Video Generation', desc: 'Generate video clips from text/images', icon: Video, capability: 'video' },
  { key: 'voiceSynthesis', label: 'Voice Synthesis', desc: 'Text-to-speech for voiceovers', icon: Mic, capability: 'tts' },
  { key: 'musicGeneration', label: 'Music Generation', desc: 'AI-composed background music', icon: Music, capability: 'music' },
  { key: 'speechToText', label: 'Speech to Text', desc: 'Transcribe audio to text', icon: Mic, capability: 'stt' },
];

const speedBadge = (speed: string) => {
  const colors: Record<string, string> = { fast: 'bg-success/20 text-success', balanced: 'bg-warning/20 text-warning', slow: 'bg-primary/20 text-primary' };
  return colors[speed] || '';
};

const costBadge = (cost: string) => {
  const colors: Record<string, string> = { 'free-tier': 'bg-success/20 text-success', low: 'bg-success/20 text-success', medium: 'bg-warning/20 text-warning', high: 'bg-destructive/20 text-destructive' };
  return colors[cost] || '';
};

function APIKeyInput({ providerId, onSave }: { providerId: string; onSave: (key: string) => void }) {
  const [value, setValue] = useState('');
  const provider = AI_PROVIDERS.find((p) => p.id === providerId);

  return (
    <div className="flex gap-2 mt-2">
      <input
        type="password"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={provider?.keyPlaceholder || 'Enter API key...'}
        className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono"
      />
      <button
        onClick={() => { if (value.trim()) { onSave(value.trim()); setValue(''); } }}
        disabled={!value.trim()}
        className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        Save
      </button>
    </div>
  );
}

export function APIManagementPanel({ onClose }: { onClose: () => void }) {
  const { preferences, setPreference, resetPreferences, callLogs, totalCalls, totalErrors, avgLatency, clearCallLogs } = useAPIStore();
  const { keys, saveKey, deleteKey, toggleKey, hasKey, loading: keysLoading } = useApiKeys();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'models' | 'keys' | 'providers' | 'logs'>('models');
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);

  const handleSaveKey = async (providerId: string, apiKey: string) => {
    const { error } = await saveKey(providerId, apiKey);
    if (error) {
      toast.error(`Failed to save key: ${error}`);
    } else {
      toast.success(`API key saved for ${AI_PROVIDERS.find(p => p.id === providerId)?.name}`);
    }
  };

  const handleDeleteKey = async (providerId: string) => {
    await deleteKey(providerId);
    toast.success('API key removed');
  };

  const externalProviders = getExternalProviders();

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
              <h2 className="text-base font-semibold text-foreground">Multi-API Engine Manager</h2>
              <p className="text-xs text-muted-foreground font-mono">10 providers · {AI_PROVIDERS.flatMap(p => p.models).length} models · plug & play</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-px border-b border-border bg-border">
          {[
            { icon: BarChart3, label: 'Total Calls', value: totalCalls, color: 'text-primary' },
            { icon: CheckCircle, label: 'Success', value: totalCalls > 0 ? `${Math.round(((totalCalls - totalErrors) / totalCalls) * 100)}%` : '—', color: 'text-success' },
            { icon: Clock, label: 'Avg Latency', value: avgLatency > 0 ? `${avgLatency}ms` : '—', color: 'text-warning' },
            { icon: Key, label: 'Active Keys', value: keys.filter(k => k.is_active).length + 2, color: 'text-accent' },
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
          {([
            { key: 'models' as const, label: 'Model Routing' },
            { key: 'keys' as const, label: 'API Keys' },
            { key: 'providers' as const, label: 'Providers' },
            { key: 'logs' as const, label: 'Call Logs' },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                'flex-1 px-4 py-2.5 text-xs font-medium uppercase tracking-wider transition-colors relative',
                activeTab === key ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
              {key === 'keys' && keys.length > 0 && (
                <span className="ml-1.5 rounded-full bg-primary/20 text-primary px-1.5 py-0.5 text-[9px]">{keys.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-auto max-h-[calc(85vh-220px)] p-6">
          {/* MODEL ROUTING TAB */}
          {activeTab === 'models' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">Select the best engine for each task. External models require API keys.</p>
                <button
                  onClick={resetPreferences}
                  className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </button>
              </div>

              {taskConfig.map(({ key, label, desc, icon: Icon, capability }) => {
                const availableModels = getModelsWithCapability(capability as any);
                const currentModel = getModelById(preferences[key]);
                const needsKey = currentModel && !AI_PROVIDERS.find(p => p.id === currentModel.provider)?.isBuiltIn;
                const keyActive = currentModel ? hasKey(currentModel.provider) : false;

                return (
                  <div key={key} className="rounded-md border border-border bg-background p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary" />
                        <div>
                          <h4 className="text-sm font-medium text-foreground">{label}</h4>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {needsKey && (
                          <span className={cn(
                            'text-[10px] rounded-full px-2 py-0.5 flex items-center gap-1',
                            keyActive ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
                          )}>
                            {keyActive ? <ShieldCheck className="h-2.5 w-2.5" /> : <ShieldAlert className="h-2.5 w-2.5" />}
                            {keyActive ? 'key active' : 'needs key'}
                          </span>
                        )}
                        {currentModel && (
                          <>
                            <span className={`text-[10px] rounded-full px-2 py-0.5 ${speedBadge(currentModel.speed)}`}>{currentModel.speed}</span>
                            <span className={`text-[10px] rounded-full px-2 py-0.5 ${costBadge(currentModel.costTier)}`}>${currentModel.costTier}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <select
                      value={preferences[key]}
                      onChange={(e) => setPreference(key, e.target.value)}
                      className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {availableModels.map((m) => {
                        const prov = AI_PROVIDERS.find(p => p.id === m.provider);
                        const prefix = prov?.isBuiltIn ? '✓' : '🔑';
                        return (
                          <option key={m.id} value={m.id}>
                            {prefix} [{m.providerLabel}] {m.name} — {m.description.slice(0, 50)}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                );
              })}
            </div>
          )}

          {/* API KEYS TAB */}
          {activeTab === 'keys' && (
            <div className="space-y-4">
              <div className="rounded-md border border-primary/20 bg-primary/5 p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-1">Secure API Key Storage</h4>
                    <p className="text-xs text-muted-foreground">
                      Your keys are stored securely in your account. Google AI & OpenAI are built-in and ready to use.
                      Add keys for external providers to unlock video, voice, music, and more.
                    </p>
                  </div>
                </div>
              </div>

              {/* Built-in */}
              <div className="mb-6">
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-success" />
                  Built-in (No key required)
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {AI_PROVIDERS.filter(p => p.isBuiltIn).map((provider) => (
                    <div key={provider.id} className="rounded-md border border-success/20 bg-success/5 p-3 flex items-center gap-3">
                      <span className="text-xl">{provider.logo}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{provider.name}</p>
                        <p className="text-[10px] text-muted-foreground">{provider.models.length} models ready</p>
                      </div>
                      <span className="rounded-full bg-success/20 text-success px-2 py-0.5 text-[10px] font-medium">Active</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* External */}
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Key className="h-3.5 w-3.5 text-warning" />
                External Providers (Add your key)
              </h3>

              <div className="space-y-3">
                {externalProviders.map((provider) => {
                  const existingKey = keys.find((k) => k.provider_id === provider.id);
                  const isExpanded = expandedProvider === provider.id;

                  return (
                    <div key={provider.id} className={cn(
                      'rounded-md border bg-background overflow-hidden transition-colors',
                      existingKey?.is_active ? 'border-success/30' : 'border-border'
                    )}>
                      <button
                        onClick={() => setExpandedProvider(isExpanded ? null : provider.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-card/50 transition-colors"
                      >
                        <span className="text-xl">{provider.logo}</span>
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-sm font-medium text-foreground">{provider.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{provider.description}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-muted-foreground font-mono">{provider.models.length} models</span>
                          {existingKey?.is_active ? (
                            <span className="rounded-full bg-success/20 text-success px-2 py-0.5 text-[10px] font-medium">Connected</span>
                          ) : (
                            <span className="rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-[10px]">Not connected</span>
                          )}
                        </div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 border-t border-border pt-3">
                              {/* Models list */}
                              <div className="flex flex-wrap gap-1.5 mb-3">
                                {provider.models.map((m) => (
                                  <span key={m.id} className="rounded bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground font-mono">
                                    {m.name} ({m.capabilities.join(', ')})
                                  </span>
                                ))}
                              </div>

                              {provider.keyInstructions && (
                                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                                  <ExternalLink className="h-3 w-3" />
                                  {provider.keyInstructions}
                                </p>
                              )}

                              {existingKey ? (
                                <div className="flex items-center justify-between rounded-md bg-card/50 px-3 py-2">
                                  <div>
                                    <span className="text-xs font-mono text-muted-foreground">{existingKey.key_preview}</span>
                                    <span className="text-[10px] text-muted-foreground ml-2">
                                      Updated {new Date(existingKey.updated_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => setExpandedProvider(provider.id + '-edit')}
                                      className="text-[10px] text-primary hover:underline"
                                    >
                                      Update
                                    </button>
                                    <button
                                      onClick={() => handleDeleteKey(provider.id)}
                                      className="rounded p-1 text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              ) : null}

                              {(!existingKey || expandedProvider === provider.id + '-edit') && (
                                <APIKeyInput
                                  providerId={provider.id}
                                  onSave={(key) => {
                                    handleSaveKey(provider.id, key);
                                    setExpandedProvider(null);
                                  }}
                                />
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PROVIDERS TAB */}
          {activeTab === 'providers' && (
            <div className="space-y-4">
              {AI_PROVIDERS.map((provider) => {
                const keyExists = provider.isBuiltIn || hasKey(provider.id);
                return (
                  <div key={provider.id} className="rounded-md border border-border bg-background overflow-hidden">
                    <div className="flex items-center gap-3 border-b border-border px-4 py-3 bg-card/50">
                      <span className="text-xl">{provider.logo}</span>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-foreground">{provider.name}</h4>
                        <p className="text-xs text-muted-foreground">{provider.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {provider.isBuiltIn && (
                          <span className="rounded-full bg-primary/20 text-primary px-2 py-0.5 text-[10px] font-medium">Built-in</span>
                        )}
                        <span className={cn(
                          'rounded-full px-2.5 py-0.5 text-[10px] font-medium',
                          keyExists ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
                        )}>
                          {keyExists ? 'ready' : 'needs key'}
                        </span>
                      </div>
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
                              <span key={cap} className="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground">{cap}</span>
                            ))}
                            <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${speedBadge(model.speed)}`}>{model.speed}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* LOGS TAB */}
          {activeTab === 'logs' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">{callLogs.length} calls logged</p>
                <button
                  onClick={clearCallLogs}
                  className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear logs
                </button>
              </div>

              {callLogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground/40">
                  <Activity className="mx-auto h-8 w-8 mb-2" />
                  <p className="text-sm">No API calls yet</p>
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
