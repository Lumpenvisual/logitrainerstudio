import { useProjectStore } from '@/store/useProjectStore';
import { Zap, ChevronRight } from 'lucide-react';

export function TopBar() {
  const { projectTitle, currentView, scenes } = useProjectStore();

  const viewLabels: Record<string, string> = {
    architect: 'Script Architect',
    studio: 'Asset Studio',
    timeline: 'Timeline Editor',
  };

  return (
    <div className="flex h-12 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <Zap className="h-4 w-4 text-primary" />
          <span className="font-semibold">LogiTrainer</span>
          <span className="text-muted-foreground font-normal">AI Studio</span>
        </div>
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{projectTitle}</span>
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
        <span className="text-sm font-medium text-primary">{viewLabels[currentView]}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            ONLINE
          </span>
          <span className="text-border">|</span>
          <span>{scenes.length} scenes</span>
        </div>
      </div>
    </div>
  );
}
