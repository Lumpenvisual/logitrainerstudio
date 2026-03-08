import { useEffect } from 'react';
import { useProjectStore } from '@/store/useProjectStore';

export function useUndoRedo() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const mod = isMac ? e.metaKey : e.ctrlKey;

      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useProjectStore.temporal.getState().undo();
      }
      if (mod && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        useProjectStore.temporal.getState().redo();
      }
      // Windows-style redo
      if (mod && e.key === 'y' && !e.shiftKey) {
        e.preventDefault();
        useProjectStore.temporal.getState().redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
