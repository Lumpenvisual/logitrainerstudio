import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Sparkles, FileText, Clapperboard, Clock, BarChart3, Bot, Settings2, Zap } from 'lucide-react';

interface TourStep {
  target: string; // CSS selector or description
  title: string;
  description: string;
  icon: typeof Sparkles;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  highlight?: { top: string; left: string; width: string; height: string };
}

const TOUR_STEPS: TourStep[] = [
  {
    target: 'sidebar',
    title: 'Navigation',
    description: 'Switch between Architect, Studio, Timeline, and Dashboard views. Each view handles a different phase of your video production pipeline.',
    icon: Zap,
    position: 'right',
    highlight: { top: '0', left: '0', width: '60px', height: '100%' },
  },
  {
    target: 'architect',
    title: 'Architect — Script Generation',
    description: 'Start here. Write a brief describing your video and AI will generate a multi-scene script with visual prompts and voiceover text.',
    icon: FileText,
    position: 'center',
  },
  {
    target: 'studio',
    title: 'Studio — Asset Generation',
    description: 'Generate images, audio, and video for each scene using AI. Click any generated image to open the Image Lab for refinement.',
    icon: Clapperboard,
    position: 'center',
  },
  {
    target: 'timeline',
    title: 'Timeline — Multi-Track Editor',
    description: 'Drag, resize, and arrange clips on video and audio tracks. Right-click for context menu. Use D to duplicate, Delete to remove clips.',
    icon: Clock,
    position: 'center',
  },
  {
    target: 'topbar',
    title: 'Toolbar',
    description: 'Save to cloud, export/import JSON, switch themes, change language, and manage API preferences. Your project auto-saves every 60 seconds.',
    icon: Settings2,
    position: 'bottom',
    highlight: { top: '0', left: '60px', width: 'calc(100% - 60px)', height: '44px' },
  },
  {
    target: 'assistant',
    title: 'Neural Assistant',
    description: 'Chat with an AI copilot that understands your project context. Ask for creative suggestions, troubleshoot issues, or get help with prompts.',
    icon: Bot,
    position: 'left',
  },
  {
    target: 'dashboard',
    title: 'Dashboard — Observability',
    description: 'Monitor API call performance, latency, success rates, and costs in real-time. Set up smart alerts for anomalies.',
    icon: BarChart3,
    position: 'center',
  },
];

const STORAGE_KEY = 'lt-onboarding-complete';

export function OnboardingTour({ onComplete }: { onComplete?: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      // Delay to let the app render first
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleComplete();
    }
  }, [currentStep]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }, [currentStep]);

  const handleComplete = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsVisible(false);
    onComplete?.();
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsVisible(false);
    onComplete?.();
  }, [onComplete]);

  if (!isVisible) return null;

  const step = TOUR_STEPS[currentStep];
  const Icon = step.icon;
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/60 backdrop-blur-sm"
            onClick={handleSkip}
          />

          {/* Highlight area */}
          {step.highlight && (
            <motion.div
              key={`highlight-${currentStep}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed z-[101] border-2 border-primary/50 rounded-lg pointer-events-none"
              style={{
                top: step.highlight.top,
                left: step.highlight.left,
                width: step.highlight.width,
                height: step.highlight.height,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.4), 0 0 30px hsl(250 95% 64% / 0.3)',
              }}
            />
          )}

          {/* Tooltip card */}
          <motion.div
            key={`step-${currentStep}`}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed z-[102] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10 overflow-hidden">
              {/* Progress bar */}
              <div className="h-1 bg-border">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-primary-glow"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 border border-primary/20">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-primary/70 uppercase tracking-wider">
                        Step {currentStep + 1} of {TOUR_STEPS.length}
                      </p>
                      <h3 className="text-sm font-bold text-foreground font-display">{step.title}</h3>
                    </div>
                  </div>
                  <button
                    onClick={handleSkip}
                    className="rounded-md p-1 text-muted-foreground/40 hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed mb-6">{step.description}</p>

                <div className="flex items-center justify-between">
                  <button
                    onClick={handleSkip}
                    className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors font-mono"
                  >
                    Skip tour
                  </button>
                  <div className="flex items-center gap-2">
                    {currentStep > 0 && (
                      <button
                        onClick={handlePrev}
                        className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors"
                      >
                        <ArrowLeft className="h-3 w-3" />
                        Back
                      </button>
                    )}
                    <button
                      onClick={handleNext}
                      className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:brightness-110 transition-all glow-primary font-display"
                    >
                      {currentStep === TOUR_STEPS.length - 1 ? (
                        <>
                          <Sparkles className="h-3 w-3" />
                          Get Started
                        </>
                      ) : (
                        <>
                          Next
                          <ArrowRight className="h-3 w-3" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Step dots */}
              <div className="flex items-center justify-center gap-1.5 pb-4">
                {TOUR_STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === currentStep
                        ? 'w-4 bg-primary'
                        : i < currentStep
                        ? 'w-1.5 bg-primary/40'
                        : 'w-1.5 bg-border'
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** Reset onboarding so it shows again */
export function resetOnboarding() {
  localStorage.removeItem(STORAGE_KEY);
}
