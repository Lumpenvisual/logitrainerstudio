import { useProjectStore } from '@/store/useProjectStore';
import { Play, Pause, SkipBack, ZoomIn, ZoomOut, Volume2, Film } from 'lucide-react';
import { useRef, useEffect, useCallback } from 'react';

export function TimelineView() {
  const { timeline, setPlayhead, setZoom, togglePlay } = useProjectStore();
  const rulerRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const pxPerSec = timeline.zoom;
  const totalWidth = timeline.duration * pxPerSec;

  const drawRuler = useCallback(() => {
    const canvas = rulerRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = totalWidth * dpr;
    canvas.height = 32 * dpr;
    canvas.style.width = `${totalWidth}px`;
    canvas.style.height = '32px';
    ctx.scale(dpr, dpr);

    ctx.fillStyle = 'hsl(222.2, 47.4%, 11.2%)';
    ctx.fillRect(0, 0, totalWidth, 32);

    // Draw ticks
    for (let sec = 0; sec <= timeline.duration; sec++) {
      const x = sec * pxPerSec;
      const isMajor = sec % 5 === 0;

      ctx.beginPath();
      ctx.strokeStyle = isMajor ? 'hsl(215, 20.2%, 45%)' : 'hsl(215, 25%, 27%)';
      ctx.lineWidth = 1;
      ctx.moveTo(x, isMajor ? 0 : 16);
      ctx.lineTo(x, 32);
      ctx.stroke();

      if (isMajor) {
        ctx.fillStyle = 'hsl(215, 20.2%, 65.1%)';
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        ctx.fillText(`${m}:${s.toString().padStart(2, '0')}`, x, 12);
      }
    }

    // Draw playhead
    const px = timeline.playheadPosition * pxPerSec;
    ctx.beginPath();
    ctx.fillStyle = 'hsl(239, 84%, 67%)';
    ctx.moveTo(px - 5, 0);
    ctx.lineTo(px + 5, 0);
    ctx.lineTo(px, 8);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = 'hsl(239, 84%, 67%)';
    ctx.lineWidth = 1.5;
    ctx.moveTo(px, 8);
    ctx.lineTo(px, 32);
    ctx.stroke();
  }, [pxPerSec, totalWidth, timeline.duration, timeline.playheadPosition]);

  useEffect(() => {
    drawRuler();
  }, [drawRuler]);

  useEffect(() => {
    if (!timeline.isPlaying) return;
    const interval = setInterval(() => {
      setPlayhead(Math.min(timeline.playheadPosition + 0.05, timeline.duration));
    }, 50);
    return () => clearInterval(interval);
  }, [timeline.isPlaying, timeline.playheadPosition, timeline.duration, setPlayhead]);

  const handleRulerClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = rulerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left + (containerRef.current?.scrollLeft || 0);
    setPlayhead(Math.max(0, Math.min(x / pxPerSec, timeline.duration)));
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 100);
    return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-full flex-col">
      {/* Transport Controls */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPlayhead(0)}
            className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <SkipBack className="h-4 w-4" />
          </button>
          <button
            onClick={togglePlay}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground transition-all hover:bg-primary/90 glow-primary"
          >
            {timeline.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </button>
        </div>

        <div className="font-mono text-sm text-primary tabular-nums">
          {formatTime(timeline.playheadPosition)}
          <span className="text-muted-foreground"> / {formatTime(timeline.duration)}</span>
        </div>

        <div className="flex items-center gap-2">
          <ZoomOut className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="range"
            min={20}
            max={120}
            value={timeline.zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-border accent-primary"
          />
          <ZoomIn className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>

      {/* Timeline Area */}
      <div className="flex-1 overflow-auto" ref={containerRef}>
        <div style={{ width: totalWidth, minWidth: '100%' }}>
          {/* Ruler */}
          <canvas
            ref={rulerRef}
            onClick={handleRulerClick}
            className="cursor-pointer border-b border-border"
          />

          {/* Tracks */}
          {[
            { label: 'Video', icon: Film, color: 'bg-primary/20 border-primary/30' },
            { label: 'Audio', icon: Volume2, color: 'bg-success/20 border-success/30' },
          ].map(({ label, icon: Icon, color }) => (
            <div key={label} className="flex border-b border-border">
              <div className="flex w-24 shrink-0 items-center gap-2 border-r border-border bg-card px-3 py-4">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-mono text-muted-foreground uppercase">{label}</span>
              </div>
              <div className="relative flex-1 bg-background/50 py-2 px-1" style={{ minHeight: 56 }}>
                {/* Playhead line */}
                <div
                  className="absolute top-0 bottom-0 w-px bg-primary z-10"
                  style={{ left: timeline.playheadPosition * pxPerSec }}
                />
                {/* Sample clips */}
                {timeline.clips
                  .filter((c) => c.track === label.toLowerCase())
                  .map((clip) => (
                    <div
                      key={clip.id}
                      className={`absolute top-2 bottom-2 rounded border ${color} flex items-center justify-center text-xs font-mono text-muted-foreground cursor-grab`}
                      style={{
                        left: clip.startTime * pxPerSec,
                        width: clip.duration * pxPerSec,
                      }}
                    >
                      {clip.duration}s
                    </div>
                  ))}
                {timeline.clips.filter((c) => c.track === label.toLowerCase()).length === 0 && (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground/40 font-mono">
                    Drop {label.toLowerCase()} clips here
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
