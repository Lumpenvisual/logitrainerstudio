import { useProjectStore } from '@/store/useProjectStore';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { useApproval } from '@/hooks/useApproval';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { TopBar } from '@/components/layout/TopBar';
import { StatusBar } from '@/components/layout/StatusBar';
import { ArchitectView } from '@/components/views/ArchitectView';
import { StudioView } from '@/components/views/StudioView';
import { TimelineView } from '@/components/views/TimelineView';
import { DashboardView } from '@/components/views/DashboardView';
import { CommandPalette } from '@/components/CommandPalette';
import { ChatPanel } from '@/components/panels/ChatPanel';
import { LogConsole } from '@/components/panels/LogConsole';
import { WelcomeScreen } from '@/components/views/WelcomeScreen';
import { ImageLab } from '@/components/views/ImageLab';
import { APIManagementPanel } from '@/components/panels/APIManagementPanel';
import { AlertsPanel } from '@/components/panels/AlertsPanel';
import { ClipPropertiesPanel } from '@/components/panels/ClipPropertiesPanel';
import { AdminApprovalPanel } from '@/components/panels/AdminApprovalPanel';
import { MediaBrowserPanel } from '@/components/panels/MediaBrowserPanel';
import { ProjectSettingsPanel } from '@/components/panels/ProjectSettingsPanel';
import { RenderExportPanel } from '@/components/panels/RenderExportPanel';
import { KeyboardShortcutsHelp } from '@/components/panels/KeyboardShortcutsHelp';
import { ColorGradingPanel } from '@/components/panels/ColorGradingPanel';
import { ReferralPanel } from '@/components/panels/ReferralPanel';
import { MarketingContentPanel } from '@/components/panels/MarketingContentPanel';
import { ConnectorsPanel } from '@/components/panels/ConnectorsPanel';
import { SchedulerPanel } from '@/components/panels/SchedulerPanel';
import { EmailAutomationPanel } from '@/components/panels/EmailAutomationPanel';
import { WebhookTriggersPanel } from '@/components/panels/WebhookTriggersPanel';
import { TemplatesMarketplacePanel } from '@/components/panels/TemplatesMarketplacePanel';
import { AgentCrewPanel } from '@/components/panels/AgentCrewPanel';
import { AnimatePresence, motion } from 'framer-motion';
import { useAlertEngine } from '@/hooks/useAlertEngine';
import { requestNotificationPermission } from '@/lib/notifications';
import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Loader2, Clock } from 'lucide-react';
import type { ViewMode } from '@/store/useProjectStore';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { LanguageProvider } from '@/i18n/LanguageContext';

const ClassicStudioWorkspace = lazy(() =>
  import('@/components/classic-studio/ClassicStudioWorkspace').then((m) => ({
    default: m.ClassicStudioWorkspace,
  })),
);

