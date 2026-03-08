import { motion } from 'framer-motion';
import { useI18n } from '@/i18n/useI18n';
import {
  Activity, Sparkles, Film, Clock, Cpu, Layers, Wand2, Settings2,
  BarChart3, Globe, Zap, ArrowLeft, Brain, Palette, Volume2,
  Shield, Workflow, Monitor, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' as const } }),
};

const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

export default function AboutPage() {
  const { t } = useI18n();

  const coreModules = [
    { icon: Sparkles, title: t('about.module.architect'), desc: t('about.module.architect.desc'), accent: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
    { icon: Layers, title: t('about.module.studio'), desc: t('about.module.studio.desc'), accent: 'text-success', bg: 'bg-success/10 border-success/20' },
    { icon: Clock, title: t('about.module.timeline'), desc: t('about.module.timeline.desc'), accent: 'text-warning', bg: 'bg-warning/10 border-warning/20' },
    { icon: Brain, title: t('about.module.assistant'), desc: t('about.module.assistant.desc'), accent: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
    { icon: Wand2, title: t('about.module.imagelab'), desc: t('about.module.imagelab.desc'), accent: 'text-success', bg: 'bg-success/10 border-success/20' },
    { icon: Settings2, title: t('about.module.api'), desc: t('about.module.api.desc'), accent: 'text-warning', bg: 'bg-warning/10 border-warning/20' },
  ];

  const techStack = [
    { label: 'React 18', desc: 'UI Framework' },
    { label: 'TypeScript', desc: 'Type Safety' },
    { label: 'Tailwind CSS', desc: 'Styling' },
    { label: 'Zustand + Immer', desc: 'State Management' },
    { label: 'Framer Motion', desc: 'Animations' },
    { label: 'Lovable Cloud', desc: 'Backend & AI' },
  ];

  const aiModels = [
    { provider: 'Google AI', models: ['Gemini 2.5 Pro', 'Gemini 3 Flash', 'Gemini 2.5 Flash', 'Gemini 3 Pro Image'], color: 'text-blue-400' },
    { provider: 'OpenAI', models: ['GPT-5', 'GPT-5.2', 'GPT-5 Mini', 'GPT-5 Nano'], color: 'text-emerald-400' },
  ];

  const stats = [
    { value: '11+', label: t('about.stat.models') },
    { value: '2', label: t('about.stat.providers') },
    { value: '3', label: t('about.stat.languages') },
    { value: '∞', label: t('about.stat.possibilities') },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
          }}
        />
        {/* Glow orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-primary/8 blur-[100px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 pt-12 pb-24">
          {/* Back nav */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-16 group"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              {t('about.back')}
            </Link>
          </motion.div>

          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', duration: 0.8, delay: 0.1 }}
              className="mb-8 flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/15 border border-primary/25 glow-primary-lg"
            >
              <Activity className="h-12 w-12 text-primary" />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <p className="text-xs font-mono text-primary uppercase tracking-[0.3em] mb-4">{t('about.label')}</p>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4">
                <span className="text-gradient-primary">LogiTrainer</span>
              </h1>
              <p className="text-2xl md:text-3xl font-medium text-foreground/90 mb-2">AI Studio 2.0 Pro</p>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mt-6">
                {t('about.hero.desc')}
              </p>
            </motion.div>

            {/* Stats bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl"
            >
              {stats.map(({ value, label }) => (
                <div key={label} className="rounded-lg border border-border bg-card/50 backdrop-blur-sm px-4 py-5 text-center">
                  <p className="text-3xl font-bold font-mono text-primary">{value}</p>
                  <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── What It Is ──────────────────────────────────────── */}
      <section className="border-t border-border bg-card/30">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
            className="grid md:grid-cols-2 gap-16 items-center"
          >
            <motion.div variants={fadeUp} custom={0}>
              <p className="text-xs font-mono text-primary uppercase tracking-[0.2em] mb-3">{t('about.what.label')}</p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">{t('about.what.title')}</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">{t('about.what.p1')}</p>
              <p className="text-muted-foreground leading-relaxed">{t('about.what.p2')}</p>
            </motion.div>

            <motion.div variants={fadeUp} custom={2} className="relative">
              <div className="rounded-xl border border-border bg-card p-1 shadow-2xl shadow-primary/5">
                <div className="rounded-lg bg-background p-6 space-y-3">
                  {['Script Architect → AI generates scenes', 'Asset Studio → Images, audio, video', 'Timeline → Multi-track editing', 'Neural Assistant → Creative copilot'].map((step, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-md border border-border/50 bg-card/50 px-4 py-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary/20 text-xs font-bold text-primary font-mono">{i + 1}</div>
                      <span className="text-sm text-foreground/80">{step}</span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground/40 ml-auto" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -inset-4 bg-primary/5 rounded-2xl blur-2xl -z-10" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Core Modules ────────────────────────────────────── */}
      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
              <p className="text-xs font-mono text-primary uppercase tracking-[0.2em] mb-3">{t('about.modules.label')}</p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">{t('about.modules.title')}</h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {coreModules.map(({ icon: Icon, title, desc, accent, bg }, i) => (
                <motion.div
                  key={title}
                  variants={fadeUp}
                  custom={i + 1}
                  className="group rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-lg border ${bg}`}>
                    <Icon className={`h-5 w-5 ${accent}`} />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── AI Providers ────────────────────────────────────── */}
      <section className="border-t border-border bg-card/30">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
              <p className="text-xs font-mono text-primary uppercase tracking-[0.2em] mb-3">{t('about.ai.label')}</p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">{t('about.ai.title')}</h2>
              <p className="text-muted-foreground mt-3 max-w-lg mx-auto">{t('about.ai.desc')}</p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {aiModels.map(({ provider, models, color }, i) => (
                <motion.div key={provider} variants={fadeUp} custom={i + 1} className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center gap-3 border-b border-border px-6 py-4">
                    <Cpu className={`h-5 w-5 ${color}`} />
                    <h3 className="text-sm font-semibold text-foreground">{provider}</h3>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-2">
                    {models.map((m) => (
                      <div key={m} className="rounded-md bg-background border border-border/50 px-3 py-2.5 text-center">
                        <p className="text-xs font-medium text-foreground">{m}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Tech Stack ──────────────────────────────────────── */}
      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
              <p className="text-xs font-mono text-primary uppercase tracking-[0.2em] mb-3">{t('about.tech.label')}</p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">{t('about.tech.title')}</h2>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {techStack.map(({ label, desc }, i) => (
                <motion.div
                  key={label}
                  variants={fadeUp}
                  custom={i + 1}
                  className="rounded-xl border border-border bg-card p-5 text-center transition-all hover:border-primary/30"
                >
                  <p className="text-sm font-semibold text-foreground mb-1">{label}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Capabilities ────────────────────────────────────── */}
      <section className="border-t border-border bg-card/30">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
              <p className="text-xs font-mono text-primary uppercase tracking-[0.2em] mb-3">{t('about.cap.label')}</p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">{t('about.cap.title')}</h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                { icon: Palette, title: t('about.cap.1.title'), desc: t('about.cap.1.desc') },
                { icon: Volume2, title: t('about.cap.2.title'), desc: t('about.cap.2.desc') },
                { icon: Monitor, title: t('about.cap.3.title'), desc: t('about.cap.3.desc') },
                { icon: Globe, title: t('about.cap.4.title'), desc: t('about.cap.4.desc') },
              ].map(({ icon: Icon, title, desc }, i) => (
                <motion.div
                  key={title}
                  variants={fadeUp}
                  custom={i + 1}
                  className="flex gap-4 rounded-xl border border-border bg-card p-6"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── CTA Footer ──────────────────────────────────────── */}
      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t('about.cta.title')}</h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">{t('about.cta.desc')}</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 glow-primary"
            >
              <Zap className="h-4 w-4" />
              {t('about.cta.btn')}
            </Link>
          </motion.div>

          <div className="mt-16 pt-8 border-t border-border">
            <p className="text-xs font-mono text-muted-foreground/50">{t('app.version')}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
