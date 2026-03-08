import { useProjectStore } from '@/store/useProjectStore';
import { useAPIStore } from '@/store/useAPIStore';
import { useI18n } from '@/i18n/useI18n';
import { Sparkles, Film, Clock, Image, Mic, Video, Loader2, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateScript } from '@/services/aiService';
import { getModelById } from '@/services/apiRegistry';

export function ArchitectView() {
  const { brief, setBrief, scenes, addScenes, clearScenes, isGeneratingScript, setGeneratingScript, addLog } = useProjectStore();
  const { preferences, addCallLog } = useAPIStore();
  const { t } = useI18n();

  const handleGenerate = async () => {
    if (!brief.trim()) return;
    setGeneratingScript(true);
    clearScenes();
    const model = preferences.scriptGeneration;
    const modelInfo = getModelById(model);
    addLog('info', `Generating script with ${modelInfo?.name || model}...`);

    const result = await generateScript(brief, model, 4);

    if (result.error) {
      addLog('error', `Script generation failed: ${result.error}`);
      addCallLog({ function: 'generate-script', model, status: 'error', latencyMs: result.latencyMs || 0, error: result.error });
    } else if (result.data) {
      addScenes(result.data.scenes);
      addLog('success', `Generated ${result.data.scenes.length} scenes in ${result.latencyMs}ms`);
      addCallLog({ function: 'generate-script', model: result.model || model, status: 'success', latencyMs: result.latencyMs || 0 });
    }

    setGeneratingScript(false);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-6">
        <h2 className="mb-1 text-lg font-semibold text-foreground">{t('architect.title')}</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {t('architect.desc')}{' '}
          <span className="text-primary font-mono text-xs">{getModelById(preferences.scriptGeneration)?.name || 'AI'}</span>
        </p>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder={t('architect.placeholder')}
              className="h-20 w-full resize-none rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGeneratingScript || !brief.trim()}
            className="flex h-20 w-40 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground font-medium text-sm transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed glow-primary"
          >
            {isGeneratingScript ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isGeneratingScript ? t('architect.generating') : t('architect.generate')}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <AnimatePresence mode="wait">
          {scenes.length === 0 && !isGeneratingScript ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-full items-center justify-center">
              <div className="text-center">
                <Film className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">{t('architect.empty')}</p>
              </div>
            </motion.div>
          ) : isGeneratingScript && scenes.length === 0 ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-full items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto mb-3 h-12 w-12 animate-spin text-primary" />
                <p className="text-sm text-primary font-medium">{t('architect.genscript')}</p>
                <p className="text-xs text-muted-foreground mt-1">{t('architect.using')} {getModelById(preferences.scriptGeneration)?.name}</p>
              </div>
            </motion.div>
          ) : (
            <motion.div key="scenes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-4 lg:grid-cols-2">
              {scenes.map((scene, i) => (
                <motion.div
                  key={scene.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group rounded-md border border-border bg-card p-4 transition-all hover:border-primary/30"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/20 text-xs font-bold text-primary font-mono">
                        {scene.sceneNumber}
                      </span>
                      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{scene.sceneType}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                      <Clock className="h-3 w-3" />
                      {scene.durationTargetSec}s
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <Image className="h-3 w-3" /> {t('architect.visual')}
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed">{scene.visualPrompt}</p>
                  </div>

                  <div className="mb-3">
                    <div className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <Mic className="h-3 w-3" /> {t('architect.voiceover')}
                    </div>
                    <p className="text-sm text-foreground/60 italic leading-relaxed">"{scene.voiceOverScript}"</p>
                  </div>

                  <div className="flex items-center gap-2 border-t border-border pt-3">
                    {(['image', 'audio', 'video'] as const).map((type) => {
                      const IconMap = { image: Image, audio: Mic, video: Video };
                      const Icon = IconMap[type];
                      const status = scene.status[type];
                      return (
                        <span key={type} className="flex items-center gap-1 rounded bg-secondary px-2 py-1 text-xs font-mono text-muted-foreground">
                          <Icon className="h-3 w-3" />
                          {status}
                        </span>
                      );
                    })}
                    <button className="ml-auto text-muted-foreground hover:text-primary transition-colors">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
