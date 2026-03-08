import { useProjectStore } from '@/store/useProjectStore';
import { Image, Mic, Video, Play, Loader2, Zap, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

export function StudioView() {
  const { scenes } = useProjectStore();

  if (scenes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Layers className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Generate a script in the Architect first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-6">
        <h2 className="mb-1 text-lg font-semibold text-foreground">Asset Studio</h2>
        <p className="mb-4 text-sm text-muted-foreground">Generate images, audio, and video for each scene.</p>
        <button className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 glow-primary">
          <Zap className="h-4 w-4" />
          Generate All Assets
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-4">
          {scenes.map((scene, i) => (
            <motion.div
              key={scene.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-stretch gap-4 rounded-md border border-border bg-card p-4"
            >
              {/* Scene Info */}
              <div className="w-48 shrink-0 border-r border-border pr-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/20 text-xs font-bold text-primary font-mono">
                    {scene.sceneNumber}
                  </span>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">{scene.sceneType}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-3">{scene.visualPrompt}</p>
              </div>

              {/* Asset Cards */}
              <div className="flex flex-1 gap-3">
                {[
                  { type: 'image' as const, icon: Image, label: 'Image', color: 'text-primary' },
                  { type: 'audio' as const, icon: Mic, label: 'Audio', color: 'text-success' },
                  { type: 'video' as const, icon: Video, label: 'Video', color: 'text-warning' },
                ].map(({ type, icon: Icon, label, color }) => (
                  <div
                    key={type}
                    className="flex flex-1 flex-col items-center justify-center rounded border border-dashed border-border bg-background p-4 transition-all hover:border-primary/30"
                  >
                    <Icon className={`mb-2 h-6 w-6 ${color} opacity-40`} />
                    <span className="mb-2 text-xs font-mono text-muted-foreground">{label}</span>
                    <button className="flex items-center gap-1 rounded bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground transition-all hover:bg-primary/20 hover:text-primary">
                      <Play className="h-3 w-3" />
                      Generate
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
