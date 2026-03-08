import { useProjectStore } from '@/store/useProjectStore';
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
import { useState } from 'react';

const Index = () => {
  const { currentView, isChatOpen, scenes } = useProjectStore();
  const [showWelcome, setShowWelcome] = useState(true);
  const [imageLabSceneId, setImageLabSceneId] = useState<string | null>(null);
  const [showAPIPanel, setShowAPIPanel] = useState(false);

  const imageLabScene = imageLabSceneId ? scenes.find((s) => s.id === imageLabSceneId) ?? null : null;

  if (showWelcome) {
    return <WelcomeScreen onEnter={() => setShowWelcome(false)} />;
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
          <TopBar onOpenAPIPanel={() => setShowAPIPanel(true)} />
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
