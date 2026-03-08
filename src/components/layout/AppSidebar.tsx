import { FileText, Clapperboard, Clock, Bot, Activity, Bell } from 'lucide-react';
import { useProjectStore, ViewMode } from '@/store/useProjectStore';
import { useAlertStore } from '@/store/useAlertStore';
import { useI18n } from '@/i18n/useI18n';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function AppSidebar({ onToggleAlerts, isAlertsOpen }: { onToggleAlerts?: () => void; isAlertsOpen?: boolean }) {
  const { currentView, setView, toggleChat, isChatOpen, logs } = useProjectStore();
  const { unreadCount } = useAlertStore();
  const { t } = useI18n();
  const recentErrors = logs.filter((l) => l.level === 'error').length;

  const navItems: { view: ViewMode; icon: typeof FileText; label: string; sub: string }[] = [
    { view: 'architect', icon: FileText, label: t('nav.architect'), sub: t('nav.architect.sub') },
    { view: 'studio', icon: Clapperboard, label: t('nav.studio'), sub: t('nav.studio.sub') },
    { view: 'timeline', icon: Clock, label: t('nav.timeline'), sub: t('nav.timeline.sub') },
  ];

  return (
    <div className="flex h-full w-[60px] flex-col items-center border-r border-border bg-card/50 py-3 gap-1">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 border border-primary/20">
        <Activity className="h-4.5 w-4.5 text-primary" />
      </div>

      <nav className="flex flex-1 flex-col gap-0.5">
        {navItems.map(({ view, icon: Icon, label, sub }) => {
          const active = currentView === view;
          return (
            <Tooltip key={view} delayDuration={200}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setView(view)}
                  className={cn(
                    'group relative flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200',
                    active
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground/60 hover:bg-secondary/50 hover:text-foreground'
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  {active && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[2px] rounded-r bg-primary"
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-display">
                <p className="font-semibold">{label}</p>
                <p className="text-[10px] text-muted-foreground">{sub}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      {/* Alerts button */}
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button
            onClick={onToggleAlerts}
            className={cn(
              'relative flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200',
              isAlertsOpen
                ? 'bg-warning/15 text-warning'
                : 'text-muted-foreground/60 hover:bg-secondary/50 hover:text-foreground'
            )}
          >
            <Bell className="h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="font-display">
          <p className="font-semibold">Alertas</p>
          <p className="text-[10px] text-muted-foreground">Monitoreo inteligente de APIs</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button
            onClick={toggleChat}
            className={cn(
              'relative flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200',
              isChatOpen
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground/60 hover:bg-secondary/50 hover:text-foreground'
            )}
          >
            <Bot className="h-[18px] w-[18px]" />
            {recentErrors > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-destructive animate-pulse-glow" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="font-display">
          <p className="font-semibold">{t('nav.assistant')}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}