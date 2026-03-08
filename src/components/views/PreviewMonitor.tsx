import { useProjectStore } from '@/store/useProjectStore';
import { Film, Play, Image as ImageIcon } from 'lucide-react';
import { useMemo } from 'react';

/**
 * Preview Monitor — shows the scene image at the current playhead position.
 * Designed to sit above or beside the timeline like Premiere/DaVinci preview.
 */
export function PreviewMonitor() {
  const { timeline, scenes } = useProjectStore();

  // Find the video clip at the current playhead position
  const currentClip = useMemo(() => {
    return timeline.clips.find(
      (c) =>
        c.track === 'video' &&
        timeline.playheadPosition >= c.startTime &&
        timeline.playheadPosition < c.startTime + c.duration
    );
  }, [timeline.clips, timeline.playheadPosition]);

  const currentScene = currentClip
    ? scenes.find((s) => s.id === currentClip.assetId)
    : null;

  const currentImage = currentScene?.assets?.image
    ? undefined // We don't have direct URL in assets object, use scene state
    : undefined;

  // Format timecode
  const formatTC = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const f = Math.floor((sec % 1) * 30);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${f.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col border-b border-border bg-card/30">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/50">
        <Play className="h-3 w-3 text-primary" />
        <span className="text-[10px] font-bold font-display text-foreground">Preview</span>
        <span className="ml-auto font-mono text-[10px] text-primary tabular-nums">{formatTC(timeline.playheadPosition)}</span>
      </div>
      <div className="relative flex items-center justify-center bg-background/80 overflow-hidden" style={{ height: 160 }}>
        {currentScene ? (
          <div className="flex h-full w-full">
            {/* Scene thumbnail / visual info */}
            <div className="flex-1 flex items-center justify-center relative">
              {currentScene.status.image === 'ready' ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-full h-full flex items-center justify-center bg-secondary/20">
                    <ImageIcon className="h-8 w-8 text-primary/20" />
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                      <span className="text-[9px] font-mono text-muted-foreground/60 bg-background/80 rounded px-1.5 py-0.5">
                        Scene {currentScene.sceneNumber} — {currentScene.sceneType}
                      </span>
                      <span className="text-[9px] font-mono text-primary/60 bg-background/80 rounded px-1.5 py-0.5">
                        {currentScene.durationTargetSec}s
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <Film className="mx-auto h-6 w-6 text-muted-foreground/20 mb-1" />
                  <p className="text-[10px] text-muted-foreground/40 font-mono">
                    Scene {currentScene.sceneNumber}
                  </p>
                  <p className="text-[9px] text-muted-foreground/30 italic max-w-[200px] truncate">
                    {currentScene.visualPrompt.slice(0, 60)}...
                  </p>
                </div>
              )}
            </div>

            {/* Scene metadata sidebar */}
            <div className="w-44 border-l border-border/50 p-2.5 flex flex-col justify-between bg-card/50">
              <div>
                <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider mb-1">Visual Prompt</p>
                <p className="text-[10px] text-foreground/60 leading-relaxed line-clamp-3">
                  {currentScene.visualPrompt}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider mb-1">Voiceover</p>
                <p className="text-[10px] text-foreground/40 italic leading-relaxed line-clamp-2">
                  "{currentScene.voiceOverScript.slice(0, 80)}"
                </p>
              </div>
              <div className="flex items-center gap-2 mt-1">
                {(['image', 'audio', 'video'] as const).map((type) => (
                  <span
                    key={type}
                    className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${
                      currentScene.status[type] === 'ready'
                        ? 'bg-success/10 text-success'
                        : currentScene.status[type] === 'generating'
                        ? 'bg-warning/10 text-warning'
                        : 'bg-secondary/50 text-muted-foreground/40'
                    }`}
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <Film className="mx-auto h-8 w-8 text-muted-foreground/10 mb-1" />
            <p className="text-[10px] text-muted-foreground/30 font-mono">
              {timeline.clips.length === 0 ? 'Add clips to preview' : 'Move playhead over a clip'}
            </p>
          </div>
        )}

        {/* Playing indicator */}
        {timeline.isPlaying && (
          <div className="absolute top-2 right-2 flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
            <span className="text-[9px] font-mono text-destructive font-bold">REC</span>
          </div>
        )}
      </div>
    </div>
  );
}
