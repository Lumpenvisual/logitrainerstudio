import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Activity, Sparkles, ArrowRight, Zap, Film, Clock, Cpu, Trash2, FolderOpen, Coffee, ShoppingBag, GraduationCap, Gamepad2, Plus } from 'lucide-react';
import { useState } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n/useI18n';

interface WelcomeScreenProps {
  onEnter: () => void;
  recentProjects?: { id: string; title: string; updated_at: string }[];
  onLoadProject?: (id: string) => void;
  onDeleteProject?: (id: string) => void;
}

const templates = [
  {
    icon: Coffee,
    title: 'Product Ad',
    brief: 'A sleek, modern product advertisement with cinematic shots, dramatic lighting, and a compelling voiceover that highlights premium quality.',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
  {
    icon: ShoppingBag,
    title: 'E-Commerce',
    brief: 'A fast-paced e-commerce promotional video showcasing multiple products with dynamic transitions, upbeat music, and clear call-to-action overlays.',
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  {
    icon: GraduationCap,
    title: 'Educational',
    brief: 'An engaging educational explainer video with clear visuals, step-by-step demonstrations, and a friendly narration style for complex topics.',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    icon: Gamepad2,
    title: 'Gaming Trailer',
    brief: 'An epic gaming trailer with fast cuts, neon aesthetics, intense music, and dramatic scene transitions that build excitement.',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
  },
];

const features = [
  { icon: Sparkles, title: 'AI Script Generation', desc: 'Multi-scene scripts from a brief' },
  { icon: Film, title: 'Asset Orchestration', desc: 'Image, audio & video in one flow' },
  { icon: Clock, title: 'Timeline Editor', desc: 'Professional multi-track editing' },
  { icon: Cpu, title: 'Neural Assistant', desc: 'AI copilot for creative direction' },
];

export function WelcomeScreen({ onEnter, recentProjects = [], onLoadProject, onDeleteProject }: WelcomeScreenProps) {
  const { setProjectTitle, setBrief, addLog } = useProjectStore();
  const { user } = useAuth();
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [step, setStep] = useState<'hero' | 'create'>('hero');
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);

  const handleCreate = () => {
    const finalTitle = title.trim() || 'Untitled Project';
    setProjectTitle(finalTitle);
    if (selectedTemplate !== null) {
      setBrief(templates[selectedTemplate].brief);
    }
    addLog('success', `Project "${finalTitle}" initialized`);
    addLog('info', 'Neural systems online. Ready for input.');
    onEnter();
  };

  const handleTemplateCreate = (idx: number) => {
    setSelectedTemplate(idx);
    setStep('create');
    setTitle(templates[idx].title + ' Video');
  };

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-background">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[150px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary-glow/5 blur-[120px]" />
      </div>

      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
        }}
      />

      <div className="relative z-10 flex flex-1 items-center justify-center">
        <AnimatePresence mode="wait">
          {step === 'hero' ? (
            <motion.div
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center text-center px-6 max-w-4xl w-full"
            >
              {/* Logo */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', duration: 0.6, delay: 0.1 }}
                className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 border border-primary/20 glow-primary-lg"
              >
                <Activity className="h-8 w-8 text-primary" />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <h1 className="mb-3 font-display text-4xl md:text-5xl font-bold tracking-tight">
                  <span className="text-gradient-primary">{t('app.name')}</span>
                  <span className="text-foreground/40 font-normal ml-3 text-2xl md:text-3xl">AI Studio</span>
                </h1>
                <p className="text-muted-foreground text-base md:text-lg max-w-md mx-auto mb-2">
                  {t('app.tagline')}
                </p>
                {user && (
                  <p className="text-xs text-muted-foreground/50 font-mono mb-8">
                    Welcome, <span className="text-primary/70">{user.email}</span>
                  </p>
                )}
              </motion.div>

              {/* Quick-start templates */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="w-full max-w-2xl mb-8"
              >
                <p className="text-xs font-mono text-muted-foreground/50 uppercase tracking-widest mb-3">Quick Start Templates</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {templates.map(({ icon: Icon, title, color, bgColor }, i) => (
                    <motion.button
                      key={title}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + i * 0.06 }}
                      onClick={() => handleTemplateCreate(i)}
                      className="group flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-card/30 p-4 backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-card/60 hover:scale-[1.02]"
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bgColor} transition-all group-hover:scale-110`}>
                        <Icon className={`h-5 w-5 ${color}`} />
                      </div>
                      <span className="text-xs font-semibold text-foreground font-display">{title}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Recent Projects */}
              {recentProjects.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="w-full max-w-lg mb-8"
                >
                  <p className="mb-2.5 text-xs font-mono text-muted-foreground/50 uppercase tracking-widest">Recent Projects</p>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {recentProjects.slice(0, 5).map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-3 rounded-lg border border-border/40 bg-card/30 px-4 py-2.5 backdrop-blur-sm group transition-all hover:border-primary/20 hover:bg-card/50"
                      >
                        <FolderOpen className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                        <button
                          onClick={() => onLoadProject?.(p.id)}
                          className="flex-1 text-left text-sm text-foreground hover:text-primary transition-colors truncate"
                        >
                          {p.title}
                        </button>
                        <span className="text-[10px] text-muted-foreground/50 font-mono shrink-0">
                          {new Date(p.updated_at).toLocaleDateString()}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteProject?.(p.id); }}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* CTA buttons */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.75 }}
                className="flex flex-col items-center gap-3"
              >
                <button
                  onClick={() => setStep('create')}
                  className="group flex items-center gap-2.5 rounded-xl bg-primary px-7 py-3.5 text-sm font-bold text-primary-foreground transition-all hover:brightness-110 glow-primary font-display"
                >
                  <Plus className="h-4 w-4" />
                  {t('welcome.new')}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>

                <div className="flex items-center gap-4 mt-2">
                  <Link to="/about" className="text-xs text-muted-foreground/40 hover:text-primary transition-colors font-mono">
                    {t('welcome.about')}
                  </Link>
                  <span className="text-[10px] font-mono text-muted-foreground/30">{t('app.version')}</span>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-md px-6"
            >
              <div className="rounded-2xl border border-border/50 bg-card/60 p-8 backdrop-blur-xl">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 border border-primary/20">
                    <Film className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-bold text-foreground">{t('welcome.new')}</h2>
                    <p className="text-xs text-muted-foreground">{t('welcome.name')}</p>
                  </div>
                </div>

                {selectedTemplate !== null && (
                  <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <p className="text-[10px] font-mono text-primary/70 uppercase tracking-wider mb-1">Template</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{templates[selectedTemplate].brief}</p>
                  </div>
                )}

                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  placeholder={t('welcome.placeholder')}
                  autoFocus
                  className="mb-5 w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => { setStep('hero'); setSelectedTemplate(null); }}
                    className="flex-1 rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground transition-all hover:bg-secondary/80"
                  >
                    {t('welcome.back')}
                  </button>
                  <button
                    onClick={handleCreate}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-all hover:brightness-110 glow-primary font-display"
                  >
                    <Sparkles className="h-4 w-4" />
                    {t('welcome.create')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}