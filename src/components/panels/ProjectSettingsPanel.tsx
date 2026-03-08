import { useProjectStore } from '@/store/useProjectStore';
import { motion } from 'framer-motion';
import { X, Monitor, Film, Music, Settings2 } from 'lucide-react';
import { useState } from 'react';

const RESOLUTIONS = [
  { label: '4K UHD', width: 3840, height: 2160 },
  { label: '1080p Full HD', width: 1920, height: 1080 },
  { label: '720p HD', width: 1280, height: 720 },
  { label: '480p SD', width: 854, height: 480 },
  { label: '1080x1080 Square', width: 1080, height: 1080 },
  { label: '1080x1920 Vertical', width: 1080, height: 1920 },
];

const FPS_OPTIONS = [24, 25, 30, 48, 50, 60];
const SAMPLE_RATES = [22050, 44100, 48000, 96000];

export function ProjectSettingsPanel({ onClose }: { onClose: () => void }) {
  const { projectSettings, updateProjectSettings, projectTitle, setProjectTitle } = useProjectStore();
  const [title, setTitle] = useState(projectTitle);

  const currentRes = RESOLUTIONS.find(
    (r) => r.width === projectSettings.resolution.width && r.height === projectSettings.resolution.height
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
        className="w-[520px] rounded-2xl border border-border bg-card shadow-2xl shadow-background/50 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
              <Settings2 className="h-4 w-4 text-primary" />
            </div>
            <h2 className="font-display text-base font-bold text-foreground">Project Settings</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Project Title */}
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Project Name</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setProjectTitle(title)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>

          {/* Resolution */}
          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
              <Monitor className="h-3 w-3" /> Resolution
            </label>
            <div className="grid grid-cols-3 gap-2">
              {RESOLUTIONS.map((res) => {
                const active = res.width === projectSettings.resolution.width && res.height === projectSettings.resolution.height;
                return (
                  <button
                    key={res.label}
                    onClick={() => updateProjectSettings({
                      resolution: { width: res.width, height: res.height },
                      aspectRatio: res.width === res.height ? '1:1' : res.width > res.height ? '16:9' : '9:16',
                    })}
                    className={`rounded-lg border px-3 py-2 text-left transition-all ${
                      active
                        ? 'border-primary/50 bg-primary/10 text-primary'
                        : 'border-border bg-secondary/20 text-muted-foreground hover:border-primary/30'
                    }`}
                  >
                    <p className="text-xs font-semibold">{res.label}</p>
                    <p className="text-[9px] font-mono text-muted-foreground/50">{res.width}×{res.height}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* FPS */}
          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
              <Film className="h-3 w-3" /> Frame Rate
            </label>
            <div className="flex gap-2">
              {FPS_OPTIONS.map((fps) => (
                <button
                  key={fps}
                  onClick={() => updateProjectSettings({ fps })}
                  className={`flex-1 rounded-lg border px-3 py-2 text-center text-xs font-mono font-bold transition-all ${
                    projectSettings.fps === fps
                      ? 'border-primary/50 bg-primary/10 text-primary'
                      : 'border-border bg-secondary/20 text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  {fps}fps
                </button>
              ))}
            </div>
          </div>

          {/* Sample Rate */}
          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
              <Music className="h-3 w-3" /> Audio Sample Rate
            </label>
            <div className="flex gap-2">
              {SAMPLE_RATES.map((rate) => (
                <button
                  key={rate}
                  onClick={() => updateProjectSettings({ sampleRate: rate })}
                  className={`flex-1 rounded-lg border px-3 py-2 text-center text-[10px] font-mono font-bold transition-all ${
                    projectSettings.sampleRate === rate
                      ? 'border-primary/50 bg-primary/10 text-primary'
                      : 'border-border bg-secondary/20 text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  {(rate / 1000).toFixed(1)}kHz
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-lg border border-border/50 bg-secondary/20 p-3">
            <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider mb-1">Current Configuration</p>
            <p className="text-xs text-foreground font-mono">
              {projectSettings.resolution.width}×{projectSettings.resolution.height} · {projectSettings.fps}fps · {projectSettings.aspectRatio} · {(projectSettings.sampleRate / 1000).toFixed(1)}kHz
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
