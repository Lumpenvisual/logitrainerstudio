import { useProjectStore } from '@/store/useProjectStore';
import { useI18n } from '@/i18n/useI18n';
import { Play, Pause, SkipBack, SkipForward, ZoomIn, ZoomOut, Volume2, Film, Plus } from 'lucide-react';
import { useRef, useEffect, useCallback, useState } from 'react';

export function TimelineView() {
  const { timeline, setPlayhead, setZoom, togglePlay, scenes, addClip, addLog } = useProjectStore();
  const { t } = useI18n();
  const rulerRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const pxPerSec = timeline.zoom;
  const totalWidth = Math.max(timeline.duration * pxPerSec, 800);

  const drawRuler = useCallback(() => {
    const canvas = rulerRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Read CSS variables for theme-aware colors
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
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [togglePlay, setPlayhead, setZoom, timeline.playheadPosition, timeline.duration, timeline.zoom]);

  const handleRulerClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = rulerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left + (containerRef.current?.scrollLeft || 0);
    setPlayhead(Math.max(0, Math.min(x / pxPerSec, timeline.duration)));
  };

  const handleRulerDrag = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
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
    { label: 'V1', fullLabel: t('timeline.video.empty'), icon: Film, trackKey: 'video' as const, gradient: 'from-primary/30 to-primary/10', borderColor: 'border-primary/40' },
    { label: 'A1', fullLabel: t('timeline.audio.empty'), icon: Volume2, trackKey: 'audio' as const, gradient: 'from-success/30 to-success/10', borderColor: 'border-success/40' },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
        <div className="flex items-center gap-1">
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
          { key: 'Home', action: t('timeline.start') },
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
            onMouseDown={() => setIsDragging(true)}
            onMouseMove={handleRulerDrag}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            className="cursor-pointer border-b border-border"
          />

          {tracks.map(({ label, fullLabel, icon: Icon, trackKey, gradient, borderColor }) => {
            const trackClips = timeline.clips.filter((c) => c.track === trackKey);
            return (
              <div key={label} className="flex border-b border-border">
                <div className="flex w-20 shrink-0 flex-col items-center justify-center border-r border-border bg-card py-4 gap-1">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-mono text-muted-foreground font-bold">{label}</span>
                </div>
                <div className="relative flex-1 bg-background/30" style={{ minHeight: 64 }}>
                  <div className="absolute top-0 bottom-0 w-px bg-primary/80 z-10 pointer-events-none" style={{ left: timeline.playheadPosition * pxPerSec }} />

                  {trackClips.map((clip, idx) => {
                    const scene = scenes.find((s) => s.id === clip.assetId);
                    return (
                      <div
                        key={clip.id}
                        className={`absolute top-1.5 bottom-1.5 rounded border ${borderColor} bg-gradient-to-r ${gradient} flex items-center px-2 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-lg hover:shadow-primary/10`}
                        style={{ left: clip.startTime * pxPerSec, width: clip.duration * pxPerSec }}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[10px] font-mono font-bold text-foreground/70 shrink-0">S{scene?.sceneNumber || idx + 1}</span>
                          {clip.duration * pxPerSec > 80 && (
                            <span className="text-[9px] font-mono text-muted-foreground truncate">{clip.duration}s</span>
                          )}
                        </div>
                        {trackKey === 'audio' && clip.duration * pxPerSec > 60 && (
                          <div className="ml-2 flex items-center gap-px h-5 flex-1 overflow-hidden">
                            {Array.from({ length: Math.floor(clip.duration * pxPerSec / 4) }).map((_, j) => (
                              <div key={j} className="w-0.5 bg-success/40 rounded-full shrink-0" style={{ height: `${Math.random() * 100}%`, minHeight: 2 }} />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {trackClips.length === 0 && (
                    <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground/30 font-mono">{fullLabel}</div>
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
