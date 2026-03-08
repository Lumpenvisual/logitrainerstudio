import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X } from 'lucide-react';

const shortcuts = [
  { category: 'Playback', items: [
    { keys: ['Space'], action: 'Play / Pause' },
    { keys: ['Home'], action: 'Go to start' },
    { keys: ['End'], action: 'Go to end' },
    { keys: ['←', '→'], action: 'Seek 1 second' },
  ]},
  { category: 'Timeline', items: [
    { keys: ['+', '−'], action: 'Zoom in / out' },
    { keys: ['T'], action: 'Add transition to next clip' },
    { keys: ['D'], action: 'Duplicate clip' },
    { keys: ['Del'], action: 'Delete clip / transition' },
    { keys: ['M'], action: 'Add marker at playhead' },
    { keys: ['Esc'], action: 'Deselect all' },
  ]},
  { category: 'Project', items: [
    { keys: ['⌘', 'K'], action: 'Command palette' },
    { keys: ['⌘', 'S'], action: 'Save project' },
    { keys: ['⌘', 'Z'], action: 'Undo' },
    { keys: ['⌘', '⇧', 'Z'], action: 'Redo' },
  ]},
  { category: 'Navigation', items: [
    { keys: ['1'], action: 'Architect view' },
    { keys: ['2'], action: 'Studio view' },
    { keys: ['3'], action: 'Timeline view' },
    { keys: ['4'], action: 'Dashboard view' },
  ]},
];

export function KeyboardShortcutsHelp({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl max-h-[80vh] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-border p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
              <Keyboard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">Keyboard Shortcuts</h2>
              <p className="text-xs text-muted-foreground">Master your workflow</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted/50 transition-colors text-lg">✕</button>
        </div>

        <div className="overflow-y-auto max-h-[65vh] p-5">
          <div className="grid grid-cols-2 gap-6">
            {shortcuts.map(({ category, items }) => (
              <div key={category}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 mb-3 font-display">{category}</h3>
                <div className="space-y-2">
                  {items.map(({ keys, action }) => (
                    <div key={action} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-foreground/70">{action}</span>
                      <div className="flex items-center gap-0.5">
                        {keys.map((key, i) => (
                          <span key={i}>
                            <kbd className="inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-border bg-background px-1.5 text-[10px] font-mono text-muted-foreground">
                              {key}
                            </kbd>
                            {i < keys.length - 1 && <span className="mx-0.5 text-[10px] text-muted-foreground/30">+</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border p-3 text-center">
          <p className="text-[10px] text-muted-foreground/50 font-mono">Press <kbd className="rounded border border-border bg-background px-1 text-[9px]">?</kbd> anywhere to toggle this panel</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
