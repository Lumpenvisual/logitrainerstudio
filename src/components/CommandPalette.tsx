import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore, ViewMode } from '@/store/useProjectStore';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Clapperboard, Clock, Bot, Activity, BarChart3,
  Settings2, Save, LogOut, UserCircle, Sparkles, Search, Hash,
  Command, Zap, Bell, Trash2, MessageSquare, Film
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: typeof FileText;
  category: 'navigation' | 'actions' | 'project';
  action: () => void;
  shortcut?: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { setView, toggleChat, clearScenes, clearLogs, clearChat, brief } = useProjectStore();
  const { signOut } = useAuth();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
        setQuery('');
        setSelectedIndex(0);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const commands: CommandItem[] = useMemo(() => [
    // Navigation
    { id: 'nav-architect', label: 'Go to Architect', description: 'Script & scene generation', icon: FileText, category: 'navigation', action: () => setView('architect'), shortcut: '1' },
    { id: 'nav-studio', label: 'Go to Studio', description: 'Asset generation', icon: Clapperboard, category: 'navigation', action: () => setView('studio'), shortcut: '2' },
    { id: 'nav-timeline', label: 'Go to Timeline', description: 'Multi-track editing', icon: Clock, category: 'navigation', action: () => setView('timeline'), shortcut: '3' },
    { id: 'nav-dashboard', label: 'Go to Dashboard', description: 'API analytics & observability', icon: BarChart3, category: 'navigation', action: () => setView('dashboard' as ViewMode) },
    { id: 'nav-profile', label: 'Go to Profile', description: 'Account settings', icon: UserCircle, category: 'navigation', action: () => navigate('/profile') },
    { id: 'nav-about', label: 'About LogiTrainer', description: 'Platform information', icon: Activity, category: 'navigation', action: () => navigate('/about') },

    // Actions
    { id: 'act-chat', label: 'Toggle Neural Assistant', description: 'Open/close AI chat', icon: Bot, category: 'actions', action: () => toggleChat() },
    { id: 'act-generate', label: 'Generate Script', description: 'AI script from brief', icon: Sparkles, category: 'actions', action: () => { setView('architect'); }, shortcut: '⌘G' },
    { id: 'act-signout', label: 'Sign Out', description: 'Log out of your account', icon: LogOut, category: 'actions', action: () => signOut() },

    // Project
    { id: 'proj-clear-scenes', label: 'Clear All Scenes', description: 'Remove all generated scenes', icon: Trash2, category: 'project', action: () => clearScenes() },
    { id: 'proj-clear-logs', label: 'Clear System Logs', description: 'Empty the log console', icon: Trash2, category: 'project', action: () => clearLogs() },
    { id: 'proj-clear-chat', label: 'Clear Chat History', description: 'Reset assistant conversation', icon: MessageSquare, category: 'project', action: () => clearChat() },
  ], [setView, toggleChat, clearScenes, clearLogs, clearChat, navigate, signOut]);

  const filtered = useMemo(() => {
    if (!query) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) => c.label.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q) || c.category.includes(q)
    );
  }, [commands, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const execute = (cmd: CommandItem) => {
    cmd.action();
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && filtered[selectedIndex]) {
        e.preventDefault();
        execute(filtered[selectedIndex]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, filtered, selectedIndex]);

  if (!open) return null;

  const categories = ['navigation', 'actions', 'project'] as const;
  const categoryLabels = { navigation: 'Navigation', actions: 'Actions', project: 'Project' };

  let globalIdx = -1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] bg-background/70 backdrop-blur-xl"
        onClick={() => setOpen(false)}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: -10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl shadow-primary/10 overflow-hidden"
        >
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <Search className="h-4 w-4 text-muted-foreground/50 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search commands, navigate..."
              autoFocus
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
            />
            <kbd className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">ESC</kbd>
          </div>

          {/* Results */}
          <div className="max-h-[300px] overflow-auto p-2">
            {filtered.length === 0 && (
              <div className="py-8 text-center text-xs text-muted-foreground/50">
                No commands found for "{query}"
              </div>
            )}

            {categories.map((cat) => {
              const items = filtered.filter((c) => c.category === cat);
              if (items.length === 0) return null;
              return (
                <div key={cat} className="mb-1">
                  <div className="px-2 py-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/40">
                    {categoryLabels[cat]}
                  </div>
                  {items.map((cmd) => {
                    globalIdx++;
                    const idx = globalIdx;
                    const isSelected = idx === selectedIndex;
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => execute(cmd)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                          isSelected ? 'bg-primary/10 text-primary' : 'text-foreground/70 hover:bg-secondary/50'
                        )}
                      >
                        <cmd.icon className={cn('h-4 w-4 shrink-0', isSelected ? 'text-primary' : 'text-muted-foreground/50')} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{cmd.label}</p>
                          {cmd.description && (
                            <p className="text-[10px] text-muted-foreground/50 truncate">{cmd.description}</p>
                          )}
                        </div>
                        {cmd.shortcut && (
                          <kbd className="rounded bg-secondary/50 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground/50 shrink-0">
                            {cmd.shortcut}
                          </kbd>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border px-4 py-2">
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground/40">
              <span className="flex items-center gap-1"><kbd className="rounded bg-secondary px-1 py-0.5 font-mono">↑↓</kbd> Navigate</span>
              <span className="flex items-center gap-1"><kbd className="rounded bg-secondary px-1 py-0.5 font-mono">↵</kbd> Execute</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground/30">
              <Command className="h-3 w-3" />
              <span className="font-mono">K</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
