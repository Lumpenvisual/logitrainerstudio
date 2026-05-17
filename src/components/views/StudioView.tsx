import { useProjectStore } from '@/store/useProjectStore';
import { useAPIStore } from '@/store/useAPIStore';
import { useI18n } from '@/i18n/useI18n';
import { Image, Mic, Video, Loader2, Zap, Layers, Check, AlertCircle, Eye, Wand2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { generateAudio, generateImage } from '@/services/aiService';
import { getModelById } from '@/services/apiRegistry';
import { toast } from 'sonner';

export function StudioView({ onOpenImageLab }: { onOpenImageLab: (sceneId: string) => void }) {
  const { scenes, updateScene, addLog, addAsset, assets: projectAssets } = useProjectStore();
  const { preferences, addCallLog } = useAPIStore();
  const { t } = useI18n();
  const [generatingAssets, setGeneratingAssets] = useState<Record<string, Record<string, boolean>>>({});
  const [sceneImages, setSceneImages] = useState<Record<string, string>>({});

  if (scenes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Layers className="mx-auto mb-3 h-12 w-12 text-muted-foreground/15" />
          <p className="text-sm text-muted-foreground/50">{t('studio.empty')}</p>
        </div>
      </div>
    );
  }

  const generateAsset = async (sceneId: string, type: 'image' | 'audio' | 'video') => {
    const scene = scenes.find((s) => s.id === sceneId);
    if (!scene) return;

    setGeneratingAssets((prev) => ({ ...prev, [sceneId]: { ...prev[sceneId], [type]: true } }));
    updateScene(sceneId, { status: { ...scene.status, [type]: 'generating' } });

    if (type === 'image') {
      const model = preferences.imageGeneration;
      addLog('info', `Generating image for scene ${scene.sceneNumber} with ${getModelById(model)?.name}...`);

      const result = await generateImage(scene.visualPrompt, model);

      if (result.error) {
        addLog('error', `Image gen failed: ${result.error}`);
        updateScene(sceneId, { status: { ...scene.status, image: 'error' } });
        addCallLog({ function: 'generate-image', model, status: 'error', latencyMs: result.latencyMs || 0, error: result.error });
        toast.error(`Scene ${scene.sceneNumber}: ${result.error}`);
      } else if (result.data) {
        setSceneImages((prev) => ({ ...prev, [sceneId]: result.data!.imageUrl }));
        const assetId = addAsset({ type: 'image', url: result.data.imageUrl, duration: scene.durationTargetSec, name: `Scene ${scene.sceneNumber} Image` });
        updateScene(sceneId, { status: { ...scene.status, image: 'ready' }, assets: { ...scene.assets, image: assetId } });
        addLog('success', `Image ready for scene ${scene.sceneNumber} (${result.latencyMs}ms)`);
        addCallLog({ function: 'generate-image', model: result.model || model, status: 'success', latencyMs: result.latencyMs || 0 });
        toast.success(`Scene ${scene.sceneNumber} image ready`);
      }
    } else if (type === 'audio') {
      const model = preferences.voiceSynthesis.startsWith('google/')
        ? preferences.voiceSynthesis
        : 'google/gemini-2.5-flash-preview-tts';
      const script = scene.voiceOverScript?.trim() || scene.visualPrompt;
      addLog('info', `Generating voiceover for scene ${scene.sceneNumber} with ${getModelById(model)?.name || 'Gemini TTS'}...`);

      const result = await generateAudio(script, model, 'es');

      if (result.error) {
        addLog('error', `Audio gen failed: ${result.error}`);
        updateScene(sceneId, { status: { ...scene.status, audio: 'error' } });
        addCallLog({ function: 'generate-audio', model, status: 'error', latencyMs: result.latencyMs || 0, error: result.error });
        toast.error(`Scene ${scene.sceneNumber}: ${result.error}`);
      } else if (result.data?.audioUrl) {
        const assetId = addAsset({
          type: 'audio',
          url: result.data.audioUrl,
          duration: scene.durationTargetSec,
          name: `Scene ${scene.sceneNumber} Voiceover`,
        });
        updateScene(sceneId, {
          status: { ...scene.status, audio: 'ready' },
          assets: { ...scene.assets, audio: assetId },
        });
        addLog('success', `Audio ready for scene ${scene.sceneNumber} (${result.latencyMs}ms)`);
        addCallLog({ function: 'generate-audio', model: result.model || model, status: 'success', latencyMs: result.latencyMs || 0 });
        toast.success(`Scene ${scene.sceneNumber} audio ready`);
      }
    } else {
      addLog('info', `Generating ${type} for scene ${scene.sceneNumber} (simulated)...`);
      await new Promise((r) => setTimeout(r, 3000));
      updateScene(sceneId, { status: { ...scene.status, [type]: 'ready' } });
      addLog('success', `${type} ready for scene ${scene.sceneNumber}`);
      toast.success(`Scene ${scene.sceneNumber} ${type} ready`);
    }

    setGeneratingAssets((prev) => ({ ...prev, [sceneId]: { ...prev[sceneId], [type]: false } }));
  };

  const generateAll = () => {
    scenes.forEach((scene, i) => {
      setTimeout(() => generateAsset(scene.id, 'image'), i * 1000);
    });
  };

  const statusIcon = (status: string) => {
    if (status === 'generating') return <Loader2 className="h-3 w-3 animate-spin text-warning" />;
    if (status === 'ready') return <Check className="h-3 w-3 text-success" />;
    if (status === 'error') return <AlertCircle className="h-3 w-3 text-destructive" />;
    return <div className="h-3 w-3 rounded-full border border-border/50" />;
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-display text-base font-bold text-foreground">{t('studio.title')}</h2>
              <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[9px] font-mono font-bold text-primary tracking-wider">
                {getModelById(preferences.imageGeneration)?.name}
              </span>
            </div>
            <p className="text-xs text-muted-foreground/60">{t('studio.desc')}</p>
          </div>
          <button
            onClick={generateAll}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground transition-all hover:brightness-110 glow-primary font-display"
          >
            <Zap className="h-3.5 w-3.5" />
            {t('studio.genall')}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-5">
        <div className="space-y-4">
          {scenes.map((scene, i) => (
            <motion.div
              key={scene.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-xl border border-border/50 bg-card/50 overflow-hidden"
            >
              <div className="flex items-center gap-3 border-b border-border/30 px-4 py-2.5 bg-surface-highlight/20">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-[10px] font-bold text-primary font-mono">
                  {scene.sceneNumber}
                </span>
                <div className="flex-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 font-display">{scene.sceneType}</span>
                  <span className="mx-2 text-border/50">·</span>
                  <span className="text-[10px] font-mono text-muted-foreground/40">{scene.durationTargetSec}s</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {(['image', 'audio', 'video'] as const).map((type) => (
                    <div key={type} className="flex items-center gap-1 rounded-md bg-background/50 px-2 py-0.5">
                      {statusIcon(scene.status[type])}
                      <span className="text-[9px] font-mono text-muted-foreground/50 capitalize">{type}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 p-4">
                <div
                  className={`relative h-32 w-56 shrink-0 rounded-lg border border-border/30 overflow-hidden group cursor-pointer ${
                    sceneImages[scene.id] ? '' : 'bg-secondary/30'
                  }`}
                  onClick={() => scene.status.image === 'ready' && onOpenImageLab(scene.id)}
                >
                  {sceneImages[scene.id] && (
                    <img src={sceneImages[scene.id]} alt={`Scene ${scene.sceneNumber}`} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                  )}
                  {scene.status.image === 'generating' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                      <div className="text-center">
                        <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary mb-1" />
                        <span className="text-[9px] font-mono text-muted-foreground/60">{t('common.generating')}</span>
                      </div>
                    </div>
                  )}
                  {scene.status.image === 'ready' && sceneImages[scene.id] && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                      <div className="flex gap-2">
                        <button className="flex items-center gap-1 rounded-md bg-primary/20 px-2 py-1 text-[10px] font-medium text-primary">
                          <Eye className="h-3 w-3" /> {t('studio.view')}
                        </button>
                        <button className="flex items-center gap-1 rounded-md bg-primary/20 px-2 py-1 text-[10px] font-medium text-primary">
                          <Wand2 className="h-3 w-3" /> {t('studio.edit')}
                        </button>
                      </div>
                    </div>
                  )}
                  {scene.status.image === 'idle' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Image className="h-8 w-8 text-muted-foreground/15" />
                    </div>
                  )}
                  {scene.status.image === 'generating' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-border/30">
                      <motion.div className="h-full bg-primary" initial={{ width: '0%' }} animate={{ width: '90%' }} transition={{ duration: 8, ease: 'linear' }} />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground/70 leading-relaxed mb-2 line-clamp-2">{scene.visualPrompt}</p>
                  <p className="text-[11px] text-muted-foreground/40 italic mb-3 line-clamp-1">"{scene.voiceOverScript}"</p>
                  {scene.status.audio === 'ready' && scene.assets.audio && projectAssets[scene.assets.audio]?.url && (
                    <audio
                      controls
                      preload="none"
                      className="mb-3 h-8 w-full max-w-md"
                      src={projectAssets[scene.assets.audio].url}
                    />
                  )}
                  <motion.div className="flex gap-2">
                    {[
                      { type: 'image' as const, icon: Image, label: t('common.image') },
                      { type: 'audio' as const, icon: Mic, label: t('common.audio') },
                      { type: 'video' as const, icon: Video, label: t('common.video') },
                    ].map(({ type, icon: Icon, label }) => {
                      const isGen = generatingAssets[scene.id]?.[type];
                      const isReady = scene.status[type] === 'ready';
                      return (
                        <button
                          key={type}
                          onClick={() => !isGen && generateAsset(scene.id, type)}
                          disabled={!!isGen}
                          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-all ${
                            isReady ? 'border-success/20 bg-success/5 text-success'
                            : isGen ? 'border-warning/20 bg-warning/5 text-warning cursor-wait'
                            : 'border-border/50 bg-secondary/30 text-muted-foreground hover:border-primary/30 hover:text-primary'
                          }`}
                        >
                          {isGen ? <Loader2 className="h-3 w-3 animate-spin" /> : <Icon className="h-3 w-3" />}
                          {isGen ? t('studio.working') : isReady ? `${label} ✓` : `${t('studio.gen')} ${label}`}
                        </button>
                      );
                    })}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}