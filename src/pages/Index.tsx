import { useProjectStore } from '@/store/useProjectStore';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { useApproval } from '@/hooks/useApproval';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { TopBar } from '@/components/layout/TopBar';
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
import { AnimatePresence, motion } from 'framer-motion';
import { useAlertEngine } from '@/hooks/useAlertEngine';
import { requestNotificationPermission } from '@/lib/notifications';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { Navigate } from 'react-router-dom';
import { Loader2, Shield, Clock } from 'lucide-react';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const { isApproved, isAdmin, loading: approvalLoading } = useApproval();
  const { currentView, isChatOpen, scenes, selectedClipId, selectedTransitionId } = useProjectStore();
  const { saveProject, listProjects, loadProject, deleteProject } = useProjects();
  const [showWelcome, setShowWelcome] = useState(true);
  const [imageLabSceneId, setImageLabSceneId] = useState<string | null>(null);
  const [showAPIPanel, setShowAPIPanel] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [recentProjects, setRecentProjects] = useState<any[]>([]);

  const imageLabScene = imageLabSceneId ? scenes.find((s) => s.id === imageLabSceneId) ?? null : null;

  // Smart alert engine — monitors API calls and triggers alerts
  useAlertEngine();
  // Global undo/redo keyboard shortcuts
  useUndoRedo();

  // Request browser notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    if (user) {
      listProjects().then(setRecentProjects);
    }
  }, [user, listProjects]);

  const handleSave = useCallback(async () => {
    const id = await saveProject(currentProjectId ?? undefined);
    if (id) setCurrentProjectId(id);
    return id;
  }, [saveProject, currentProjectId]);

  // Auto-save every 60 seconds when not on welcome screen
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (showWelcome || !user) return;
    autoSaveRef.current = setInterval(() => {
      handleSave();
    }, 60000);
    return () => {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
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

  if (!user) return <Navigate to="/auth" replace />;

  // Approval gate — admins bypass
  if (!isAdmin && !isApproved) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md text-center p-8"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-500/15 border border-yellow-500/20">
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-3">Pending Approval</h2>
          <p className="text-muted-foreground mb-6">
            Your account is awaiting admin approval. You'll get access once an administrator reviews your registration.
          </p>
          <button
            onClick={() => signOut()}
            className="rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/80 transition-colors"
          >
            Sign Out
          </button>
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

  const renderView = () => {
    switch (currentView) {
      case 'architect':
        return <ArchitectView />;
      case 'studio':
        return <StudioView onOpenImageLab={(id) => setImageLabSceneId(id)} />;
      case 'timeline':
        return <TimelineView />;
      case 'dashboard':
        return <DashboardView />;
    }
  };

  return (
    <>
      <CommandPalette />
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        <AppSidebar onToggleAlerts={() => setShowAlerts(!showAlerts)} isAlertsOpen={showAlerts} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar onOpenAPIPanel={() => setShowAPIPanel(true)} onSave={handleSave} />
          <div className="flex flex-1 overflow-hidden">
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-hidden">
                {renderView()}
              </div>
              <LogConsole />
            </div>
            <AnimatePresence>
              {showAlerts && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 340, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="h-full border-l border-border bg-card/50 overflow-hidden"
                >
                  <AlertsPanel />
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {isChatOpen && <ChatPanel />}
            </AnimatePresence>
            <AnimatePresence>
              {(selectedClipId || selectedTransitionId) && currentView === 'timeline' && <ClipPropertiesPanel />}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {imageLabScene && (
        <ImageLab scene={imageLabScene} onClose={() => setImageLabSceneId(null)} />
      )}

      <AnimatePresence>
        {showAPIPanel && <APIManagementPanel onClose={() => setShowAPIPanel(false)} />}
      </AnimatePresence>

      <OnboardingTour />
    </>
  );
};

export default Index;
