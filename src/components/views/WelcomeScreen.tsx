import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Activity, Sparkles, ArrowRight, Film, Trash2, FolderOpen, Coffee, ShoppingBag, GraduationCap, Gamepad2, Plus, Megaphone, Heart, Building2, Music } from 'lucide-react';
import { useState } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n/useI18n';
import { AI_PROVIDERS } from '@/services/apiRegistry';

interface WelcomeScreenProps {
  onEnter: () => void;
  recentProjects?: { id: string; title: string; updated_at: string }[];
  onLoadProject?: (id: string) => void;
  onDeleteProject?: (id: string) => void;
}

const templates = [
  { icon: Coffee, title: 'Product Ad', brief: 'A sleek, modern product advertisement with cinematic shots, dramatic lighting, and a compelling voiceover.', color: 'text-warning', bgColor: 'bg-warning/10', borderColor: 'border-warning/20' },
  { icon: ShoppingBag, title: 'E-Commerce', brief: 'A fast-paced e-commerce promotional video with dynamic transitions, upbeat music, and clear call-to-action overlays.', color: 'text-success', bgColor: 'bg-success/10', borderColor: 'border-success/20' },
  { icon: GraduationCap, title: 'Educational', brief: 'An engaging educational explainer video with clear visuals, step-by-step demos, and friendly narration.', color: 'text-primary', bgColor: 'bg-primary/10', borderColor: 'border-primary/20' },
  { icon: Gamepad2, title: 'Gaming Trailer', brief: 'An epic gaming trailer with fast cuts, neon aesthetics, intense music, and dramatic transitions.', color: 'text-destructive', bgColor: 'bg-destructive/10', borderColor: 'border-destructive/20' },
  { icon: Megaphone, title: 'Social Media', brief: 'A vertical-format social media reel optimized for TikTok/Instagram with trending transitions and captions.', color: 'text-primary', bgColor: 'bg-primary/10', borderColor: 'border-primary/20' },
  { icon: Heart, title: 'Testimonial', brief: 'A professional customer testimonial video with b-roll footage, lower-thirds, and emotional storytelling.', color: 'text-warning', bgColor: 'bg-warning/10', borderColor: 'border-warning/20' },
  { icon: Building2, title: 'Corporate', brief: 'A polished corporate presentation video with data visualizations, executive narration, and brand consistency.', color: 'text-success', bgColor: 'bg-success/10', borderColor: 'border-success/20' },
  { icon: Music, title: 'Music Video', brief: 'A creative music video with beat-synced transitions, visual effects, color grading, and artistic compositions.', color: 'text-destructive', bgColor: 'bg-destructive/10', borderColor: 'border-destructive/20' },
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
    if (selectedTemplate !== null) setBrief(templates[selectedTemplate].brief);
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
      {/* Animated background orbs */}
      <div className="absolute top-[-15%] right-[-8%] w-[550px] h-[550px] rounded-full bg-primary/[0.06] blur-[140px] animate-orb" />
      <div className="absolute bottom-[-15%] left-[-8%] w-[450px] h-[450px] rounded-full bg-primary-glow/[0.05] blur-[120px] animate-orb-delayed" />

      {/* Dot grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: `radial-gradient(hsl(var(--primary) / 0.4) 1px, transparent 1px)`, backgroundSize: '40px 40px' }}
      />

      <div className="relative z-10 flex flex-1 items-center justify-center">
        <AnimatePresence mode="wait">
          {step === 'hero' ? (
            <motion.div key="hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}
              className="flex flex-col items-center text-center px-6 max-w-4xl w-full"
            >
              {/* Logo */}
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', duration: 0.6, delay: 0.1 }}
                className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 border border-primary/20 glow-primary-lg"
              >
                <Activity className="h-8 w-8 text-primary" />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <h1 className="mb-4 font-display text-4xl md:text-5xl font-bold tracking-tight">
                  <span className="text-gradient-primary">{t('app.name')}</span>
                  <span className="text-foreground/30 font-normal ml-3 text-2xl md:text-3xl">AI Studio</span>
                </h1>
                <p className="text-muted-foreground text-base md:text-lg max-w-md mx-auto mb-2">{t('app.tagline')}</p>
                {user && (
                  <p className="text-xs text-muted-foreground/40 font-mono mb-10">
                    Welcome, <span className="text-primary/60">{user.email}</span>
                  </p>
                )}
              </motion.div>

              {/* Templates */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="w-full max-w-2xl mb-8">
                <p className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-[0.2em] mb-4">Quick Start Templates</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {templates.map(({ icon: Icon, title, color, bgColor, borderColor }, i) => (
                    <motion.button key={title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.06 }}
                      onClick={() => handleTemplateCreate(i)}
                      className={`group flex flex-col items-center gap-2.5 rounded-xl border ${borderColor} bg-card/20 p-4 backdrop-blur-sm transition-all duration-300 hover:bg-card/50 hover:shadow-premium hover:scale-[1.02]`}
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bgColor} transition-transform duration-300 group-hover:scale-110`}>
                        <Icon className={`h-5 w-5 ${color}`} />
                      </div>
                      <span className="text-xs font-semibold text-foreground/80 font-display">{title}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Recent Projects */}
              {recentProjects.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="w-full max-w-lg mb-8">
                  <p className="mb-3 text-[10px] font-mono text-muted-foreground/40 uppercase tracking-[0.2em]">Recent Projects</p>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {recentProjects.slice(0, 5).map((p) => (
                      <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border/30 bg-card/20 px-4 py-2.5 backdrop-blur-sm group transition-all duration-200 hover:border-primary/15 hover:bg-card/40">
                        <FolderOpen className="h-3.5 w-3.5 text-primary/50 shrink-0" />
                        <button onClick={() => onLoadProject?.(p.id)} className="flex-1 text-left text-sm text-foreground/80 hover:text-primary transition-colors truncate">{p.title}</button>
                        <span className="text-[10px] text-muted-foreground/40 font-mono shrink-0">{new Date(p.updated_at).toLocaleDateString()}</span>
                        <button onClick={(e) => { e.stopPropagation(); onDeleteProject?.(p.id); }} className="opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-destructive transition-all">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* AI Providers Carousel */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} className="w-full max-w-2xl mb-10 overflow-hidden">
                <p className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-[0.2em] mb-3 text-center">Powered by Leading AI</p>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-background to-transparent" />
                  <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-background to-transparent" />
                  <div className="flex animate-marquee gap-6 py-2">
                    {[...AI_PROVIDERS, ...AI_PROVIDERS].map((provider, i) => (
                      <div key={`${provider.id}-${i}`} className="flex shrink-0 items-center gap-2 rounded-lg border border-border/20 bg-card/15 px-4 py-2 backdrop-blur-sm transition-all hover:border-primary/20 hover:bg-card/30">
                        <span className="text-lg">{provider.logo}</span>
                        <span className="text-xs font-medium text-muted-foreground/60 whitespace-nowrap font-display">{provider.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* CTA */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }} className="flex flex-col items-center gap-4">
                <button onClick={() => setStep('create')}
                  className="group relative flex items-center gap-2.5 rounded-xl bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground transition-all hover:brightness-110 glow-primary font-display overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <Plus className="h-4 w-4" />
                  {t('welcome.new')}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
                <div className="flex items-center gap-5 mt-1">
                  <Link to="/studio" className="text-xs text-muted-foreground/35 hover:text-primary transition-colors font-mono">Acceso Studio</Link>
                  <Link to="/demo" className="text-xs text-muted-foreground/35 hover:text-primary transition-colors font-mono">Ver demo</Link>
                  <Link to="/about" className="text-xs text-muted-foreground/35 hover:text-primary transition-colors font-mono">{t('welcome.about')}</Link>
                  <span className="text-[10px] font-mono text-muted-foreground/25">{t('app.version')}</span>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div key="create" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full max-w-md px-6">
              <div className="rounded-2xl border border-border/40 bg-card/50 p-8 backdrop-blur-xl shadow-premium-lg">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 border border-primary/20">
                    <Film className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-bold text-foreground">{t('welcome.new')}</h2>
                    <p className="text-xs text-muted-foreground/60">{t('welcome.name')}</p>
                  </div>
                </div>

                {selectedTemplate !== null && (
                  <div className="mb-4 rounded-xl border border-primary/15 bg-primary/5 p-3">
                    <p className="text-[10px] font-mono text-primary/60 uppercase tracking-wider mb-1">Template</p>
                    <p className="text-xs text-muted-foreground/70 leading-relaxed">{templates[selectedTemplate].brief}</p>
                  </div>
                )}

                <input value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreate()} placeholder={t('welcome.placeholder')} autoFocus
                  className="mb-5 w-full rounded-xl border border-border/50 bg-background/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/30 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all duration-200"
                />

                <div className="flex gap-3">
                  <button onClick={() => { setStep('hero'); setSelectedTemplate(null); }}
                    className="flex-1 rounded-xl border border-border/40 bg-secondary/30 px-4 py-2.5 text-sm font-medium text-secondary-foreground transition-all hover:bg-secondary/50"
                  >{t('welcome.back')}</button>
                  <button onClick={handleCreate}
                    className="group relative flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-all hover:brightness-110 glow-primary font-display overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
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
