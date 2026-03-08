import { useProjectStore, LogLevel } from '@/store/useProjectStore';
import { useI18n } from '@/i18n/useI18n';
import { Terminal, Trash2, ChevronUp, ChevronDown, Search, Download, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useMemo, useCallback } from 'react';

const levelColors: Record<string, string> = {
  info: 'text-primary',
  success: 'text-success',
  error: 'text-destructive',
  warning: 'text-warning',
};

const levelBgColors: Record<string, string> = {
  info: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-success/10 text-success border-success/20',
  error: 'bg-destructive/10 text-destructive border-destructive/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
};

export function LogConsole() {
  const { logs, clearLogs } = useProjectStore();
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<LogLevel>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const toggleFilter = useCallback((level: LogLevel) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (activeFilters.size > 0 && !activeFilters.has(log.level)) return false;
      if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [logs, activeFilters, searchQuery]);

  const exportCSV = useCallback(() => {
    const header = 'Timestamp,Level,Message\n';
    const rows = filteredLogs.map(
      (l) => `"${l.timestamp.toISOString()}","${l.level}","${l.message.replace(/"/g, '""')}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logitrainer-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredLogs]);

  const errorCount = logs.filter((l) => l.level === 'error').length;
  const warnCount = logs.filter((l) => l.level === 'warning').length;

  return (
    <div className={`flex flex-col border-t border-border bg-card/30 transition-all ${collapsed ? 'h-8' : 'h-40'}`}>
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-1">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
          <Terminal className="h-3 w-3" />
          <span className="font-mono uppercase tracking-widest font-bold">{t('log.title')}</span>
          {logs.length > 0 && (
            <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-mono">{filteredLogs.length}/{logs.length}</span>
          )}
          {errorCount > 0 && (
            <span className="rounded bg-destructive/10 text-destructive px-1.5 py-0.5 text-[9px] font-mono font-bold">{errorCount} err</span>
          )}
          {warnCount > 0 && (
            <span className="rounded bg-warning/10 text-warning px-1.5 py-0.5 text-[9px] font-mono font-bold">{warnCount} warn</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!collapsed && (
            <>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'rounded p-0.5 transition-colors',
                  showFilters ? 'text-primary bg-primary/10' : 'text-muted-foreground/40 hover:text-foreground'
                )}
                title="Filters"
              >
                <Filter className="h-3 w-3" />
              </button>
              <button onClick={exportCSV} className="rounded p-0.5 text-muted-foreground/40 hover:text-foreground transition-colors" title="Export CSV">
                <Download className="h-3 w-3" />
              </button>
            </>
          )}
          <button onClick={clearLogs} className="rounded p-0.5 text-muted-foreground/40 hover:text-foreground transition-colors" title="Clear">
            <Trash2 className="h-3 w-3" />
          </button>
          <button onClick={() => setCollapsed(!collapsed)} className="rounded p-0.5 text-muted-foreground/40 hover:text-foreground transition-colors">
            {collapsed ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Filter bar */}
          {showFilters && (
            <div className="flex items-center gap-2 px-4 py-1.5 border-b border-border/30 bg-background/30">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/40" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search logs..."
                  className="w-full bg-transparent pl-7 pr-2 py-1 text-[10px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none font-mono"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground">
                    <X className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1">
                {(['info', 'success', 'warning', 'error'] as LogLevel[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => toggleFilter(level)}
                    className={cn(
                      'rounded-md border px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase transition-all',
                      activeFilters.has(level)
                        ? levelBgColors[level]
                        : 'border-border/50 text-muted-foreground/30 hover:text-muted-foreground'
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-auto p-2 font-mono text-[11px]">
            {filteredLogs.length === 0 && (
              <div className="flex h-full items-center justify-center text-muted-foreground/20 text-[10px]">
                {logs.length === 0 ? t('log.empty') : 'No logs match filters'}
              </div>
            )}
            {filteredLogs.map((log) => (
              <div key={log.id} className="flex gap-2 py-px hover:bg-secondary/20 px-1 rounded group">
                <span className="text-muted-foreground/30 shrink-0 tabular-nums">
                  {log.timestamp.toLocaleTimeString('en-US', { hour12: false })}
                </span>
                <span className={cn('uppercase w-12 shrink-0 font-bold', levelColors[log.level])}>[{log.level}]</span>
                <span className="text-foreground/60 group-hover:text-foreground/80 transition-colors">{log.message}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
