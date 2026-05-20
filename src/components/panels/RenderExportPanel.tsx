import { useProjectStore } from '@/store/useProjectStore';
import { motion } from 'framer-motion';
import {
  X, Download, Film, Monitor, Zap, Loader2, Youtube, Instagram, Clapperboard,
  Smartphone, Tv, Share2, FileText, Subtitles,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { renderVideo, type RenderProgress } from '@/lib/videoRenderer';
import { storeScenesToClassic, countScenesWithImages } from '@/lib/sceneAdapters';
import { downloadBlob, downloadTextFile, generateSRTFromStoreScenes } from '@/lib/exportUtils';

const PLATFORM_PRESETS = [
  { id: 'youtube', label: 'YouTube', icon: Youtube, res: '1920×1080', fps: 30, format: 'mp4', color: 'text-destructive' },
  { id: 'instagram', label: 'Instagram Reels', icon: Instagram, res: '1080×1920', fps: 30, format: 'mp4', color: 'text-primary' },
  { id: 'tiktok', label: 'TikTok', icon: Smartphone, res: '1080×1920', fps: 30, format: 'mp4', color: 'text-warning' },
];

const CODECS = [
  { id: 'h264', label: 'H.264', desc: 'Universal' },
  { id: 'vp9', label: 'VP9 WebM', desc: 'Web export' },
  { id: 'prores', label: 'ProRes', desc: 'Editing' },
];

const QUALITY_PRESETS = [
  { id: 'draft', label: 'Draft', bitrate: '4 Mbps', icon: Zap },
  { id: 'standard', label: 'Standard', bitrate: '12 Mbps', icon: Film },
  { id: 'high', label: 'High', bitrate: '25 Mbps', icon: Monitor },
];

type ExportMode = 'canvas' | 'json';

export function RenderExportPanel({ onClose }: { onClose: () => void }) {
  const { projectTitle, projectSettings, timeline, scenes, assets } = useProjectStore();
  const [codec, setCodec] = useState('h264');
  const [quality, setQuality] = useState('high');
  const [exportMode, setExportMode] = useState<ExportMode>('canvas');
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [renderPhase, setRenderPhase] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [burnCaptions, setBurnCaptions] = useState(true);

  const classicScenes = storeScenesToClassic(scenes, assets);
  const imagesReady = countScenesWithImages(classicScenes);

  const handleSelectPlatform = (id: string) => {
    setSelectedPlatform(selectedPlatform === id ? null : id);
    const preset = PLATFORM_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    const codecMap: Record<string, string> = { mp4: 'h264', mov: 'prores', webm: 'vp9' };
    setCodec(codecMap[preset.format] || 'h264');
    if (preset.id === 'instagram' || preset.id === 'tiktok') {
      useProjectStore.getState().updateProjectSettings({
        resolution: { width: 1080, height: 1920 },
        aspectRatio: '9:16',
      });
    } else {
      useProjectStore.getState().updateProjectSettings({
        resolution: { width: 1920, height: 1080 },
        aspectRatio: '16:9',
      });
    }
  };

  const exportProjectJson = () => {
    const data = {
      version: '2.0',
      codec,
      quality,
      platform: selectedPlatform,
      settings: projectSettings,
      exportedAt: new Date().toISOString(),
      project: { title: projectTitle, scenes, timeline },
    };
    downloadTextFile(
      JSON.stringify(data, null, 2),
      `${projectTitle.replace(/\s+/g, '_').toLowerCase()}_project.json`,
      'application/json',
    );
  };

  const handleRender = async () => {
    if (scenes.length === 0) {
      toast.error('Añade escenas antes de exportar');
      return;
    }
    if (exportMode === 'json') {
      exportProjectJson();
      toast.success('Proyecto exportado (JSON)');
      onClose();
      return;
    }

    setIsRendering(true);
    setProgress(0);
    setRenderPhase('loading');
    try {
      const { width, height } = projectSettings.resolution;
      const scenesForRender = classicScenes.map((s) => ({
        ...s,
        script: burnCaptions ? s.script : '',
      }));
      const blob = await renderVideo(
        scenesForRender,
        (p: RenderProgress) => {
          setProgress(Math.round(p.percent));
          setRenderPhase(p.phase);
        },
        { width, height, fps: projectSettings.fps },
      );
      const safeName = projectTitle.replace(/\s+/g, '_').toLowerCase() || 'logitrainer_export';
      downloadBlob(blob, `${safeName}.webm`);
      toast.success(
        imagesReady > 0
          ? `Video WebM (${imagesReady}/${scenes.length} escenas con imagen)`
          : 'Video WebM generado (añade imágenes en Studio para mejor calidad)',
      );
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al renderizar');
    } finally {
      setIsRendering(false);
      setProgress(0);
      setRenderPhase('');
    }
  };

  const durationSec = Math.round(
    timeline.duration || scenes.reduce((s, sc) => s + sc.durationTargetSec, 0),
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-[640px] max-h-[85vh] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col"
      >
        <motion.div className="flex items-center justify-between border-b border-border p-4">
          <motion.div className="flex items-center gap-3">
            <motion.div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 border border-success/20">
              <Download className="h-4 w-4 text-success" />
            </motion.div>
            <motion.div>
              <h2 className="font-display text-base font-bold text-foreground">Render & Export</h2>
              <p className="text-[10px] text-muted-foreground">
                {projectSettings.resolution.width}×{projectSettings.resolution.height} · {scenes.length} escenas · {imagesReady} con imagen
              </p>
            </motion.div>
          </motion.div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </motion.div>

        <motion.div className="flex-1 overflow-auto p-5 space-y-5">
          <motion.div className="flex gap-2 p-1 rounded-lg bg-secondary/30 border border-border">
            <button
              type="button"
              onClick={() => setExportMode('canvas')}
              className={`flex-1 rounded-md py-2 text-[10px] font-bold ${exportMode === 'canvas' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            >
              Video Canvas (WebM)
            </button>
            <button
              type="button"
              onClick={() => setExportMode('json')}
              className={`flex-1 rounded-md py-2 text-[10px] font-bold ${exportMode === 'json' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            >
              Backup JSON
            </button>
          </motion.div>

          {exportMode === 'canvas' && (
            <>
              <motion.div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-2">
                  <Share2 className="inline h-3 w-3 mr-1" /> Platform
                </label>
                <motion.div className="grid grid-cols-3 gap-2">
                  {PLATFORM_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPlatform(p.id)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left ${selectedPlatform === p.id ? 'border-primary/50 bg-primary/10' : 'border-border'}`}
                    >
                      <p.icon className={`h-4 w-4 ${p.color}`} />
                      <span className="text-[10px] font-bold">{p.label}</span>
                    </button>
                  ))}
                </motion.div>
              </motion.div>
              <motion.div className="flex gap-4">
                <label className="flex items-center gap-2 text-[10px] cursor-pointer">
                  <input type="checkbox" checked={burnCaptions} onChange={(e) => setBurnCaptions(e.target.checked)} />
                  Burn-in captions
                </label>
              </motion.div>
            </>
          )}

          <motion.div className="rounded-lg border border-border/50 bg-secondary/20 p-3 flex justify-between">
            <span className="text-xs font-mono">
              {exportMode === 'canvas' ? 'WebM VP9' : 'JSON backup'} · {durationSec}s
            </span>
          </motion.div>

          <motion.div className="flex gap-2">
            <button
              type="button"
              disabled={!scenes.length}
              onClick={() => {
                const srt = generateSRTFromStoreScenes(scenes);
                if (!srt) { toast.error('Sin guion para SRT'); return; }
                downloadTextFile(srt, `${projectTitle}_subtitles.srt`, 'text/plain');
                toast.success('SRT exportado');
              }}
              className="flex-1 flex items-center justify-center gap-1 rounded-lg border py-2 text-[10px] font-bold"
            >
              <Subtitles className="h-3.5 w-3.5" /> SRT
            </button>
            <button
              type="button"
              disabled={!scenes.length}
              onClick={() => { exportProjectJson(); toast.success('JSON exportado'); }}
              className="flex-1 flex items-center justify-center gap-1 rounded-lg border py-2 text-[10px] font-bold"
            >
              <FileText className="h-3.5 w-3.5" /> JSON
            </button>
          </motion.div>

          {isRendering ? (
            <motion.div className="space-y-2">
              <motion.div className="flex justify-between text-xs">
                <span className="flex items-center gap-1 text-primary">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {renderPhase || 'rendering'}…
                </span>
                <span>{progress}%</span>
              </motion.div>
              <motion.div className="h-2 rounded-full bg-border overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </motion.div>
            </motion.div>
          ) : (
            <button
              type="button"
              onClick={handleRender}
              disabled={!scenes.length}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-success py-3 text-sm font-bold text-success-foreground disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {exportMode === 'canvas' ? 'Render Video (WebM)' : 'Export Project JSON'}
            </button>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
