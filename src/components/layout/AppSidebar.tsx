import { Link } from 'react-router-dom';
import { FileText, Clapperboard, Clock, Bot, Activity, Bell, BarChart3, Gift, Megaphone, Plug, CalendarDays, Mail, Webhook, Store, Sparkles, LayoutGrid } from 'lucide-react';
import { useProjectStore, ViewMode } from '@/store/useProjectStore';
import { useAlertStore } from '@/store/useAlertStore';
import { useI18n } from '@/i18n/useI18n';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function AppSidebar({ onToggleAlerts, isAlertsOpen }: { onToggleAlerts?: () => void; isAlertsOpen?: boolean }) {
  const { currentView, setView, toggleChat, isChatOpen, logs } = useProjectStore();
  const { unreadCount } = useAlertStore();
  const { t } = useI18n();
  const recentErrors = logs.filter((l) => l.level === 'error').length;

  const navItems: { view: ViewMode; icon: typeof FileText; label: string; sub: string }[] = [
    { view: 'architect', icon: FileText, label: t('nav.architect'), sub: t('nav.architect.sub') },
    { view: 'studio', icon: Clapperboard, label: t('nav.studio'), sub: t('nav.studio.sub') },
    { view: 'timeline', icon: Clock, label: t('nav.timeline'), sub: t('nav.timeline.sub') },
    { view: 'dashboard', icon: BarChart3, label: 'Dashboard', sub: 'API Observability' },
    { view: 'agents' as ViewMode, icon: Sparkles, label: 'Agent Crew', sub: 'AI Orchestrator' },
    { view: 'marketing' as ViewMode, icon: Megaphone, label: 'Marketing', sub: 'Content Generator' },
    { view: 'email' as ViewMode, icon: Mail, label: 'Email Builder', sub: 'AI Sequences' },
    { view: 'scheduler' as ViewMode, icon: CalendarDays, label: 'Scheduler', sub: 'Social Calendar' },
    { view: 'webhooks' as ViewMode, icon: Webhook, label: 'Webhooks', sub: 'Automations' },
    { view: 'marketplace' as ViewMode, icon: Store, label: 'Marketplace', sub: 'Community Templates' },
    { view: 'connectors' as ViewMode, icon: Plug, label: 'Connectors', sub: 'Integrations' },
    { view: 'referrals' as ViewMode, icon: Gift, label: 'Referrals', sub: 'Invite & Earn' },
  ];

  return (
    <div className="flex h-full w-[56px] flex-col items-center border-r border-border/60 bg-card/30 backdrop-blur-sm py-3 gap-1">
      {/* Logo */}
      <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 border border-primary/20">
        <Activity className="h-4 w-4 text-primary" />
      </div>

      {/* Separator */}
      <div className="w-5 h-px bg-border/50 mb-2" />

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map(({ view, icon: Icon, label, sub }) => {
          const active = currentView === view;
          return (
            <Tooltip key={view} delayDuration={200}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setView(view)}
                  className={cn(
                    'group relative flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200',
                    active
                      ? 'bg-primary/15 text-primary shadow-sm'
                      : 'text-muted-foreground/50 hover:bg-secondary/40 hover:text-foreground'
                  )}
                >
                  <Icon className="h-[17px] w-[17px]" />
                  {active && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[2px] rounded-r-full bg-primary"
                      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8} className="font-display bg-card border-border shadow-premium">
                <p className="font-semibold text-xs">{label}</p>
                <p className="text-[10px] text-muted-foreground">{sub}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="flex flex-col gap-1">
        <div className="w-5 h-px bg-border/50 mb-1" />

        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <Link
              to="/classic"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground/50 transition-all duration-200 hover:bg-secondary/40 hover:text-foreground"
            >
              <LayoutGrid className="h-[17px] w-[17px]" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8} className="font-display bg-card border-border shadow-premium">
            <p className="font-semibold text-xs">Studio clásico</p>
            <p className="text-[10px] text-muted-foreground">Editor Lovable completo</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <button
              onClick={onToggleAlerts}
              className={cn(
                'relative flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200',
                isAlertsOpen ? 'bg-warning/15 text-warning' : 'text-muted-foreground/50 hover:bg-secondary/40 hover:text-foreground'
              )}
            >
              <Bell className="h-[17px] w-[17px]" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-destructive px-0.5 text-[8px] font-bold text-destructive-foreground ring-2 ring-card">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8} className="font-display bg-card border-border shadow-premium">
            <p className="font-semibold text-xs">Alerts</p>
            <p className="text-[10px] text-muted-foreground">Smart API monitoring</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <button
              onClick={toggleChat}
              className={cn(
                'relative flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200',
                isChatOpen ? 'bg-primary/15 text-primary' : 'text-muted-foreground/50 hover:bg-secondary/40 hover:text-foreground'
              )}
            >
              <Bot className="h-[17px] w-[17px]" />
              {recentErrors > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-card animate-pulse" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8} className="font-display bg-card border-border shadow-premium">
            <p className="font-semibold text-xs">{t('nav.assistant')}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
