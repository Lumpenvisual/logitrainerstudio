import { useProjectStore } from '@/store/useProjectStore';
import { useAPIStore } from '@/store/useAPIStore';
import { useI18n } from '@/i18n/useI18n';
import { Locale } from '@/i18n/translations';
import { Zap, ChevronRight, Settings2, Activity, Globe } from 'lucide-react';

const localeLabels: Record<Locale, string> = { en: 'EN', fr: 'FR', es: 'ES' };
const localeOrder: Locale[] = ['en', 'fr', 'es'];

export function TopBar({ onOpenAPIPanel }: { onOpenAPIPanel: () => void }) {
  const { projectTitle, currentView, scenes } = useProjectStore();
  const { totalCalls, avgLatency } = useAPIStore();
  const { t, locale, setLocale } = useI18n();

  const viewLabels: Record<string, string> = {
    architect: t('nav.architect'),
    studio: t('nav.studio'),
    timeline: t('nav.timeline'),
  };

  return (
    <div className="flex h-12 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <Zap className="h-4 w-4 text-primary" />
          <span className="font-semibold">{t('app.name')}</span>
          <span className="text-muted-foreground font-normal">AI Studio</span>
        </div>
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{projectTitle}</span>
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
        <span className="text-sm font-medium text-primary">{viewLabels[currentView]}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            {t('status.online')}
          </span>
          <span className="text-border">|</span>
          <span>{scenes.length} {t('status.scenes')}</span>
          {totalCalls > 0 && (
            <>
              <span className="text-border">|</span>
              <span className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                {totalCalls} {t('status.calls')}
              </span>
              {avgLatency > 0 && (
                <span className="text-muted-foreground/50">~{avgLatency}ms</span>
              )}
            </>
          )}
        </div>

        {/* Language switcher */}
        <div className="flex items-center gap-0.5 rounded-md border border-border overflow-hidden">
          {localeOrder.map((l) => (
            <button
              key={l}
              onClick={() => setLocale(l)}
              className={`px-2 py-1 text-[10px] font-bold transition-colors ${
                locale === l
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              {localeLabels[l]}
            </button>
          ))}
        </div>

        <button
          onClick={onOpenAPIPanel}
          className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary/30 hover:text-primary"
          title={t('api.title')}
        >
          <Settings2 className="h-3.5 w-3.5" />
          API
        </button>
      </div>
    </div>
  );
}
