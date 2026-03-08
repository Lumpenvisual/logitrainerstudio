import { useProjectStore, TimelineClip } from '@/store/useProjectStore';
import { useI18n } from '@/i18n/useI18n';
import { Play, Pause, SkipBack, SkipForward, ZoomIn, ZoomOut, Volume2, Film, Plus, GripVertical, Undo2, Redo2, Copy, Trash2 } from 'lucide-react';
import { useRef, useEffect, useCallback, useState } from 'react';

type ResizeEdge = 'left' | 'right';

interface DragState {
  clipId: string;
  offsetX: number;
  originalTrack: 'video' | 'audio';
  originalStartTime: number;
}

interface ResizeState {
  clipId: string;
  edge: ResizeEdge;
  originalStartTime: number;
  originalDuration: number;
}

const SNAP_THRESHOLD_PX = 8; // pixels within which snapping activates

export function TimelineView() {
  const { timeline, setPlayhead, setZoom, togglePlay, scenes, addClip, addLog, updateClip, removeClip, duplicateClip } = useProjectStore();
  const { t } = useI18n();
  const rulerRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRulerDragging, setIsRulerDragging] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragGhost, setDragGhost] = useState<{ x: number; y: number; track: 'video' | 'audio' } | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [resizePreview, setResizePreview] = useState<{ startTime: number; duration: number } | null>(null);
  const [snapLine, setSnapLine] = useState<number | null>(null);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; clipId: string } | null>(null);

  const pxPerSec = timeline.zoom;
  const totalWidth = Math.max(timeline.duration * pxPerSec, 800);
  const snapThresholdSec = SNAP_THRESHOLD_PX / pxPerSec;

  /** Get all snap points (edges of other clips on same track), excluding a given clipId */
  const getSnapPoints = useCallback((excludeClipId: string, track: 'video' | 'audio') => {
    const points: number[] = [0]; // always snap to 0
    timeline.clips.forEach((c) => {
      if (c.id === excludeClipId) return;
      if (c.track !== track) return;
      points.push(c.startTime);
      points.push(c.startTime + c.duration);
    });
    return points;
  }, [timeline.clips]);

  /** Try to snap a time value to the nearest snap point */
  const trySnap = useCallback((time: number, points: number[]): { snapped: number; didSnap: boolean } => {
    let closest = time;
    let minDist = Infinity;
    for (const p of points) {
      const dist = Math.abs(time - p);
      if (dist < minDist) {
        minDist = dist;
        closest = p;
      }
    }
    if (minDist <= snapThresholdSec) {
      return { snapped: closest, didSnap: true };
    }
    return { snapped: Math.round(time * 4) / 4, didSnap: false };
  }, [snapThresholdSec]);

  const canUndo = useProjectStore.temporal.getState().pastStates.length > 0;
  const canRedo = useProjectStore.temporal.getState().futureStates.length > 0;

  const drawRuler = useCallback(() => {
    const canvas = rulerRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const root = document.documentElement;
    const getColor = (varName: string) => {
      const val = getComputedStyle(root).getPropertyValue(varName).trim();
      return val ? `hsl(${val})` : '#888';
    };
    const colorCard = getColor('--card');
    const colorBorder = getColor('--border');
    const colorMutedFg = getColor('--muted-foreground');
    const colorPrimary = getColor('--primary');

    const dpr = window.devicePixelRatio || 1;
    canvas.width = totalWidth * dpr;
    canvas.height = 36 * dpr;
    canvas.style.width = `${totalWidth}px`;
    canvas.style.height = '36px';
    ctx.scale(dpr, dpr);

    ctx.fillStyle = colorCard;
    ctx.fillRect(0, 0, totalWidth, 36);

    for (let sec = 0; sec <= timeline.duration; sec++) {
      const x = sec * pxPerSec;
      const isMajor = sec % 5 === 0;

      if (isMajor) {
        ctx.beginPath();
        ctx.strokeStyle = colorBorder;
        ctx.lineWidth = 1;
        ctx.moveTo(x, 18);
        ctx.lineTo(x, 36);
        ctx.stroke();

        ctx.fillStyle = colorMutedFg;
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        ctx.fillText(`${m}:${s.toString().padStart(2, '0')}`, x, 14);
      } else if (pxPerSec > 30) {
        ctx.beginPath();
        ctx.strokeStyle = colorBorder;
        ctx.lineWidth = 0.5;
        ctx.moveTo(x, 28);
        ctx.lineTo(x, 36);
        ctx.stroke();
      }
    }

    const px = timeline.playheadPosition * pxPerSec;
    ctx.beginPath();
    ctx.fillStyle = colorPrimary;
    ctx.moveTo(px - 6, 0);
    ctx.lineTo(px + 6, 0);
    ctx.lineTo(px + 3, 8);
    ctx.lineTo(px - 3, 8);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = colorPrimary;
    ctx.lineWidth = 2;
    ctx.moveTo(px, 8);
    ctx.lineTo(px, 36);
    ctx.stroke();
  }, [pxPerSec, totalWidth, timeline.duration, timeline.playheadPosition]);

  useEffect(() => { drawRuler(); }, [drawRuler]);

  useEffect(() => {
    if (!timeline.isPlaying) return;
    const interval = setInterval(() => {
      setPlayhead(Math.min(timeline.playheadPosition + 0.05, timeline.duration));
    }, 50);
    return () => clearInterval(interval);
  }, [timeline.isPlaying, timeline.playheadPosition, timeline.duration, setPlayhead]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
      if (e.code === 'Home') setPlayhead(0);
      if (e.code === 'End') setPlayhead(timeline.duration);
      if (e.code === 'ArrowLeft') setPlayhead(Math.max(0, timeline.playheadPosition - 1));
      if (e.code === 'ArrowRight') setPlayhead(Math.min(timeline.duration, timeline.playheadPosition + 1));
      if (e.code === 'Equal' || e.code === 'NumpadAdd') setZoom(Math.min(120, timeline.zoom + 10));
      if (e.code === 'Minus' || e.code === 'NumpadSubtract') setZoom(Math.max(20, timeline.zoom - 10));
      // Clip delete/duplicate
      if (selectedClipId) {
        if (e.code === 'Delete' || e.code === 'Backspace') {
          e.preventDefault();
          removeClip(selectedClipId);
          addLog('info', 'Deleted clip');
          setSelectedClipId(null);
        }
        if (e.key === 'd' && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          duplicateClip(selectedClipId);
          addLog('info', 'Duplicated clip');
        }
      }
      if (e.code === 'Escape') {
        setSelectedClipId(null);
        setContextMenu(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [togglePlay, setPlayhead, setZoom, timeline.playheadPosition, timeline.duration, timeline.zoom, selectedClipId, removeClip, duplicateClip, addLog]);

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const handler = () => setContextMenu(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [contextMenu]);

  // --- Clip drag ---
  const handleClipDragStart = (e: React.MouseEvent, clip: TimelineClip) => {
    if (resizeState) return;
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scrollLeft = containerRef.current?.scrollLeft || 0;
    const offsetX = e.clientX - rect.left + scrollLeft - clip.startTime * pxPerSec - 80;

    setDragState({
      clipId: clip.id,
      offsetX,
      originalTrack: clip.track,
      originalStartTime: clip.startTime,
    });
  };

  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const scrollLeft = containerRef.current?.scrollLeft || 0;
      const x = e.clientX - rect.left + scrollLeft - 80;
      const y = e.clientY - rect.top;

      const trackAreaY = y - 36 - 28;
      let track: 'video' | 'audio' = dragState.originalTrack;
      if (trackAreaY < 64) track = 'video';
      else if (trackAreaY < 128) track = 'audio';

      const rawTime = Math.max(0, Math.min((x - dragState.offsetX) / pxPerSec, timeline.duration - 0.5));
      const clip = timeline.clips.find(c => c.id === dragState.clipId);
      const clipDuration = clip?.duration || 1;

      // Snap both left and right edges
      const snapPoints = getSnapPoints(dragState.clipId, track);
      const { snapped: leftSnap, didSnap: leftDid } = trySnap(rawTime, snapPoints);
      const { snapped: rightSnap, didSnap: rightDid } = trySnap(rawTime + clipDuration, snapPoints);

      let finalTime: number;
      if (leftDid && rightDid) {
        // Pick the closer snap
        finalTime = Math.abs(rawTime - leftSnap) <= Math.abs((rawTime + clipDuration) - rightSnap) ? leftSnap : rightSnap - clipDuration;
      } else if (leftDid) {
        finalTime = leftSnap;
      } else if (rightDid) {
        finalTime = rightSnap - clipDuration;
      } else {
        finalTime = Math.round(rawTime * 4) / 4;
      }

      setSnapLine(leftDid || rightDid ? (leftDid ? finalTime : finalTime + clipDuration) : null);
      setDragGhost({ x: Math.max(0, finalTime), y: e.clientY, track });
    };

    const handleMouseUp = () => {
      if (dragGhost && dragState) {
        updateClip(dragState.clipId, {
          startTime: Math.max(0, dragGhost.x),
          track: dragGhost.track,
        });
        addLog('info', `Moved clip to ${dragGhost.track.toUpperCase()} track at ${dragGhost.x.toFixed(2)}s`);
      }
      setDragState(null);
      setDragGhost(null);
      setSnapLine(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, dragGhost, pxPerSec, timeline.duration, timeline.clips, updateClip, addLog, getSnapPoints, trySnap]);

  // --- Clip resize ---
  const handleResizeStart = (e: React.MouseEvent, clip: TimelineClip, edge: ResizeEdge) => {
    e.preventDefault();
    e.stopPropagation();
    setResizeState({
      clipId: clip.id,
      edge,
      originalStartTime: clip.startTime,
      originalDuration: clip.duration,
    });
    setResizePreview({ startTime: clip.startTime, duration: clip.duration });
  };

  useEffect(() => {
    if (!resizeState) return;

    const clip = timeline.clips.find(c => c.id === resizeState.clipId);
    const track = clip?.track || 'video';
    const snapPoints = getSnapPoints(resizeState.clipId, track);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const scrollLeft = containerRef.current?.scrollLeft || 0;
      const mouseX = e.clientX - rect.left + scrollLeft - 80;
      const mouseTime = mouseX / pxPerSec;

      const MIN_DURATION = 0.5;

      if (resizeState.edge === 'left') {
        const maxNewStart = resizeState.originalStartTime + resizeState.originalDuration - MIN_DURATION;
        const rawStart = Math.max(0, Math.min(mouseTime, maxNewStart));
        const { snapped: snappedStart, didSnap } = trySnap(rawStart, snapPoints);
        const finalStart = didSnap ? snappedStart : Math.round(rawStart * 4) / 4;
        const newDuration = resizeState.originalDuration + (resizeState.originalStartTime - finalStart);
        setSnapLine(didSnap ? finalStart : null);
        setResizePreview({ startTime: finalStart, duration: Math.max(MIN_DURATION, newDuration) });
      } else {
        const rawEnd = mouseTime;
        const { snapped: snappedEnd, didSnap } = trySnap(rawEnd, snapPoints);
        const finalEnd = didSnap ? snappedEnd : Math.round(rawEnd * 4) / 4;
        const newDuration = finalEnd - resizeState.originalStartTime;
        setSnapLine(didSnap ? finalEnd : null);
        setResizePreview({ startTime: resizeState.originalStartTime, duration: Math.max(MIN_DURATION, newDuration) });
      }
    };

    const handleMouseUp = () => {
      if (resizePreview && resizeState) {
        updateClip(resizeState.clipId, {
          startTime: resizePreview.startTime,
          duration: resizePreview.duration,
        });
        addLog('info', `Resized clip: ${resizePreview.duration.toFixed(2)}s starting at ${resizePreview.startTime.toFixed(2)}s`);
      }
      setResizeState(null);
      setResizePreview(null);
      setSnapLine(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizeState, resizePreview, pxPerSec, timeline.clips, updateClip, addLog, getSnapPoints, trySnap]);

  const handleRulerClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = rulerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left + (containerRef.current?.scrollLeft || 0);
    setPlayhead(Math.max(0, Math.min(x / pxPerSec, timeline.duration)));
  };

  const handleRulerDrag = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isRulerDragging) return;
    handleRulerClick(e);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const f = Math.floor((sec % 1) * 30);
    return `${m}:${s.toString().padStart(2, '0')}:${f.toString().padStart(2, '0')}`;
  };

  const addSceneClips = () => {
    let currentTime = 0;
    scenes.forEach((scene) => {
      addClip({ assetId: scene.id, track: 'video', startTime: currentTime, duration: scene.durationTargetSec });
      addClip({ assetId: scene.id, track: 'audio', startTime: currentTime, duration: scene.durationTargetSec });
      currentTime += scene.durationTargetSec;
    });
    addLog('success', `Added ${scenes.length} scenes to timeline`);
  };

  const tracks = [
    { label: 'V1', fullLabel: t('timeline.video.empty'), icon: Film, trackKey: 'video' as const, gradient: 'from-primary/30 to-primary/10', borderColor: 'border-primary/40', hoverBorder: 'border-primary/70' },
    { label: 'A1', fullLabel: t('timeline.audio.empty'), icon: Volume2, trackKey: 'audio' as const, gradient: 'from-success/30 to-success/10', borderColor: 'border-success/40', hoverBorder: 'border-success/70' },
  ];

  const getClipStyle = (clip: TimelineClip) => {
    // Resize preview
    if (resizeState?.clipId === clip.id && resizePreview) {
      return {
        left: resizePreview.startTime * pxPerSec,
        width: resizePreview.duration * pxPerSec,
        opacity: 0.85,
        zIndex: 50,
      };
    }
    // Drag ghost
    if (dragState?.clipId === clip.id && dragGhost) {
      return {
        left: dragGhost.x * pxPerSec,
        width: clip.duration * pxPerSec,
        opacity: 0.7,
        zIndex: 50,
      };
    }
    return {
      left: clip.startTime * pxPerSec,
      width: clip.duration * pxPerSec,
    };
  };

  const isDropTarget = (trackKey: 'video' | 'audio') => {
    return dragState && dragGhost?.track === trackKey;
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => useProjectStore.temporal.getState().undo()}
            className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => useProjectStore.temporal.getState().redo()}
            className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="h-4 w-4" />
          </button>
          <div className="w-px h-5 bg-border mx-1" />
          <button onClick={() => setPlayhead(0)} className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" title={t('timeline.start')}>
            <SkipBack className="h-4 w-4" />
          </button>
          <button onClick={togglePlay} className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground transition-all hover:bg-primary/90 glow-primary" title={t('timeline.play')}>
            {timeline.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </button>
          <button onClick={() => setPlayhead(timeline.duration)} className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" title={t('timeline.end')}>
            <SkipForward className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5">
          <span className="font-mono text-sm text-primary tabular-nums tracking-wider">{formatTime(timeline.playheadPosition)}</span>
          <span className="text-xs text-muted-foreground/50">/</span>
          <span className="font-mono text-sm text-muted-foreground tabular-nums tracking-wider">{formatTime(timeline.duration)}</span>
        </div>

        <div className="flex items-center gap-3">
          {scenes.length > 0 && timeline.clips.length === 0 && (
            <button onClick={addSceneClips} className="flex items-center gap-1.5 rounded-md border border-primary/30 px-3 py-1.5 text-xs font-medium text-primary transition-all hover:bg-primary/10">
              <Plus className="h-3 w-3" />
              {t('timeline.addscenes')}
            </button>
          )}

          <div className="flex items-center gap-2">
            <ZoomOut className="h-3.5 w-3.5 text-muted-foreground" />
            <input type="range" min={20} max={120} value={timeline.zoom} onChange={(e) => setZoom(Number(e.target.value))} className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-border accent-primary" />
            <ZoomIn className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[10px] font-mono text-muted-foreground w-8">{timeline.zoom}px</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-border bg-card/50 px-4 py-1">
        {[
          { key: 'Space', action: t('timeline.play') },
          { key: '←→', action: t('timeline.seek') },
          { key: '+−', action: t('timeline.zoom') },
          { key: '⌘Z', action: 'Undo' },
          { key: '⌘⇧Z', action: 'Redo' },
          { key: 'Drag edge', action: 'Resize' },
        ].map(({ key, action }) => (
          <span key={key} className="text-[10px] text-muted-foreground/50">
            <kbd className="rounded bg-border/50 px-1 py-0.5 font-mono text-[9px] text-muted-foreground">{key}</kbd>{' '}{action}
          </span>
        ))}
      </div>

      <div className="flex-1 overflow-auto" ref={containerRef}>
        <div style={{ width: totalWidth, minWidth: '100%' }}>
          <canvas
            ref={rulerRef}
            onClick={handleRulerClick}
            onMouseDown={() => setIsRulerDragging(true)}
            onMouseMove={handleRulerDrag}
            onMouseUp={() => setIsRulerDragging(false)}
            onMouseLeave={() => setIsRulerDragging(false)}
            className="cursor-pointer border-b border-border"
          />

          {tracks.map(({ label, fullLabel, icon: Icon, trackKey, gradient, borderColor, hoverBorder }) => {
            const trackClips = timeline.clips.filter((c) => {
              if (dragState?.clipId === c.id && dragGhost) {
                return dragGhost.track === trackKey;
              }
              return c.track === trackKey;
            });
            const dropActive = isDropTarget(trackKey);

            return (
              <div key={label} className={`flex border-b transition-colors ${dropActive ? 'border-primary/60 bg-primary/5' : 'border-border'}`}>
                <div className="flex w-20 shrink-0 flex-col items-center justify-center border-r border-border bg-card py-4 gap-1">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-mono text-muted-foreground font-bold">{label}</span>
                </div>
                <div className="relative flex-1 bg-background/30" style={{ minHeight: 64 }}>
                  <div className="absolute top-0 bottom-0 w-px bg-primary/80 z-10 pointer-events-none" style={{ left: timeline.playheadPosition * pxPerSec }} />
                  {/* Magnetic snap line */}
                  {snapLine !== null && (
                    <div className="absolute top-0 bottom-0 w-px bg-yellow-400 z-20 pointer-events-none opacity-80" style={{ left: snapLine * pxPerSec }}>
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-yellow-400" />
                    </div>
                  )}

                  {trackClips.map((clip, idx) => {
                    const scene = scenes.find((s) => s.id === clip.assetId);
                    const isDragged = dragState?.clipId === clip.id;
                    const isResizing = resizeState?.clipId === clip.id;
                    const style = getClipStyle(clip);
                    const isActive = isDragged || isResizing;

                    return (
                      <div
                        key={clip.id}
                        className={`absolute top-1.5 bottom-1.5 rounded border ${isActive ? hoverBorder : borderColor} bg-gradient-to-r ${gradient} flex items-center select-none transition-shadow ${isActive ? 'shadow-lg shadow-primary/20 ring-1 ring-primary/30' : 'hover:shadow-lg hover:shadow-primary/10'} group`}
                        style={style}
                        onMouseDown={(e) => handleClipDragStart(e, clip)}
                      >
                        {/* Left resize handle */}
                        <div
                          className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize z-20 flex items-center justify-center hover:bg-foreground/10 rounded-l transition-colors"
                          onMouseDown={(e) => handleResizeStart(e, clip, 'left')}
                        >
                          <div className="w-0.5 h-4 bg-foreground/20 rounded-full group-hover:bg-foreground/40 transition-colors" />
                        </div>

                        <div className="flex items-center px-3 min-w-0 flex-1">
                          <GripVertical className="h-3 w-3 text-muted-foreground/40 shrink-0 cursor-grab active:cursor-grabbing mr-1" />
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[10px] font-mono font-bold text-foreground/70 shrink-0">S{scene?.sceneNumber || idx + 1}</span>
                            {(style.width || 0) > 80 && (
                              <span className="text-[9px] font-mono text-muted-foreground truncate">
                                {resizeState?.clipId === clip.id && resizePreview
                                  ? `${resizePreview.duration.toFixed(1)}s`
                                  : `${clip.duration}s`}
                              </span>
                            )}
                          </div>
                          {trackKey === 'audio' && (style.width || 0) > 60 && (
                            <div className="ml-2 flex items-center gap-px h-5 flex-1 overflow-hidden">
                              {Array.from({ length: Math.floor((style.width || 0) / 4) }).map((_, j) => (
                                <div key={j} className="w-0.5 bg-success/40 rounded-full shrink-0" style={{ height: `${Math.random() * 100}%`, minHeight: 2 }} />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Right resize handle */}
                        <div
                          className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize z-20 flex items-center justify-center hover:bg-foreground/10 rounded-r transition-colors"
                          onMouseDown={(e) => handleResizeStart(e, clip, 'right')}
                        >
                          <div className="w-0.5 h-4 bg-foreground/20 rounded-full group-hover:bg-foreground/40 transition-colors" />
                        </div>
                      </div>
                    );
                  })}

                  {trackClips.length === 0 && !dropActive && (
                    <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground/30 font-mono">{fullLabel}</div>
                  )}
                  {dropActive && trackClips.length === 0 && (
                    <div className="flex h-full items-center justify-center text-[10px] text-primary/50 font-mono">Drop here</div>
                  )}
                </div>
              </div>
            );
          })}

          <div className="flex border-b border-border/50">
            <div className="flex w-20 shrink-0 items-center justify-center border-r border-border/50 bg-card/50 py-3">
              <Plus className="h-3 w-3 text-muted-foreground/30" />
            </div>
            <div className="flex-1 bg-background/10" style={{ minHeight: 40 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
