import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Mail, Lock, User, ArrowRight, Loader2, Sparkles, Film, Clock, Cpu, Play, Eye, EyeOff, Star, Users, Zap, Gift, Shield, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { lovable } from '@/integrations/lovable/index';
import { toast } from '@/components/ui/sonner';

type AuthMode = 'login' | 'signup' | 'forgot';

const features = [
  { icon: Sparkles, label: 'AI Script Generation', desc: 'Multi-scene scripts from a single brief' },
  { icon: Film, label: 'Asset Orchestration', desc: 'Image, audio & video in one flow' },
  { icon: Clock, label: 'Timeline Editor', desc: 'Professional multi-track editing' },
  { icon: Cpu, label: 'Neural Assistant', desc: 'AI copilot for creative direction' },
];

const testimonials = [
  { name: 'Maria G.', role: 'Content Creator', text: 'Reduced my video production time by 80%. The AI scripting is game-changing.', rating: 5 },
  { name: 'Carlos R.', role: 'Marketing Director', text: 'We produce 10x more video content now. ROI through the roof.', rating: 5 },
  { name: 'Ana P.', role: 'Agency Owner', text: 'Best AI video tool I\'ve used. The multi-track timeline is professional grade.', rating: 5 },
];

const socialProof = [
  { icon: Users, value: '2,500+', label: 'Creators' },
  { icon: Film, value: '15K+', label: 'Videos Made' },
  { icon: Star, value: '4.9', label: 'Rating' },
  { icon: Zap, value: '11+', label: 'AI Models' },
];

const trustBadges = [
  { icon: Shield, label: 'Enterprise Security' },
  { icon: Zap, label: 'AI Powered' },
  { icon: Gift, label: 'Referral Rewards' },
];

