import { useProjectStore } from '@/store/useProjectStore';
import { useAPIStore } from '@/store/useAPIStore';
import { useI18n } from '@/i18n/useI18n';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Locale } from '@/i18n/translations';
import {
  Zap, ChevronRight, ChevronDown, Settings2, Activity, LogOut, Save, UserCircle, Check, Cloud, Loader2,
  Sun, Moon, Download, Upload, Shield, FolderOpen, Film, Sliders, Keyboard, Palette, MoreHorizontal
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

const localeLabels: Record<Locale, string> = { en: 'EN', fr: 'FR', es: 'ES' };
const localeOrder: Locale[] = ['en', 'fr', 'es'];

function DropdownMenu({ trigger, children, align = 'right' }: { trigger: React.ReactNode; children: React.ReactNode; align?: 'left' | 'right' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div className={`absolute top-full mt-1.5 w-52 rounded-lg border border-border bg-card/95 backdrop-blur-xl p-1.5 shadow-xl shadow-background/50 z-50 ${align === 'right' ? 'right-0' : 'left-0'}`}>
          <div onClick={() => setOpen(false)}>{children}</div>
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick, shortcut, variant = 'default' }: {
  icon: typeof Film; label: string; onClick: () => void; shortcut?: string; variant?: 'default' | 'success' | 'danger';
}) {
  const variants = {
    default: 'text-muted-foreground hover:bg-secondary hover:text-foreground',
    success: 'text-success hover:bg-success/10',
    danger: 'text-muted-foreground hover:bg-destructive/10 hover:text-destructive',
  };
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs transition-colors ${variants[variant]}`}>
      <Icon className="h-3.5 w-3.5" />
      <span className="flex-1 text-left">{label}</span>
      {shortcut && <kbd className="text-[9px] font-mono text-muted-foreground/40 bg-background rounded px-1 py-0.5">{shortcut}</kbd>}
    </button>
  );
}

export function TopBar({ onOpenAPIPanel, onSave, onOpenAdminPanel, onOpenMediaBrowser, onOpenProjectSettings, onOpenRenderExport, onOpenColorGrading, onOpenKeyboardShortcuts }: {
  onOpenAPIPanel: () => void;
  onSave?: () => void;
  onOpenAdminPanel?: () => void;
  onOpenMediaBrowser?: () => void;
  onOpenProjectSettings?: () => void;
  onOpenRenderExport?: () => void;
  onOpenColorGrading?: () => void;
  onOpenKeyboardShortcuts?: () => void;
}) {
  const { projectTitle, currentView, scenes } = useProjectStore();
  const { totalCalls, avgLatency } = useAPIStore();
  const { t, locale, setLocale } = useI18n();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const viewLabels: Record<string, string> = {
    architect: t('nav.architect'),
    studio: t('nav.studio'),
    timeline: t('nav.timeline'),
    dashboard: 'Dashboard',
  };

  const totalAssets = scenes.length * 3;
  const readyAssets = scenes.reduce((acc, s) => {
    return acc + (s.status.image === 'ready' ? 1 : 0) + (s.status.audio === 'ready' ? 1 : 0) + (s.status.video === 'ready' ? 1 : 0);
  }, 0);
  const completionPct = totalAssets > 0 ? Math.round((readyAssets / totalAssets) * 100) : 0;

  const handleSave = useCallback(async () => {
    if (!onSave) return;
    setSaveStatus('saving');
    await onSave();
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  }, [onSave]);

  const handleExport = () => {
    const state = useProjectStore.getState();
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      project: { title: state.projectTitle, brief: state.brief, scenes: state.scenes, timeline: state.timeline, assets: state.assets },
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.projectTitle.replace(/\s+/g, '_').toLowerCase()}_export.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.project) {
          useProjectStore.getState().importProject(data.project);
          toast.success('Project imported successfully');
        } else {
          toast.error('Invalid project file');
        }
      } catch { toast.error('Failed to parse JSON file'); }
    };
    input.click();
  };

  return (
    <div className="flex h-11 items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-4">
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-primary" />
          <span className="font-display text-sm font-bold text-foreground tracking-tight">{t('app.name')}</span>
        </div>
        <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
        <span className="text-sm text-muted-foreground truncate max-w-[140px]">{projectTitle}</span>
        <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
        <span className="text-xs font-semibold text-primary font-display">{viewLabels[currentView]}</span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Completion */}
        {scenes.length > 0 && (
          <div className="flex items-center gap-2 mr-1">
            <div className="w-16 h-1 rounded-full bg-border overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary-glow transition-all duration-700" style={{ width: `${completionPct}%` }} />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground/60">{completionPct}%</span>
          </div>
        )}

        {/* Status */}
        <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-muted-foreground/50">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            {t('status.online')}
          </span>
          {totalCalls > 0 && (
            <>
              <span className="text-border">·</span>
              <span>{totalCalls} calls</span>
              {avgLatency > 0 && <span className="text-muted-foreground/30">~{avgLatency}ms</span>}
            </>
          )}
        </div>

        {/* Command palette */}
        <div className="hidden md:flex items-center gap-1 rounded-md border border-border/50 px-2.5 py-1.5 text-[10px] text-muted-foreground/40 font-mono cursor-pointer hover:border-primary/30 transition-all"
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
        >
          <span>⌘K</span>
        </div>

        {/* Admin */}
        {onOpenAdminPanel && (
          <button onClick={onOpenAdminPanel} className="flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-[10px] font-bold text-primary transition-all hover:bg-primary/20">
            <Shield className="h-3 w-3" />
            Admin
          </button>
        )}

        {/* Render button */}
        {onOpenRenderExport && (
          <button onClick={onOpenRenderExport} className="flex items-center gap-1.5 rounded-md border border-success/30 bg-success/5 px-2.5 py-1.5 text-[10px] font-bold text-success transition-all hover:bg-success/10">
            <Film className="h-3 w-3" />
            <span className="hidden md:inline font-mono">Render</span>
          </button>
        )}

        {/* Save */}
        {onSave && user && (
          <button onClick={handleSave} disabled={saveStatus === 'saving'} className="flex items-center gap-1.5 rounded-md border border-border/50 px-2.5 py-1.5 text-xs font-medium transition-all hover:border-primary/30 disabled:opacity-50">
            {saveStatus === 'saving' ? <Loader2 className="h-3 w-3 animate-spin text-primary" /> :
             saveStatus === 'saved' ? <Check className="h-3 w-3 text-success" /> :
             <Cloud className="h-3 w-3 text-muted-foreground" />}
            <span className={`text-[10px] font-mono ${saveStatus === 'saved' ? 'text-success' : 'text-muted-foreground'}`}>
              {saveStatus === 'saving' ? '...' : saveStatus === 'saved' ? '✓' : 'Save'}
            </span>
          </button>
        )}

        {/* Tools dropdown — groups Media, Settings, Import/Export, Color, Shortcuts */}
        <DropdownMenu trigger={
          <button className="flex items-center gap-1.5 rounded-md border border-border/50 px-2 py-1.5 text-xs text-muted-foreground transition-all hover:border-primary/30 hover:text-primary">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        }>
          {onOpenMediaBrowser && <MenuItem icon={FolderOpen} label="Media Browser" onClick={onOpenMediaBrowser} />}
          {onOpenColorGrading && <MenuItem icon={Palette} label="Color Grading" onClick={onOpenColorGrading} />}
          {onOpenProjectSettings && <MenuItem icon={Sliders} label="Project Settings" onClick={onOpenProjectSettings} />}
          <MenuItem icon={Settings2} label="API Management" onClick={onOpenAPIPanel} />
          <div className="my-1 h-px bg-border" />
          <MenuItem icon={Download} label="Export JSON" onClick={handleExport} />
          <MenuItem icon={Upload} label="Import JSON" onClick={handleImport} />
          <div className="my-1 h-px bg-border" />
          <MenuItem icon={Keyboard} label="Keyboard Shortcuts" onClick={() => onOpenKeyboardShortcuts?.()} shortcut="?" />
          <MenuItem icon={theme === 'dark' ? Sun : Moon} label={theme === 'dark' ? 'Light Mode' : 'Dark Mode'} onClick={toggleTheme} />
        </DropdownMenu>

        {/* Language */}
        <div className="flex items-center rounded-md border border-border/50 overflow-hidden">
          {localeOrder.map((l) => (
            <button key={l} onClick={() => setLocale(l)} className={`px-1.5 py-1 text-[9px] font-bold tracking-wider transition-colors ${
              locale === l ? 'bg-primary text-primary-foreground' : 'text-muted-foreground/50 hover:text-foreground hover:bg-secondary'
            }`}>
              {localeLabels[l]}
            </button>
          ))}
        </div>

        {/* User menu */}
        {user && (
          <DropdownMenu trigger={
            <button className="flex items-center gap-1.5 rounded-md border border-border/50 px-2 py-1.5 text-xs text-muted-foreground transition-all hover:border-primary/30 hover:text-primary">
              <UserCircle className="h-3.5 w-3.5" />
            </button>
          }>
            <div className="px-3 py-2 border-b border-border mb-1">
              <p className="text-xs font-medium text-foreground truncate">{user.email}</p>
              <p className="text-[10px] text-muted-foreground/50 font-mono">Pro Plan</p>
            </div>
            <MenuItem icon={UserCircle} label="Profile" onClick={() => navigate('/profile')} />
            <MenuItem icon={LogOut} label="Sign Out" onClick={signOut} variant="danger" />
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
