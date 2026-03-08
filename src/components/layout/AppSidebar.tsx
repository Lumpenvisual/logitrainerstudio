import { FileText, Clapperboard, Clock, Bot, Activity, ChevronRight } from 'lucide-react';
import { useProjectStore, ViewMode } from '@/store/useProjectStore';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navItems: { view: ViewMode; icon: typeof FileText; label: string; sublabel: string }[] = [
  { view: 'architect', icon: FileText, label: 'Architect', sublabel: 'Script & Scenes' },
  { view: 'studio', icon: Clapperboard, label: 'Studio', sublabel: 'Asset Generation' },
  { view: 'timeline', icon: Clock, label: 'Timeline', sublabel: 'Edit & Compose' },
];

export function AppSidebar() {
  const { currentView, setView, toggleChat, isChatOpen, logs } = useProjectStore();
  const recentErrors = logs.filter((l) => l.level === 'error').length;

  return (
    <div className="flex h-full w-16 flex-col items-center border-r border-border bg-card py-4 gap-2">
      {/* Logo */}
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-primary/20 border border-primary/30">
        <Activity className="h-5 w-5 text-primary" />
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map(({ view, icon: Icon, label }) => {
          const active = currentView === view;
          return (
            <button
              key={view}
              onClick={() => setView(view)}
              className={cn(
                'group relative flex h-12 w-12 items-center justify-center rounded-md transition-all duration-200',
                active
                  ? 'bg-primary/20 text-primary glow-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
              title={label}
            >
              <Icon className="h-5 w-5" />
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded-r bg-primary"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Chat toggle */}
      <button
        onClick={toggleChat}
        className={cn(
          'relative flex h-12 w-12 items-center justify-center rounded-md transition-all duration-200',
          isChatOpen
            ? 'bg-primary/20 text-primary'
            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
        )}
        title="Neural Assistant"
      >
        <Bot className="h-5 w-5" />
        {recentErrors > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-destructive animate-pulse-glow" />
        )}
      </button>
    </div>
  );
}