export default function Auth() {
  const location = useLocation();
  const authState = location.state as { from?: string; initialView?: "suite" } | null;
  const redirectTo = authState?.from === "/classic" ? "/" : authState?.from || "/";
  const redirectState = authState?.initialView === "suite" ? { initialView: "suite" as const } : undefined;
  const { user, loading, signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div className="absolute inset-0 rounded-xl bg-primary/20 animate-ping" />
          </div>
          <p className="text-xs text-muted-foreground font-mono">Loading workspace...</p>
        </motion.div>
      </div>
    );
  }

  if (user) return <Navigate to={redirectTo} replace state={redirectState} />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) throw error;
        toast.success('Password reset email sent. Check your inbox.');
        setMode('login');
      } else if (mode === 'signup') {
        const { error } = await signUp(email, password, displayName);
        if (error) throw error;
        // Store referral code in localStorage for post-approval processing
        if (referralCode.trim()) {
          localStorage.setItem('pending_referral_code', referralCode.trim().toUpperCase());
        }
        toast.success('Account created! Pending admin approval.');
        setMode('login');
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const titles = { login: 'Welcome back', signup: 'Start creating', forgot: 'Reset password' };
  const subtitles = { login: 'Sign in to your production workspace', signup: 'Join thousands of AI creators', forgot: "We'll send you a reset link" };

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-background">
      {/* Left side — Product showcase */}
      <div className="hidden lg:flex lg:w-[55%] flex-col justify-between p-12 relative overflow-hidden">
        {/* Animated orbs */}
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/[0.07] blur-[120px] animate-orb" />
        <div className="absolute bottom-[-15%] left-[-8%] w-[450px] h-[450px] rounded-full bg-primary-glow/[0.06] blur-[100px] animate-orb-delayed" />
        <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full bg-accent/[0.04] blur-[80px] animate-subtle-pulse" />

        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(hsl(var(--primary) / 0.5) 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative z-10">
          {/* Logo */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-center gap-3 mb-16">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 border border-primary/20 shadow-premium">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <span className="font-display text-lg font-bold text-foreground tracking-tight">LogiTrainer</span>
            <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] font-mono font-bold text-primary tracking-wider">
              AI STUDIO
            </span>
          </motion.div>

          {/* Hero text */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}>
            <h1 className="font-display text-5xl xl:text-6xl font-bold leading-[1.05] tracking-tight mb-6">
              <span className="text-foreground">From brief to</span><br />
              <span className="text-gradient-primary">final cut</span>
              <span className="text-foreground">,</span><br />
              <span className="text-foreground">powered by AI</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-lg mb-8">
              The all-in-one video production IDE that transforms creative briefs into production-ready content.
            </p>
          </motion.div>

          {/* Social Proof Stats */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="grid grid-cols-4 gap-3 max-w-lg mb-8">
            {socialProof.map(({ icon: Icon, value, label }, i) => (
              <motion.div key={label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.05 }}
                className="text-center rounded-xl border border-border/30 bg-card/20 p-3 backdrop-blur-sm"
              >
                <Icon className="h-4 w-4 text-primary mx-auto mb-1.5" />
                <p className="font-display text-lg font-bold text-foreground">{value}</p>
                <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">{label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Feature grid */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }} className="grid grid-cols-2 gap-2.5 max-w-lg">
            {features.map(({ icon: Icon, label, desc }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.06 }}
                className="group flex items-start gap-3 rounded-xl border border-border/40 bg-card/20 p-3 backdrop-blur-sm transition-all duration-300 hover:border-primary/25 hover:bg-card/40 hover:shadow-premium"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary/15 group-hover:scale-105">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground font-display">{label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Bottom — Testimonial carousel + trust badges */}
        <div className="relative z-10 space-y-4">
          {/* Testimonial */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            className="rounded-xl border border-border/30 bg-card/20 p-4 backdrop-blur-sm max-w-lg"
          >
            <AnimatePresence mode="wait">
              <motion.div key={activeTestimonial} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.3 }}>
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-sm text-foreground/80 italic mb-2">"{testimonials[activeTestimonial].text}"</p>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground">
                    <span className="font-semibold text-foreground/70">{testimonials[activeTestimonial].name}</span> · {testimonials[activeTestimonial].role}
                  </p>
                  <div className="flex gap-1">
                    {testimonials.map((_, i) => (
                      <button key={i} onClick={() => setActiveTestimonial(i)}
                        className={`h-1.5 rounded-full transition-all ${i === activeTestimonial ? 'w-4 bg-primary' : 'w-1.5 bg-border hover:bg-muted-foreground/30'}`}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Trust badges */}
          <div className="flex items-center gap-4">
            {trustBadges.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50">
                <Icon className="h-3 w-3" />
                <span>{label}</span>
              </div>
            ))}
            <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground/40">
              <Play className="h-3 w-3" />
              <span className="font-mono">v2.0 · Neural Engine</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side — Auth form */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12 relative">
        <div className="absolute inset-0 bg-gradient-surface opacity-50" />
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }} className="w-full max-w-sm relative z-10">
          {/* Mobile-only logo */}
          <div className="lg:hidden mb-8 flex flex-col items-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 border border-primary/20 glow-primary">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">LogiTrainer AI Studio</span>
            {/* Mobile social proof */}
            <div className="flex items-center gap-4 mt-3">
              {socialProof.slice(0, 3).map(({ value, label }) => (
                <div key={label} className="text-center">
                  <p className="text-sm font-bold text-foreground">{value}</p>
                  <p className="text-[8px] text-muted-foreground/50 uppercase">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={mode} initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} transition={{ duration: 0.25 }}>
              <div className="mb-6">
                <h2 className="font-display text-2xl font-bold text-foreground tracking-tight">{titles[mode]}</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">{subtitles[mode]}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {mode === 'signup' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-muted-foreground/80 uppercase tracking-wider">Name</label>
                    <div className="relative group">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 transition-colors group-focus-within:text-primary/60" />
                      <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your display name"
                        className="w-full rounded-xl border border-border/60 bg-card/50 pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all duration-200"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-muted-foreground/80 uppercase tracking-wider">Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 transition-colors group-focus-within:text-primary/60" />
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                      className="w-full rounded-xl border border-border/60 bg-card/50 pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all duration-200"
                    />
                  </div>
                </div>

                {mode !== 'forgot' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-muted-foreground/80 uppercase tracking-wider">Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 transition-colors group-focus-within:text-primary/60" />
                      <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" minLength={6}
                        className="w-full rounded-xl border border-border/60 bg-card/50 pl-10 pr-11 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all duration-200"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-muted-foreground transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Referral code for signup */}
                {mode === 'signup' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-muted-foreground/80 uppercase tracking-wider flex items-center gap-1.5">
                      <Gift className="h-3 w-3 text-warning" />
                      Referral Code <span className="text-muted-foreground/40 normal-case">(optional)</span>
                    </label>
                    <div className="relative group">
                      <Gift className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 transition-colors group-focus-within:text-warning/60" />
                      <input type="text" value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} placeholder="Enter code"
                        className="w-full rounded-xl border border-border/60 bg-card/50 pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 focus:border-warning/40 focus:outline-none focus:ring-2 focus:ring-warning/15 transition-all duration-200 font-mono tracking-wider"
                      />
                    </div>
                  </div>
                )}

                {mode === 'login' && (
                  <div className="flex justify-end">
                    <button type="button" onClick={() => setMode('forgot')} className="text-xs text-muted-foreground/60 hover:text-primary transition-colors">
                      Forgot password?
                    </button>
                  </div>
                )}

                <button type="submit" disabled={submitting}
                  className="relative flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:brightness-110 disabled:opacity-50 glow-primary mt-1 overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>

              {/* Google sign-in */}
              {mode !== 'forgot' && (
                <div className="mt-4">
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50" /></div>
                    <div className="relative flex justify-center text-xs"><span className="bg-background px-3 text-muted-foreground/50 font-mono text-[10px]">OR</span></div>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const result = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin });
                        if (result.error) throw result.error;
                      } catch (err: any) {
                        toast.error(err.message || 'Google sign-in failed');
                      }
                    }}
                    className="flex w-full items-center justify-center gap-3 rounded-xl border border-border/50 bg-card/30 px-4 py-2.5 text-sm font-medium text-foreground transition-all duration-200 hover:bg-card/60 hover:border-border hover:shadow-premium"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </button>
                </div>
              )}

              {/* Signup benefits */}
              {mode === 'signup' && (
                <div className="mt-4 space-y-2">
                  {[
                    { icon: CheckCircle, text: 'Free tier with full AI access' },
                    { icon: Gift, text: 'Earn rewards by inviting friends' },
                    { icon: Shield, text: 'Enterprise-grade security' },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2 text-[11px] text-muted-foreground/60">
                      <Icon className="h-3 w-3 text-success/60" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 text-center text-sm">
                {mode === 'login' && (
                  <p className="text-muted-foreground/70">
                    Don't have an account?{' '}
                    <button onClick={() => setMode('signup')} className="text-primary hover:underline font-semibold">Sign up free</button>
                  </p>
                )}
                {mode === 'signup' && (
                  <p className="text-muted-foreground/70">
                    Already have an account?{' '}
                    <button onClick={() => setMode('login')} className="text-primary hover:underline font-semibold">Sign in</button>
                  </p>
                )}
                {mode === 'forgot' && (
                  <button onClick={() => setMode('login')} className="text-primary hover:underline font-semibold">Back to sign in</button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
