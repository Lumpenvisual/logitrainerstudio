import { useProjectStore } from '@/store/useProjectStore';
import { motion } from 'framer-motion';
import { X, Download, Film, Monitor, Zap, Check, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const FORMATS = [
  { id: 'mp4', label: 'MP4 (H.264)', ext: '.mp4', desc: 'Best compatibility' },
  { id: 'webm', label: 'WebM (VP9)', ext: '.webm', desc: 'Web optimized' },
  { id: 'mov', label: 'MOV (ProRes)', ext: '.mov', desc: 'Professional editing' },
  { id: 'gif', label: 'GIF', ext: '.gif', desc: 'Animated preview' },
];

const QUALITY_PRESETS = [
  { id: 'draft', label: 'Draft', bitrate: '2 Mbps', desc: 'Fast preview', icon: Zap },
  { id: 'standard', label: 'Standard', bitrate: '8 Mbps', desc: 'Good quality', icon: Film },
  { id: 'high', label: 'High', bitrate: '20 Mbps', desc: 'Production ready', icon: Monitor },
  { id: 'max', label: 'Maximum', bitrate: '50 Mbps', desc: 'Lossless quality', icon: Download },
];

export function RenderExportPanel({ onClose }: { onClose: () => void }) {
  const { projectTitle, projectSettings, timeline, scenes } = useProjectStore();
  const [format, setFormat] = useState('mp4');
  const [quality, setQuality] = useState('high');
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);

  const estimatedSize = () => {
    const bitrateMap: Record<string, number> = { draft: 2, standard: 8, high: 20, max: 50 };
    const mbps = bitrateMap[quality] || 8;
    const duration = timeline.duration;
    const sizeMB = (mbps * duration) / 8;
    return sizeMB < 1000 ? `~${Math.round(sizeMB)} MB` : `~${(sizeMB / 1000).toFixed(1)} GB`;
  };

  const handleRender = async () => {
    setIsRendering(true);
    setProgress(0);

    // Simulate render progress
    for (let i = 0; i <= 100; i += 2) {
      await new Promise((r) => setTimeout(r, 50));
      setProgress(i);
    }

    // Export project JSON as a proxy for actual render
    const exportData = {
      version: '1.0',
      format,
      quality,
      settings: projectSettings,
      exportedAt: new Date().toISOString(),
      project: {
        title: projectTitle,
        scenes,
        timeline,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectTitle.replace(/\s+/g, '_').toLowerCase()}_render.json`;
    a.click();
    URL.revokeObjectURL(url);

    setIsRendering(false);
    toast.success('Export complete!');
    onClose();
  };

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
        className="w-[560px] rounded-2xl border border-border bg-card shadow-2xl shadow-background/50 overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 border border-success/20">
              <Download className="h-4 w-4 text-success" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-foreground">Render & Export</h2>
              <p className="text-[10px] text-muted-foreground">
                {projectSettings.resolution.width}×{projectSettings.resolution.height} · {projectSettings.fps}fps · {timeline.clips.length} clips
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Format */}
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Output Format</label>
            <div className="grid grid-cols-2 gap-2">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  className={`rounded-lg border px-3 py-2.5 text-left transition-all ${
                    format === f.id
                      ? 'border-primary/50 bg-primary/10'
                      : 'border-border bg-secondary/20 hover:border-primary/30'
                  }`}
                >
                  <p className={`text-xs font-bold ${format === f.id ? 'text-primary' : 'text-foreground'}`}>{f.label}</p>
                  <p className="text-[9px] text-muted-foreground/50">{f.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Quality */}
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Quality Preset</label>
            <div className="grid grid-cols-4 gap-2">
              {QUALITY_PRESETS.map(({ id, label, bitrate, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setQuality(id)}
                  className={`flex flex-col items-center rounded-lg border px-2 py-3 transition-all ${
                    quality === id
                      ? 'border-primary/50 bg-primary/10'
                      : 'border-border bg-secondary/20 hover:border-primary/30'
                  }`}
                >
                  <Icon className={`h-4 w-4 mb-1.5 ${quality === id ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className={`text-[10px] font-bold ${quality === id ? 'text-primary' : 'text-foreground'}`}>{label}</p>
                  <p className="text-[8px] font-mono text-muted-foreground/50">{bitrate}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-lg border border-border/50 bg-secondary/20 p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">Estimated Output</p>
              <p className="text-xs text-foreground font-mono mt-0.5">
                {FORMATS.find((f) => f.id === format)?.label} · {QUALITY_PRESETS.find((q) => q.id === quality)?.bitrate} · {estimatedSize()}
              </p>
            </div>
            <span className="text-xs font-mono text-muted-foreground/40">{Math.round(timeline.duration)}s</span>
          </div>

          {/* Render progress or button */}
          {isRendering ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-primary font-medium">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Rendering...
                </span>
                <span className="font-mono text-muted-foreground">{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-border overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-success"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </div>
          ) : (
            <button
              onClick={handleRender}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-success px-4 py-3 text-sm font-bold text-success-foreground transition-all hover:brightness-110 glow-primary font-display"
            >
              <Download className="h-4 w-4" />
              Start Render
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
