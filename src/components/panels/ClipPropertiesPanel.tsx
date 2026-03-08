import { useProjectStore } from '@/store/useProjectStore';
import { useI18n } from '@/i18n/useI18n';
import { X, Film, Volume2, Eye, Clock, Type, Sliders } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function ClipPropertiesPanel() {
  const { selectedClipId, setSelectedClipId, timeline, updateClip, scenes } = useProjectStore();
  const clip = timeline.clips.find((c) => c.id === selectedClipId);

  const [localName, setLocalName] = useState('');
  const [localDuration, setLocalDuration] = useState('');
  const [localOpacity, setLocalOpacity] = useState(100);
  const [localVolume, setLocalVolume] = useState(100);

  // Sync local state when clip changes
  useEffect(() => {
    if (!clip) return;
    const scene = scenes.find((s) => s.id === clip.assetId);
    setLocalName(clip.name || `Scene ${scene?.sceneNumber || '?'}`);
    setLocalDuration(clip.duration.toFixed(2));
    setLocalOpacity(clip.opacity ?? 100);
    setLocalVolume(clip.volume ?? 100);
  }, [clip?.id]);

  if (!clip) return null;

  const scene = scenes.find((s) => s.id === clip.assetId);

  const commitName = () => {
    if (localName.trim()) updateClip(clip.id, { name: localName.trim() });
  };

  const commitDuration = () => {
    const val = parseFloat(localDuration);
    if (!isNaN(val) && val >= 0.25) updateClip(clip.id, { duration: val });
  };

  const commitOpacity = (val: number) => {
    setLocalOpacity(val);
    updateClip(clip.id, { opacity: val });
  };

  const commitVolume = (val: number) => {
    setLocalVolume(val);
    updateClip(clip.id, { volume: val });
  };

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 280, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex h-full flex-col border-l border-border bg-card/50 backdrop-blur-sm overflow-hidden"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/15">
            <Sliders className="h-3.5 w-3.5 text-primary" />
          </div>
          <h3 className="text-xs font-bold text-foreground font-display">Clip Properties</h3>
        </div>
        <button
          onClick={() => setSelectedClipId(null)}
          className="rounded-md p-1 text-muted-foreground/50 hover:text-foreground hover:bg-secondary transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-5">
        {/* Clip info header */}
        <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-secondary/30 p-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${clip.track === 'video' ? 'bg-primary/15 text-primary' : 'bg-success/15 text-success'}`}>
            {clip.track === 'video' ? <Film className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">
              S{scene?.sceneNumber || '?'} — {clip.track === 'video' ? 'Video' : 'Audio'}
            </p>
            <p className="text-[10px] text-muted-foreground font-mono">
              {clip.startTime.toFixed(2)}s → {(clip.startTime + clip.duration).toFixed(2)}s
            </p>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="flex items-center gap-1.5 mb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            <Type className="h-3 w-3" /> Name
          </label>
          <input
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => e.key === 'Enter' && commitName()}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Duration */}
        <div>
          <label className="flex items-center gap-1.5 mb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            <Clock className="h-3 w-3" /> Duration (seconds)
          </label>
          <input
            type="number"
            step={0.25}
            min={0.25}
            value={localDuration}
            onChange={(e) => setLocalDuration(e.target.value)}
            onBlur={commitDuration}
            onKeyDown={(e) => e.key === 'Enter' && commitDuration()}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Opacity (video only) */}
        {clip.track === 'video' && (
          <div>
            <label className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                <Eye className="h-3 w-3" /> Opacity
              </span>
              <span className="text-[10px] font-mono text-primary font-bold">{localOpacity}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={localOpacity}
              onChange={(e) => commitOpacity(Number(e.target.value))}
              className="w-full h-1.5 cursor-pointer appearance-none rounded-full bg-border accent-primary"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-muted-foreground/40 font-mono">0%</span>
              <span className="text-[9px] text-muted-foreground/40 font-mono">100%</span>
            </div>
          </div>
        )}

        {/* Volume */}
        <div>
          <label className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              <Volume2 className="h-3 w-3" /> Volume
            </span>
            <span className="text-[10px] font-mono text-primary font-bold">{localVolume}%</span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={localVolume}
            onChange={(e) => commitVolume(Number(e.target.value))}
            className="w-full h-1.5 cursor-pointer appearance-none rounded-full bg-border accent-primary"
          />
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-muted-foreground/40 font-mono">Mute</span>
            <span className="text-[9px] text-muted-foreground/40 font-mono">100%</span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="border-t border-border/50 pt-4">
          <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider mb-2">Shortcuts</p>
          <div className="space-y-1.5">
            {[
              { key: 'D', action: 'Duplicate clip' },
              { key: 'Del', action: 'Delete clip' },
              { key: '⌘Z', action: 'Undo' },
              { key: '⌘⇧Z', action: 'Redo' },
            ].map(({ key, action }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground/60">{action}</span>
                <kbd className="rounded bg-secondary border border-border px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground">{key}</kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
