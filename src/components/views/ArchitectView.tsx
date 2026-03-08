import { useProjectStore } from '@/store/useProjectStore';
import { useAPIStore } from '@/store/useAPIStore';
import { useI18n } from '@/i18n/useI18n';
import { Sparkles, Film, Clock, Image, Mic, Video, Loader2, Pencil, Check, X, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateScript } from '@/services/aiService';
import { getModelById } from '@/services/apiRegistry';
import { toast } from 'sonner';
import { useState, useRef, useEffect } from 'react';

export function ArchitectView() {
  const { brief, setBrief, scenes, addScenes, clearScenes, isGeneratingScript, setGeneratingScript, addLog, updateScene } = useProjectStore();
  const { preferences, addCallLog } = useAPIStore();
  const { t } = useI18n();
  const [editingScene, setEditingScene] = useState<string | null>(null);
  const [editVisual, setEditVisual] = useState('');
  const [editVoice, setEditVoice] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleGenerate = async () => {
    if (!brief.trim()) return;
    setGeneratingScript(true);
    clearScenes();
    const model = preferences.scriptGeneration;
    const modelInfo = getModelById(model);
    addLog('info', `Generating script with ${modelInfo?.name || model}...`);
    toast.loading(t('architect.genscript'), { id: 'script-gen' });

    const result = await generateScript(brief, model, 4);

    if (result.error) {
      addLog('error', `Script generation failed: ${result.error}`);
      addCallLog({ function: 'generate-script', model, status: 'error', latencyMs: result.latencyMs || 0, error: result.error });
      toast.error(result.error, { id: 'script-gen' });
    } else if (result.data) {
      addScenes(result.data.scenes);
      addLog('success', `Generated ${result.data.scenes.length} scenes in ${result.latencyMs}ms`);
      addCallLog({ function: 'generate-script', model: result.model || model, status: 'success', latencyMs: result.latencyMs || 0 });
      toast.success(`${result.data.scenes.length} scenes generated`, { id: 'script-gen' });
    }

    setGeneratingScript(false);
  };

  const startEdit = (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene) return;
    setEditingScene(sceneId);
    setEditVisual(scene.visualPrompt);
    setEditVoice(scene.voiceOverScript);
  };

  const saveEdit = () => {
    if (!editingScene) return;
    updateScene(editingScene, { visualPrompt: editVisual, voiceOverScript: editVoice });
    addLog('info', `Updated scene prompts`);
    toast.success('Scene updated');
    setEditingScene(null);
  };

  const cancelEdit = () => {
    setEditingScene(null);
  };

  // Auto-focus textarea on brief area
  useEffect(() => {
    if (scenes.length === 0 && !isGeneratingScript) {
      textareaRef.current?.focus();
    }
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-5">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="font-display text-base font-bold text-foreground">{t('architect.title')}</h2>
          <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[9px] font-mono font-bold text-primary tracking-wider">
            {getModelById(preferences.scriptGeneration)?.name || 'AI'}
          </span>
        </div>
        <p className="mb-3 text-xs text-muted-foreground leading-relaxed">
          {t('architect.desc')}
        </p>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder={t('architect.placeholder')}
              className="h-[72px] w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGeneratingScript || !brief.trim()}
            className="flex h-[72px] w-36 items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-display font-bold text-sm transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed glow-primary"
          >
            {isGeneratingScript ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isGeneratingScript ? t('architect.generating') : t('architect.generate')}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-5">
        <AnimatePresence mode="wait">
          {scenes.length === 0 && !isGeneratingScript ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-full items-center justify-center">
              <div className="text-center">
                <Film className="mx-auto mb-3 h-12 w-12 text-muted-foreground/15" />
                <p className="text-sm text-muted-foreground/50 max-w-xs">{t('architect.empty')}</p>
              </div>
            </motion.div>
          ) : isGeneratingScript && scenes.length === 0 ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-full items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-primary font-display font-semibold">{t('architect.genscript')}</p>
                <p className="text-xs text-muted-foreground/50 mt-1 font-mono">{t('architect.using')} {getModelById(preferences.scriptGeneration)?.name}</p>
              </div>
            </motion.div>
          ) : (
            <motion.div key="scenes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-3 lg:grid-cols-2">
              {scenes.map((scene, i) => {
                const isEditing = editingScene === scene.id;
                return (
                  <motion.div
                    key={scene.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={`group rounded-xl border bg-card/50 p-4 transition-all ${
                      isEditing ? 'border-primary/40 ring-1 ring-primary/20' : 'border-border/50 hover:border-primary/20'
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-[10px] font-bold text-primary font-mono">
                          {scene.sceneNumber}
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 font-display">{scene.sceneType}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground/50 font-mono">
                          <Clock className="h-3 w-3" />
                          {scene.durationTargetSec}s
                        </div>
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <button onClick={saveEdit} className="rounded-md p-1 text-success hover:bg-success/10 transition-colors">
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={cancelEdit} className="rounded-md p-1 text-destructive hover:bg-destructive/10 transition-colors">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(scene.id)}
                            className="opacity-0 group-hover:opacity-100 rounded-md p-1 text-muted-foreground hover:text-primary transition-all"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mb-2.5">
                      <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
                        <Image className="h-3 w-3" /> {t('architect.visual')}
                      </div>
                      {isEditing ? (
                        <textarea
                          value={editVisual}
                          onChange={(e) => setEditVisual(e.target.value)}
                          className="w-full h-16 resize-none rounded-md border border-border bg-background px-2.5 py-2 text-xs text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
                        />
                      ) : (
                        <p className="text-xs text-foreground/70 leading-relaxed">{scene.visualPrompt}</p>
                      )}
                    </div>

                    <div className="mb-3">
                      <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
                        <Mic className="h-3 w-3" /> {t('architect.voiceover')}
                      </div>
                      {isEditing ? (
                        <textarea
                          value={editVoice}
                          onChange={(e) => setEditVoice(e.target.value)}
                          className="w-full h-12 resize-none rounded-md border border-border bg-background px-2.5 py-2 text-xs text-foreground/60 italic focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
                        />
                      ) : (
                        <p className="text-xs text-foreground/45 italic leading-relaxed">"{scene.voiceOverScript}"</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 border-t border-border/30 pt-2.5">
                      {(['image', 'audio', 'video'] as const).map((type) => {
                        const IconMap = { image: Image, audio: Mic, video: Video };
                        const Icon = IconMap[type];
                        const status = scene.status[type];
                        return (
                          <span key={type} className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-mono ${
                            status === 'ready' ? 'bg-success/10 text-success' :
                            status === 'generating' ? 'bg-warning/10 text-warning' :
                            status === 'error' ? 'bg-destructive/10 text-destructive' :
                            'bg-secondary/50 text-muted-foreground/50'
                          }`}>
                            <Icon className="h-2.5 w-2.5" />
                            {status}
                          </span>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}