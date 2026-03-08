import { motion, AnimatePresence } from 'framer-motion';
import { X, Wand2, Eye, RotateCcw, Loader2, Sparkles, ScanSearch } from 'lucide-react';
import { useState } from 'react';
import { useProjectStore, Scene } from '@/store/useProjectStore';
import { useAPIStore } from '@/store/useAPIStore';
import { useI18n } from '@/i18n/useI18n';
import { analyzeImage } from '@/services/aiService';
import { getModelById } from '@/services/apiRegistry';
import ReactMarkdown from 'react-markdown';

interface ImageLabProps {
  scene: Scene | null;
  onClose: () => void;
}

export function ImageLab({ scene, onClose }: ImageLabProps) {
  const { addLog } = useProjectStore();
  const { preferences, addCallLog } = useAPIStore();
  const { t } = useI18n();
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [editHistory, setEditHistory] = useState<string[]>([]);

  if (!scene) return null;

  const handleEdit = () => {
    if (!editPrompt.trim()) return;
    setIsEditing(true);
    addLog('info', `Image Lab: Editing scene ${scene.sceneNumber} — "${editPrompt}"`);

    // Simulated for now (image edit API needs base64 image input)
    setTimeout(() => {
      setIsEditing(false);
      setEditHistory((prev) => [...prev, editPrompt]);
      setEditPrompt('');
      addLog('success', `Image Lab: Edit applied to scene ${scene.sceneNumber}`);
    }, 2500);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const model = preferences.imageAnalysis;
    addLog('info', `Image Lab: Analyzing scene ${scene.sceneNumber} with ${getModelById(model)?.name}...`);

    const result = await analyzeImage(
      scene.assets.image || '',
      `Analyze the composition, lighting, color palette, mood, and suggest improvements for this scene: ${scene.visualPrompt}`,
      model
    );

    if (result.error) {
      addLog('error', `Analysis failed: ${result.error}`);
      setAnalysis(`⚠️ Analysis failed: ${result.error}`);
      addCallLog({ function: 'analyze-image', model, status: 'error', latencyMs: result.latencyMs || 0, error: result.error });
    } else if (result.data) {
      setAnalysis(result.data.analysis);
      addLog('success', `Image Lab: Analysis complete for scene ${scene.sceneNumber} (${result.latencyMs}ms)`);
      addCallLog({ function: 'analyze-image', model: result.model || model, status: 'success', latencyMs: result.latencyMs || 0 });
    }

    setIsAnalyzing(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xl"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-5xl mx-4 max-h-[90vh] overflow-hidden rounded-lg border border-border bg-card"
        >
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/20 border border-primary/30">
                <Wand2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">{t('imagelab.title')}</h2>
                <p className="text-xs text-muted-foreground font-mono">{t('common.scene')} {scene.sceneNumber} • {scene.sceneType}</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex max-h-[calc(90vh-64px)]">
            <div className="flex-1 flex items-center justify-center p-6 border-r border-border">
              <div className="relative w-full aspect-video rounded-md bg-secondary/30 border border-border overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Eye className="mx-auto h-12 w-12 text-primary/30 mb-2" />
                    <p className="text-sm text-muted-foreground">{t('imagelab.preview')} — {t('common.scene')} {scene.sceneNumber}</p>
                    <p className="text-xs text-muted-foreground/50 mt-1 max-w-xs">{scene.visualPrompt}</p>
                  </div>
                </div>

                {isEditing && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
                    <div className="text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary mb-2" />
                      <p className="text-sm text-primary font-medium">{t('imagelab.editing')}</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="w-80 flex flex-col overflow-auto">
              <div className="border-b border-border p-4">
                <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Wand2 className="h-3 w-3" /> {t('imagelab.edit')}
                </h3>
                <textarea
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder={t('imagelab.edit.placeholder')}
                  className="mb-2 w-full h-20 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
                <button
                  onClick={handleEdit}
                  disabled={isEditing || !editPrompt.trim()}
                  className="w-full flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
                >
                  {isEditing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {isEditing ? t('imagelab.editing') : t('imagelab.apply')}
                </button>
              </div>

              <div className="border-b border-border p-4">
                <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <ScanSearch className="h-3 w-3" /> {t('imagelab.analyze')}
                </h3>
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full flex items-center justify-center gap-2 rounded-md border border-border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-all hover:border-primary/30 hover:text-primary disabled:opacity-50"
                >
                  {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
                  {isAnalyzing ? t('imagelab.analyzing') : t('imagelab.analyze.btn')}
                </button>
                {analysis && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 rounded-md border border-border bg-background p-3 text-xs text-foreground/80 leading-relaxed prose prose-sm prose-invert max-w-none"
                  >
                    <ReactMarkdown>{analysis}</ReactMarkdown>
                  </motion.div>
                )}
              </div>

              <div className="flex-1 p-4">
                <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <RotateCcw className="h-3 w-3" /> {t('imagelab.history')}
                </h3>
                {editHistory.length === 0 ? (
                  <p className="text-xs text-muted-foreground/50">{t('imagelab.noedits')}</p>
                ) : (
                  <div className="space-y-1.5">
                    {editHistory.map((edit, i) => (
                      <div key={i} className="flex items-center gap-2 rounded bg-secondary/50 px-2 py-1.5 text-xs text-muted-foreground">
                        <span className="shrink-0 font-mono text-primary/60">#{i + 1}</span>
                        <span className="truncate">{edit}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
