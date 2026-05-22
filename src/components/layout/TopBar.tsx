import { useProjectStore } from '@/store/useProjectStore';
import { useAPIStore } from '@/store/useAPIStore';
import { useI18n } from '@/i18n/useI18n';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Locale } from '@/i18n/translations';
import {
  ChevronRight, Settings2, LogOut, Save, UserCircle, Check, Cloud, Loader2,
  Sun, Moon, Download, Upload, Shield, FolderOpen, Film, Sliders, Keyboard, Palette, MoreHorizontal, Dot
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
        <div className={`absolute top-full mt-1 w-52 rounded-xl border border-border/60 bg-card/95 backdrop-blur-2xl p-1 shadow-premium-lg z-50 animate-scale-in ${align === 'right' ? 'right-0' : 'left-0'}`}>
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
    default: 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
    success: 'text-success hover:bg-success/10',
    danger: 'text-muted-foreground hover:bg-destructive/10 hover:text-destructive',
  };
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-all duration-150 ${variants[variant]}`}>
      <Icon className="h-3.5 w-3.5" />
      <span className="flex-1 text-left font-medium">{label}</span>
      {shortcut && <kbd className="text-[9px] font-mono text-muted-foreground/30 bg-secondary/50 rounded-md px-1.5 py-0.5">{shortcut}</kbd>}
    </button>
  );
}

export function TopBar({ onOpenAPIPanel, onSave, onOpenAdminPanel, onOpenMediaBrowser, onOpenProjectSettings, onOpenRenderExport, onOpenColorGrading, onOpenKeyboardShortcuts }: {
  onOpenAPIPanel: () => void; onSave?: () => void; onOpenAdminPanel?: () => void; onOpenMediaBrowser?: () => void;
  onOpenProjectSettings?: () => void; onOpenRenderExport?: () => void; onOpenColorGrading?: () => void; onOpenKeyboardShortcuts?: () => void;
}) {
  const { projectTitle, currentView, scenes } = useProjectStore();
  const { totalCalls, avgLatency } = useAPIStore();
  const { t, locale, setLocale } = useI18n();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const viewLabels: Record<string, string> = { architect: t('nav.architect'), studio: t('nav.studio'), timeline: t('nav.timeline'), dashboard: 'Dashboard' };

  const totalAssets = scenes.length * 3;
  const readyAssets = scenes.reduce((acc, s) => acc + (s.status.image === 'ready' ? 1 : 0) + (s.status.audio === 'ready' ? 1 : 0) + (s.status.video === 'ready' ? 1 : 0), 0);
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
    const exportData = { version: '1.0', exportedAt: new Date().toISOString(), project: { title: state.projectTitle, brief: state.brief, scenes: state.scenes, timeline: state.timeline, assets: state.assets } };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${state.projectTitle.replace(/\s+/g, '_').toLowerCase()}_export.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return;
      try {
        const text = await file.text(); const data = JSON.parse(text);
        if (data.project) { useProjectStore.getState().importProject(data.project); toast.success('Project imported'); }
        else { toast.error('Invalid project file'); }
      } catch { toast.error('Failed to parse JSON file'); }
    };
    input.click();
  };

  return (
    <div className="flex h-10 min-h-10 shrink-0 items-center justify-between gap-2 border-b border-border/50 bg-card/40 backdrop-blur-sm px-2 sm:px-4">
      {/* Breadcrumb */}
      <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
        <span className="hidden font-display text-[13px] font-bold tracking-tight text-foreground/90 sm:inline">{t('app.name')}</span>
        <ChevronRight className="hidden h-3 w-3 shrink-0 text-muted-foreground/20 sm:block" />
        <span className="min-w-0 truncate text-[12px] text-muted-foreground/70 sm:max-w-[140px] sm:text-[13px]">{projectTitle}</span>
        <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/20" />
        <span className="shrink-0 text-[11px] font-semibold text-primary/80 font-display sm:text-xs">{viewLabels[currentView]}</span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5">
        {/* Progress */}
        {scenes.length > 0 && (
          <div className="flex items-center gap-2 mr-2 px-2 py-1 rounded-lg bg-secondary/30">
            <div className="w-14 h-1 rounded-full bg-border/50 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary-glow transition-all duration-700 ease-out" style={{ width: `${completionPct}%` }} />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground/50">{completionPct}%</span>
          </div>
        )}

        {/* Status */}
        <div className="hidden md:flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/40 mr-1">
          <span className="h-1.5 w-1.5 rounded-full bg-success/80" />
          <span>{t('status.online')}</span>
          {totalCalls > 0 && <><Dot className="h-3 w-3 text-border" /><span>{totalCalls} calls</span></>}
        </div>

        {/* ⌘K */}
        <button className="hidden md:flex items-center rounded-lg border border-border/40 px-2 py-1 text-[10px] text-muted-foreground/35 font-mono cursor-pointer hover:border-primary/20 hover:text-muted-foreground/60 transition-all duration-200"
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
        >⌘K</button>

        {/* Admin */}
        {onOpenAdminPanel && (
          <button onClick={onOpenAdminPanel} className="flex items-center gap-1 rounded-lg border border-primary/25 bg-primary/8 px-2 py-1 text-[10px] font-bold text-primary transition-all hover:bg-primary/15">
            <Shield className="h-3 w-3" /> Admin
          </button>
        )}

        {/* Render */}
        {onOpenRenderExport && (
          <button onClick={onOpenRenderExport} className="flex items-center gap-1 rounded-lg border border-success/25 bg-success/5 px-2 py-1 text-[10px] font-bold text-success transition-all hover:bg-success/10">
            <Film className="h-3 w-3" /><span className="hidden md:inline">Render</span>
          </button>
        )}

        {/* Save */}
        {onSave && user && (
          <button onClick={handleSave} disabled={saveStatus === 'saving'} className="flex items-center gap-1 rounded-lg border border-border/40 px-2 py-1 text-[10px] font-medium transition-all hover:border-primary/20 disabled:opacity-50">
            {saveStatus === 'saving' ? <Loader2 className="h-3 w-3 animate-spin text-primary" /> : saveStatus === 'saved' ? <Check className="h-3 w-3 text-success" /> : <Cloud className="h-3 w-3 text-muted-foreground/50" />}
            <span className={`font-mono ${saveStatus === 'saved' ? 'text-success' : 'text-muted-foreground/60'}`}>
              {saveStatus === 'saving' ? '...' : saveStatus === 'saved' ? '✓' : 'Save'}
            </span>
          </button>
        )}

        {/* Tools menu */}
        <DropdownMenu trigger={
          <button className="flex items-center rounded-lg border border-border/40 p-1.5 text-muted-foreground/50 transition-all hover:border-primary/20 hover:text-primary">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        }>
          {onOpenMediaBrowser && <MenuItem icon={FolderOpen} label="Media Browser" onClick={onOpenMediaBrowser} />}
          {onOpenColorGrading && <MenuItem icon={Palette} label="Color Grading" onClick={onOpenColorGrading} />}
          {onOpenProjectSettings && <MenuItem icon={Sliders} label="Project Settings" onClick={onOpenProjectSettings} />}
          <MenuItem icon={Settings2} label="API Management" onClick={onOpenAPIPanel} />
          <div className="my-0.5 mx-2 h-px bg-border/40" />
          <MenuItem icon={Download} label="Export JSON" onClick={handleExport} />
          <MenuItem icon={Upload} label="Import JSON" onClick={handleImport} />
          <div className="my-0.5 mx-2 h-px bg-border/40" />
          <MenuItem icon={Keyboard} label="Keyboard Shortcuts" onClick={() => onOpenKeyboardShortcuts?.()} shortcut="?" />
          <MenuItem icon={theme === 'dark' ? Sun : Moon} label={theme === 'dark' ? 'Light Mode' : 'Dark Mode'} onClick={toggleTheme} />
        </DropdownMenu>

        {/* Language */}
        <div className="flex items-center rounded-lg border border-border/40 overflow-hidden">
          {localeOrder.map((l) => (
            <button key={l} onClick={() => setLocale(l)} className={`px-1.5 py-1 text-[9px] font-bold tracking-wider transition-all duration-200 ${
              locale === l ? 'bg-primary text-primary-foreground' : 'text-muted-foreground/40 hover:text-foreground hover:bg-secondary/40'
            }`}>{localeLabels[l]}</button>
          ))}
        </div>

        {/* User */}
        {user && (
          <DropdownMenu trigger={
            <button className="flex items-center rounded-lg border border-border/40 p-1.5 text-muted-foreground/50 transition-all hover:border-primary/20 hover:text-primary">
              <UserCircle className="h-3.5 w-3.5" />
            </button>
          }>
            <div className="px-3 py-2.5 border-b border-border/40 mb-0.5">
              <p className="text-xs font-medium text-foreground truncate">{user.email}</p>
              <p className="text-[10px] text-muted-foreground/40 font-mono mt-0.5">Pro Plan</p>
            </div>
            <MenuItem icon={UserCircle} label="Profile" onClick={() => navigate('/profile')} />
            <MenuItem icon={LogOut} label="Sign Out" onClick={signOut} variant="danger" />
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
