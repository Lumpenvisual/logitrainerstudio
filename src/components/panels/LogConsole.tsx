import { useProjectStore } from '@/store/useProjectStore';
import { useI18n } from '@/i18n/useI18n';
import { Terminal, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const levelColors: Record<string, string> = {
  info: 'text-primary',
  success: 'text-success',
  error: 'text-destructive',
  warning: 'text-warning',
};

export function LogConsole() {
  const { logs, clearLogs } = useProjectStore();
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`flex flex-col border-t border-border bg-card/30 transition-all ${collapsed ? 'h-8' : 'h-32'}`}>
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-1">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
          <Terminal className="h-3 w-3" />
          <span className="font-mono uppercase tracking-widest font-bold">{t('log.title')}</span>
          {logs.length > 0 && (
            <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-mono">{logs.length}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={clearLogs} className="rounded p-0.5 text-muted-foreground/40 hover:text-foreground transition-colors">
            <Trash2 className="h-3 w-3" />
          </button>
          <button onClick={() => setCollapsed(!collapsed)} className="rounded p-0.5 text-muted-foreground/40 hover:text-foreground transition-colors">
            {collapsed ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>
      </div>
      {!collapsed && (
        <div className="flex-1 overflow-auto p-2 font-mono text-[11px]">
          {logs.length === 0 && (
            <div className="flex h-full items-center justify-center text-muted-foreground/20 text-[10px]">{t('log.empty')}</div>
          )}
          {logs.map((log) => (
            <div key={log.id} className="flex gap-2 py-px hover:bg-secondary/20 px-1 rounded">
              <span className="text-muted-foreground/30 shrink-0 tabular-nums">
                {log.timestamp.toLocaleTimeString('en-US', { hour12: false })}
              </span>
              <span className={cn('uppercase w-12 shrink-0 font-bold', levelColors[log.level])}>[{log.level}]</span>
              <span className="text-foreground/60">{log.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}