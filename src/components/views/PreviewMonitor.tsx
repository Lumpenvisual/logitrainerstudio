import { useProjectStore, TimelineClip, TimelineTransition, TransitionType } from '@/store/useProjectStore';
import { Film, Play, Pause, Maximize2, Volume2, VolumeX } from 'lucide-react';
import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TRANSITION_LABELS: Record<TransitionType, string> = {
  'none': 'Cut',
  'fade': 'Fade',
  'dissolve': 'Dissolve',
  'wipe-left': 'Wipe ←',
  'wipe-right': 'Wipe →',
  'wipe-up': 'Wipe ↑',
  'wipe-down': 'Wipe ↓',
  'zoom-in': 'Zoom In',
  'zoom-out': 'Zoom Out',
  'slide-left': 'Slide ←',
  'slide-right': 'Slide →',
};

/**
 * Sequence Player — renders scenes in sequence with transition effects.
 * Shows current scene, transition overlays, and playback controls.
 */
export function PreviewMonitor() {
  const { timeline, scenes, togglePlay, setPlayhead } = useProjectStore();
  const [isMuted, setIsMuted] = useState(false);
  const [isFullPreview, setIsFullPreview] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Find the video clip at the current playhead position
  const currentClip = useMemo(() => {
    return timeline.clips
      .filter((c) => c.track === 'video')
      .sort((a, b) => a.startTime - b.startTime)
      .find(
        (c) =>
          timeline.playheadPosition >= c.startTime &&
          timeline.playheadPosition < c.startTime + c.duration
      );
  }, [timeline.clips, timeline.playheadPosition]);

  const currentScene = currentClip
    ? scenes.find((s) => s.id === currentClip.assetId)
    : null;

  // Find active transition
  const activeTransition = useMemo(() => {
    if (!currentClip) return null;
    const transitions = timeline.transitions || [];
    for (const t of transitions) {
      const fromClip = timeline.clips.find((c) => c.id === t.fromClipId);
      const toClip = timeline.clips.find((c) => c.id === t.toClipId);
      if (!fromClip || !toClip) continue;

      const transitionStart = fromClip.startTime + fromClip.duration - t.duration;
      const transitionEnd = fromClip.startTime + fromClip.duration;

      if (timeline.playheadPosition >= transitionStart && timeline.playheadPosition < transitionEnd) {
        const progress = (timeline.playheadPosition - transitionStart) / t.duration;
        return { transition: t, progress, fromClip, toClip };
      }
    }
    return null;
  }, [timeline.clips, timeline.transitions, timeline.playheadPosition, currentClip]);

  // Get sorted video clips for mini-timeline
  const videoClips = useMemo(() => {
    return timeline.clips
      .filter((c) => c.track === 'video')
      .sort((a, b) => a.startTime - b.startTime);
  }, [timeline.clips]);

  const totalDuration = useMemo(() => {
    if (videoClips.length === 0) return timeline.duration;
    const last = videoClips[videoClips.length - 1];
    return Math.max(last.startTime + last.duration, timeline.duration);
  }, [videoClips, timeline.duration]);

  // Format timecode
  const formatTC = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const f = Math.floor((sec % 1) * 30);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${f.toString().padStart(2, '0')}`;
  };

  // Render transition effect on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, w, h);

    if (!activeTransition) return;

    const { transition, progress } = activeTransition;

    switch (transition.type) {
      case 'fade':
        ctx.fillStyle = `rgba(0,0,0,${progress})`;
        ctx.fillRect(0, 0, w, h);
        break;
      case 'dissolve':
        ctx.fillStyle = `rgba(0,0,0,${Math.sin(progress * Math.PI) * 0.5})`;
        ctx.fillRect(0, 0, w, h);
        break;
      case 'wipe-left':
        ctx.fillStyle = 'hsl(250, 95%, 64%)';
        ctx.globalAlpha = 0.15;
        ctx.fillRect(0, 0, w * progress, h);
        ctx.globalAlpha = 1;
        // Wipe line
        ctx.strokeStyle = 'hsl(250, 95%, 64%)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w * progress, 0);
        ctx.lineTo(w * progress, h);
        ctx.stroke();
        break;
      case 'wipe-right':
        ctx.fillStyle = 'hsl(250, 95%, 64%)';
        ctx.globalAlpha = 0.15;
        ctx.fillRect(w * (1 - progress), 0, w * progress, h);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = 'hsl(250, 95%, 64%)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w * (1 - progress), 0);
        ctx.lineTo(w * (1 - progress), h);
        ctx.stroke();
        break;
      case 'wipe-up':
      case 'wipe-down': {
        const y = transition.type === 'wipe-down' ? h * progress : h * (1 - progress);
        ctx.fillStyle = 'hsl(250, 95%, 64%)';
        ctx.globalAlpha = 0.15;
        ctx.fillRect(0, transition.type === 'wipe-down' ? 0 : y, w, h * progress);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = 'hsl(250, 95%, 64%)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
        break;
      }
      case 'zoom-in':
        ctx.fillStyle = `rgba(0,0,0,${progress * 0.3})`;
        ctx.fillRect(0, 0, w, h);
        break;
      case 'zoom-out':
        ctx.fillStyle = `rgba(0,0,0,${(1 - progress) * 0.3})`;
        ctx.fillRect(0, 0, w, h);
        break;
      case 'slide-left':
      case 'slide-right': {
        const dir = transition.type === 'slide-left' ? -1 : 1;
        ctx.fillStyle = 'hsl(250, 95%, 64%)';
        ctx.globalAlpha = 0.08;
        ctx.fillRect(dir > 0 ? w * (1 - progress) : 0, 0, w * progress, h);
        ctx.globalAlpha = 1;
        break;
      }
    }
  }, [activeTransition]);

  // Mini-timeline click handler
  const handleMiniTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    setPlayhead(Math.max(0, Math.min(pct * totalDuration, totalDuration)));
  }, [setPlayhead, totalDuration]);

  const previewHeight = isFullPreview ? 300 : 160;

  return (
    <div className="flex flex-col border-b border-border bg-card/30">
      {/* Header bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/50">
        <button
          onClick={togglePlay}
          className="flex h-5 w-5 items-center justify-center rounded bg-primary/15 text-primary hover:bg-primary/25 transition-colors"
        >
          {timeline.isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
        </button>
        <span className="text-[10px] font-bold font-display text-foreground">Sequence Player</span>

        {activeTransition && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
            {TRANSITION_LABELS[activeTransition.transition.type]} {Math.round(activeTransition.progress * 100)}%
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="text-muted-foreground/50 hover:text-foreground transition-colors"
          >
            {isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
          </button>
          <button
            onClick={() => setIsFullPreview(!isFullPreview)}
            className="text-muted-foreground/50 hover:text-foreground transition-colors"
          >
            <Maximize2 className="h-3 w-3" />
          </button>
          <span className="font-mono text-[10px] text-primary tabular-nums">{formatTC(timeline.playheadPosition)}</span>
        </div>
      </div>

      {/* Main preview area */}
      <div
        className="relative flex items-center justify-center bg-background/80 overflow-hidden transition-all duration-300"
        style={{ height: previewHeight }}
      >
        {currentScene ? (
          <div className="flex h-full w-full">
            {/* Scene viewport */}
            <div className="flex-1 flex items-center justify-center relative">
              {/* Scene visual */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-full h-full flex items-center justify-center bg-secondary/10">
                  {/* Scene number badge */}
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 backdrop-blur-sm text-[11px] font-bold text-primary font-mono border border-primary/20">
                      {currentScene.sceneNumber}
                    </span>
                    <span className="text-[10px] font-semibold text-foreground/80 font-display bg-background/60 backdrop-blur-sm rounded px-2 py-0.5">
                      {currentScene.sceneType}
                    </span>
                  </div>

                  {/* Center visual prompt display */}
                  <div className="text-center px-8 max-w-sm">
                    <Film className="mx-auto h-8 w-8 text-muted-foreground/15 mb-2" />
                    <p className="text-[11px] text-foreground/50 leading-relaxed line-clamp-3">
                      {currentScene.visualPrompt}
                    </p>
                  </div>

                  {/* Clip opacity overlay */}
                  {currentClip && (currentClip.opacity ?? 100) < 100 && (
                    <div
                      className="absolute inset-0 bg-background pointer-events-none"
                      style={{ opacity: 1 - (currentClip.opacity ?? 100) / 100 }}
                    />
                  )}

                  {/* Transition effect canvas overlay */}
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                  />

                  {/* Bottom info bar */}
                  <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2 bg-gradient-to-t from-background/80 to-transparent">
                    <div className="flex items-center gap-2">
                      {(['image', 'audio', 'video'] as const).map((type) => (
                        <span
                          key={type}
                          className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${
                            currentScene.status[type] === 'ready'
                              ? 'bg-success/15 text-success'
                              : currentScene.status[type] === 'generating'
                              ? 'bg-warning/15 text-warning'
                              : 'bg-secondary/50 text-muted-foreground/40'
                          }`}
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                    <span className="text-[9px] font-mono text-muted-foreground/50">
                      {currentScene.durationTargetSec}s
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Metadata sidebar */}
            {isFullPreview && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 200, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="border-l border-border/50 p-3 flex flex-col gap-3 bg-card/50 overflow-hidden"
              >
                <div>
                  <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider mb-1">Visual Prompt</p>
                  <p className="text-[10px] text-foreground/60 leading-relaxed line-clamp-4">
                    {currentScene.visualPrompt}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider mb-1">Voiceover</p>
                  <p className="text-[10px] text-foreground/40 italic leading-relaxed line-clamp-3">
                    "{currentScene.voiceOverScript}"
                  </p>
                </div>
                {currentClip && (
                  <div className="border-t border-border/30 pt-2">
                    <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider mb-1">Clip</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-muted-foreground/50">Opacity</span>
                        <span className="text-foreground/70 font-mono">{currentClip.opacity ?? 100}%</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-muted-foreground/50">Volume</span>
                        <span className="text-foreground/70 font-mono">{currentClip.volume ?? 100}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
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
            <span className="text-[9px] font-mono text-destructive font-bold">PLAY</span>
          </div>
        )}
      </div>

      {/* Mini timeline / scrub bar */}
      <div
        className="h-6 bg-card/50 border-t border-border/30 cursor-pointer relative group"
        onClick={handleMiniTimelineClick}
      >
        {/* Clip thumbnails */}
        {videoClips.map((clip) => {
          const scene = scenes.find((s) => s.id === clip.assetId);
          const left = totalDuration > 0 ? (clip.startTime / totalDuration) * 100 : 0;
          const width = totalDuration > 0 ? (clip.duration / totalDuration) * 100 : 0;
          return (
            <div
              key={clip.id}
              className={`absolute top-0.5 bottom-0.5 rounded-sm ${
                clip.id === currentClip?.id
                  ? 'bg-primary/30 border border-primary/50'
                  : 'bg-primary/10 border border-primary/20'
              }`}
              style={{ left: `${left}%`, width: `${width}%` }}
            >
              <span className="text-[7px] font-mono text-primary/60 px-1 truncate block leading-5">
                {scene ? `S${scene.sceneNumber}` : ''}
              </span>
            </div>
          );
        })}

        {/* Transition markers */}
        {(timeline.transitions || []).map((t) => {
          const fromClip = timeline.clips.find((c) => c.id === t.fromClipId);
          if (!fromClip) return null;
          const pos = totalDuration > 0
            ? ((fromClip.startTime + fromClip.duration) / totalDuration) * 100
            : 0;
          return (
            <div
              key={t.id}
              className="absolute top-0 bottom-0 w-0.5 bg-warning/60 z-10"
              style={{ left: `${pos}%` }}
            />
          );
        })}

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-primary z-20 pointer-events-none"
          style={{ left: `${totalDuration > 0 ? (timeline.playheadPosition / totalDuration) * 100 : 0}%` }}
        >
          <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary" />
        </div>
      </div>
    </div>
  );
}
