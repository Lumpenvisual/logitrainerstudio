import { useProjectStore } from '@/store/useProjectStore';
import { Terminal, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const levelColors: Record<string, string> = {
  info: 'text-primary',
  success: 'text-success',
  error: 'text-destructive',
  warning: 'text-warning',
};

export function LogConsole() {
  const { logs, clearLogs } = useProjectStore();

  return (
    <div className="flex h-36 flex-col border-t border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-1.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Terminal className="h-3 w-3" />
          <span className="font-mono uppercase tracking-wider">System Log</span>
          <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-mono">{logs.length}</span>
        </div>
        <button onClick={clearLogs} className="text-muted-foreground hover:text-foreground transition-colors">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
      <div className="flex-1 overflow-auto p-2 font-mono text-xs">
        {logs.length === 0 && (
          <div className="flex h-full items-center justify-center text-muted-foreground/40">No logs yet</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2 py-0.5">
            <span className="text-muted-foreground/50 shrink-0">
              {log.timestamp.toLocaleTimeString('en-US', { hour12: false })}
            </span>
            <span className={cn('uppercase w-12 shrink-0', levelColors[log.level])}>[{log.level}]</span>
            <span className="text-foreground/80">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
