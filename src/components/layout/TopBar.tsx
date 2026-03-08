import { useProjectStore } from '@/store/useProjectStore';
import { useAPIStore } from '@/store/useAPIStore';
import { useI18n } from '@/i18n/useI18n';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Locale } from '@/i18n/translations';
import { Zap, ChevronRight, Settings2, Activity, LogOut, Save, UserCircle, Check, Cloud, Loader2, Sun, Moon, Download, Upload, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

const localeLabels: Record<Locale, string> = { en: 'EN', fr: 'FR', es: 'ES' };
const localeOrder: Locale[] = ['en', 'fr', 'es'];

export function TopBar({ onOpenAPIPanel, onSave, onOpenAdminPanel }: { onOpenAPIPanel: () => void; onSave?: () => void; onOpenAdminPanel?: () => void }) {
  const { projectTitle, currentView, scenes } = useProjectStore();
  const { totalCalls, avgLatency } = useAPIStore();
  const { t, locale, setLocale } = useI18n();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showUserMenu, setShowUserMenu] = useState(false);

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

  // Close user menu on outside click
  useEffect(() => {
    if (!showUserMenu) return;
    const handler = () => setShowUserMenu(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [showUserMenu]);

  return (
    <div className="flex h-11 items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-4">
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

      <div className="flex items-center gap-2.5">
        {/* Completion bar */}
        {scenes.length > 0 && (
          <div className="flex items-center gap-2 mr-1">
            <div className="w-16 h-1 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary-glow transition-all duration-700"
                style={{ width: `${completionPct}%` }}
              />
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
          {scenes.length > 0 && (
            <>
              <span className="text-border">·</span>
              <span>{scenes.length} {t('status.scenes')}</span>
            </>
          )}
          {totalCalls > 0 && (
            <>
              <span className="text-border">·</span>
              <span>{totalCalls} {t('status.calls')}</span>
              {avgLatency > 0 && <span className="text-muted-foreground/30">~{avgLatency}ms</span>}
            </>
          )}
        </div>

        {/* Command Palette hint */}
        <div className="hidden md:flex items-center gap-1 rounded-md border border-border/50 px-2.5 py-1.5 text-[10px] text-muted-foreground/40 font-mono cursor-pointer hover:border-primary/30 hover:text-muted-foreground transition-all"
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
        >
          <span>⌘K</span>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center rounded-md border border-border/50 p-1.5 text-muted-foreground transition-all hover:border-primary/30 hover:text-primary"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </button>

        {/* Language switcher */}
        <div className="flex items-center rounded-md border border-border/50 overflow-hidden">
          {localeOrder.map((l) => (
            <button
              key={l}
              onClick={() => setLocale(l)}
              className={`px-1.5 py-1 text-[9px] font-bold tracking-wider transition-colors ${
                locale === l
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground/50 hover:text-foreground hover:bg-secondary'
              }`}
            >
              {localeLabels[l]}
            </button>
          ))}
        </div>

        {/* Save button with status */}
        {onSave && user && (
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className="flex items-center gap-1.5 rounded-md border border-border/50 px-2.5 py-1.5 text-xs font-medium transition-all hover:border-primary/30 hover:text-primary disabled:opacity-50"
            title="Save Project (Ctrl+S)"
          >
            {saveStatus === 'saving' ? (
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
            ) : saveStatus === 'saved' ? (
              <Check className="h-3 w-3 text-success" />
            ) : (
              <Cloud className="h-3 w-3 text-muted-foreground" />
            )}
            <span className={`text-[10px] font-mono ${
              saveStatus === 'saved' ? 'text-success' : 'text-muted-foreground'
            }`}>
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save'}
            </span>
          </button>
        )}

        {/* Export JSON */}
        <button
          onClick={() => {
            const state = useProjectStore.getState();
            const exportData = {
              version: '1.0',
              exportedAt: new Date().toISOString(),
              project: {
                title: state.projectTitle,
                brief: state.brief,
                scenes: state.scenes,
                timeline: state.timeline,
                assets: state.assets,
              },
            };
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${state.projectTitle.replace(/\s+/g, '_').toLowerCase()}_export.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="flex items-center gap-1.5 rounded-md border border-border/50 px-2.5 py-1.5 text-xs text-muted-foreground transition-all hover:border-primary/30 hover:text-primary"
          title="Export project as JSON"
        >
          <Download className="h-3 w-3" />
          <span className="hidden md:inline text-[10px] font-mono">Export</span>
        </button>

        {/* Import JSON */}
        <button
          onClick={() => {
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
              } catch {
                toast.error('Failed to parse JSON file');
              }
            };
            input.click();
          }}
          className="flex items-center gap-1.5 rounded-md border border-border/50 px-2.5 py-1.5 text-xs text-muted-foreground transition-all hover:border-primary/30 hover:text-primary"
          title="Import project from JSON"
        >
          <Upload className="h-3 w-3" />
          <span className="hidden md:inline text-[10px] font-mono">Import</span>
        </button>
        <button
          onClick={onOpenAPIPanel}
          className="flex items-center gap-1.5 rounded-md border border-border/50 px-2.5 py-1.5 text-xs text-muted-foreground transition-all hover:border-primary/30 hover:text-primary"
          title={t('api.title')}
        >
          <Settings2 className="h-3 w-3" />
        </button>

        {/* User menu */}
        {user && (
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu); }}
              className="flex items-center gap-1.5 rounded-md border border-border/50 px-2 py-1.5 text-xs text-muted-foreground transition-all hover:border-primary/30 hover:text-primary"
            >
              <UserCircle className="h-3.5 w-3.5" />
            </button>

            {showUserMenu && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-1.5 w-48 rounded-lg border border-border bg-card/95 backdrop-blur-xl p-1.5 shadow-xl shadow-background/50 z-50"
              >
                <div className="px-3 py-2 border-b border-border mb-1">
                  <p className="text-xs font-medium text-foreground truncate">{user.email}</p>
                  <p className="text-[10px] text-muted-foreground/50 font-mono">Free Plan</p>
                </div>
                <button
                  onClick={() => { navigate('/profile'); setShowUserMenu(false); }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  <UserCircle className="h-3.5 w-3.5" />
                  Profile
                </button>
                <button
                  onClick={() => { signOut(); setShowUserMenu(false); }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}