const Index = () => {
  const location = useLocation();
  const routeInitialView = (location.state as { initialView?: ViewMode } | null)?.initialView;
  const { user, loading, signOut } = useAuth();
  const { isApproved, isAdmin, loading: approvalLoading } = useApproval();
  const { currentView, setView, isChatOpen, scenes, selectedClipId, selectedTransitionId } = useProjectStore();
  const { saveProject, listProjects, loadProject, deleteProject } = useProjects();
  const [showWelcome, setShowWelcome] = useState(() => !routeInitialView);
  const [imageLabSceneId, setImageLabSceneId] = useState<string | null>(null);
  const [showAPIPanel, setShowAPIPanel] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showMediaBrowser, setShowMediaBrowser] = useState(false);
  const [showProjectSettings, setShowProjectSettings] = useState(false);
  const [showRenderExport, setShowRenderExport] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showColorGrading, setShowColorGrading] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [recentProjects, setRecentProjects] = useState<any[]>([]);

  const imageLabScene = imageLabSceneId ? scenes.find((s) => s.id === imageLabSceneId) ?? null : null;

  useAlertEngine();
  useUndoRedo();

  useEffect(() => { requestNotificationPermission(); }, []);

  useLayoutEffect(() => {
    if (routeInitialView) {
      setShowWelcome(false);
      setView(routeInitialView);
      window.history.replaceState({}, '', '/');
      return;
    }
    if (user && sessionStorage.getItem('lts-pending-view') === 'suite') {
      sessionStorage.removeItem('lts-pending-view');
      setShowWelcome(false);
      setView('suite');
    }
  }, [routeInitialView, setView, user]);

  useEffect(() => {
    if (currentView === 'suite') setShowWelcome(false);
  }, [currentView]);

  useEffect(() => {
    if (user) { listProjects().then(setRecentProjects); }
  }, [user, listProjects]);

  // Global ? key for keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '?') { e.preventDefault(); setShowKeyboardShortcuts(prev => !prev); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSave = useCallback(async () => {
    const id = await saveProject(currentProjectId ?? undefined);
    if (id) setCurrentProjectId(id);
    return id;
  }, [saveProject, currentProjectId]);

  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (showWelcome || !user) return;
    autoSaveRef.current = setInterval(() => { handleSave(); }, 60000);
    return () => { if (autoSaveRef.current) clearInterval(autoSaveRef.current); };
  }, [showWelcome, user, handleSave]);

  const handleLoadProject = useCallback(async (projectId: string) => {
    await loadProject(projectId);
    setCurrentProjectId(projectId);
    setShowWelcome(false);
  }, [loadProject]);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    const ok = await deleteProject(projectId);
    if (ok) {
      setRecentProjects(prev => prev.filter(p => p.id !== projectId));
      if (currentProjectId === projectId) setCurrentProjectId(null);
    }
  }, [deleteProject, currentProjectId]);

  if (loading || approvalLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    if (routeInitialView === 'suite') {
      sessionStorage.setItem('lts-pending-view', 'suite');
    }
    return (
      <Navigate
        to="/studio/login"
        replace
        state={{ from: location.pathname, initialView: routeInitialView }}
      />
    );
  }

  if (!isAdmin && !isApproved) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md text-center p-8">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-warning/15 border border-warning/20">
            <Clock className="h-8 w-8 text-warning" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-3">Pending Approval</h2>
          <p className="text-muted-foreground mb-6">Your account is awaiting admin approval.</p>
          <button onClick={() => signOut()} className="rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/80 transition-colors">Sign Out</button>
        </motion.div>
      </div>
    );
  }

  if (showWelcome) {
    return (
      <WelcomeScreen
        onEnter={() => setShowWelcome(false)}
        recentProjects={recentProjects}
        onLoadProject={handleLoadProject}
        onDeleteProject={handleDeleteProject}
      />
    );
  }

  if (currentView === 'suite') {
    return (
      <LanguageProvider>
        <Suspense
          fallback={
            <div className="flex h-screen items-center justify-center bg-background">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }
        >
          <ClassicStudioWorkspace onExitToPro={() => setView('architect')} />
        </Suspense>
      </LanguageProvider>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'architect': return <ArchitectView />;
      case 'studio': return <StudioView onOpenImageLab={(id) => setImageLabSceneId(id)} />;
      case 'timeline': return <TimelineView />;
      case 'dashboard': return <DashboardView />;
      case 'marketing': return <MarketingContentPanel />;
      case 'connectors': return <ConnectorsPanel />;
      case 'referrals': return <ReferralPanel />;
      case 'scheduler': return <SchedulerPanel />;
      case 'email': return <EmailAutomationPanel />;
      case 'webhooks': return <WebhookTriggersPanel />;
      case 'marketplace': return <TemplatesMarketplacePanel />;
      case 'agents': return <AgentCrewPanel />;
    }
  };

  return (
    <>
      <CommandPalette />
      <div className="flex h-[100dvh] h-screen w-full max-w-[100vw] overflow-hidden bg-background">
        <AppSidebar onToggleAlerts={() => setShowAlerts(!showAlerts)} isAlertsOpen={showAlerts} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar
            onOpenAPIPanel={() => setShowAPIPanel(true)}
            onSave={handleSave}
            onOpenAdminPanel={isAdmin ? () => setShowAdminPanel(true) : undefined}
            onOpenMediaBrowser={() => setShowMediaBrowser(true)}
            onOpenProjectSettings={() => setShowProjectSettings(true)}
            onOpenRenderExport={() => setShowRenderExport(true)}
            onOpenColorGrading={() => setShowColorGrading(true)}
            onOpenKeyboardShortcuts={() => setShowKeyboardShortcuts(true)}
          />
          <div className="flex flex-1 overflow-hidden">
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-hidden">{renderView()}</div>
              <LogConsole />
            </div>
            <AnimatePresence>
              {showAlerts && (
                <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 340, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="h-full border-l border-border bg-card/50 overflow-hidden">
                  <AlertsPanel />
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>{isChatOpen && <ChatPanel />}</AnimatePresence>
            <AnimatePresence>
              {(selectedClipId || selectedTransitionId) && currentView === 'timeline' && <ClipPropertiesPanel />}
            </AnimatePresence>
          </div>
          <StatusBar />
        </div>
      </div>

      {imageLabScene && <ImageLab scene={imageLabScene} onClose={() => setImageLabSceneId(null)} />}

      <AnimatePresence>{showAPIPanel && <APIManagementPanel onClose={() => setShowAPIPanel(false)} />}</AnimatePresence>
      <AnimatePresence>{showAdminPanel && <AdminApprovalPanel onClose={() => setShowAdminPanel(false)} />}</AnimatePresence>
      <AnimatePresence>{showMediaBrowser && <MediaBrowserPanel onClose={() => setShowMediaBrowser(false)} />}</AnimatePresence>
      <AnimatePresence>{showProjectSettings && <ProjectSettingsPanel onClose={() => setShowProjectSettings(false)} />}</AnimatePresence>
      <AnimatePresence>{showRenderExport && <RenderExportPanel onClose={() => setShowRenderExport(false)} />}</AnimatePresence>
      <AnimatePresence>{showKeyboardShortcuts && <KeyboardShortcutsHelp onClose={() => setShowKeyboardShortcuts(false)} />}</AnimatePresence>
      <AnimatePresence>{showColorGrading && <ColorGradingPanel onClose={() => setShowColorGrading(false)} />}</AnimatePresence>

      <OnboardingTour />
    </>
  );
};

export default Index;
