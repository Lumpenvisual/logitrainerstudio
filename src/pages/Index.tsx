import { useProjectStore } from '@/store/useProjectStore';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { TopBar } from '@/components/layout/TopBar';
import { ArchitectView } from '@/components/views/ArchitectView';
import { StudioView } from '@/components/views/StudioView';
import { TimelineView } from '@/components/views/TimelineView';
import { ChatPanel } from '@/components/panels/ChatPanel';
import { LogConsole } from '@/components/panels/LogConsole';
import { AnimatePresence } from 'framer-motion';

const Index = () => {
  const { currentView, isChatOpen } = useProjectStore();

  const renderView = () => {
    switch (currentView) {
      case 'architect': return <ArchitectView />;
      case 'studio': return <StudioView />;
      case 'timeline': return <TimelineView />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
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
  );
};

export default Index;
