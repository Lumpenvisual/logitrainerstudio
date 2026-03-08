import { useProjectStore } from '@/store/useProjectStore';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { TopBar } from '@/components/layout/TopBar';
import { ArchitectView } from '@/components/views/ArchitectView';
import { StudioView } from '@/components/views/StudioView';
import { TimelineView } from '@/components/views/TimelineView';
import { ChatPanel } from '@/components/panels/ChatPanel';
import { LogConsole } from '@/components/panels/LogConsole';
import { WelcomeScreen } from '@/components/views/WelcomeScreen';
import { ImageLab } from '@/components/views/ImageLab';
import { APIManagementPanel } from '@/components/panels/APIManagementPanel';
import { AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const { currentView, isChatOpen, scenes } = useProjectStore();
  const { saveProject, listProjects, loadProject, deleteProject } = useProjects();
  const [showWelcome, setShowWelcome] = useState(true);
  const [imageLabSceneId, setImageLabSceneId] = useState<string | null>(null);
  const [showAPIPanel, setShowAPIPanel] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [recentProjects, setRecentProjects] = useState<any[]>([]);

  const imageLabScene = imageLabSceneId ? scenes.find((s) => s.id === imageLabSceneId) ?? null : null;

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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

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
    }
  };

  return (
    <>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        <AppSidebar />
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
              {isChatOpen && <ChatPanel />}
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
    </>
  );
};

export default Index;
