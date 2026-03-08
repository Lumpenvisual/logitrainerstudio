import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Mail, Lock, User, ArrowRight, Loader2, Sparkles, Film, Clock, Cpu, Zap, Play } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/sonner';

type AuthMode = 'login' | 'signup' | 'forgot';

const features = [
  { icon: Sparkles, label: 'AI Script Generation', desc: 'Multi-scene scripts from a single brief' },
  { icon: Film, label: 'Asset Orchestration', desc: 'Image, audio & video in one flow' },
  { icon: Clock, label: 'Timeline Editor', desc: 'Professional multi-track editing' },
  { icon: Cpu, label: 'Neural Assistant', desc: 'AI copilot for creative direction' },
];

const stats = [
  { value: '11+', label: 'AI Models' },
  { value: '2', label: 'Providers' },
  { value: '3', label: 'Languages' },
];

export default function Auth() {
  const { user, loading, signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

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
        toast.success('Account created! You can now sign in.');
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

  const titles = {
    login: 'Welcome back',
    signup: 'Start creating',
    forgot: 'Reset password',
  };

  const subtitles = {
    login: 'Sign in to your production workspace',
    signup: 'Create your AI video production account',
    forgot: "We'll send you a reset link",
  };

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-background">
      {/* Left side — Product showcase */}
      <div className="hidden lg:flex lg:w-[55%] flex-col justify-between p-12 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-primary-glow/5" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-primary-glow/5 blur-[100px]" />
        
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary) / 0.4) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.4) 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
          }}
        />

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 border border-primary/20">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <span className="font-display text-lg font-bold text-foreground tracking-tight">LogiTrainer</span>
            <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] font-mono font-bold text-primary tracking-wider">
              AI STUDIO
            </span>
          </div>

          {/* Hero text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-display text-5xl font-bold leading-[1.1] tracking-tight mb-5">
              <span className="text-foreground">From brief to</span><br />
              <span className="text-gradient-primary">final cut</span>
              <span className="text-foreground">,</span><br />
              <span className="text-foreground">powered by AI</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-lg mb-10">
              The all-in-one video production IDE that transforms creative briefs into production-ready content using state-of-the-art AI models.
            </p>
          </motion.div>

          {/* Feature grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 gap-3 max-w-lg"
          >
            {features.map(({ icon: Icon, label, desc }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="group flex items-start gap-3 rounded-xl border border-border/50 bg-card/30 p-3.5 backdrop-blur-sm transition-all hover:border-primary/20 hover:bg-card/50"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground font-display">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Bottom stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="relative z-10 flex items-center gap-8"
        >
          {stats.map(({ value, label }) => (
            <div key={label}>
              <p className="font-display text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground/50">
            <Play className="h-3 w-3" />
            <span className="font-mono">v2.0.0 • Neural Engine</span>
          </div>
        </motion.div>
      </div>

      {/* Right side — Auth form */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          {/* Mobile-only logo */}
          <div className="lg:hidden mb-10 flex flex-col items-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 border border-primary/20">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">LogiTrainer AI Studio</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-8">
                <h2 className="font-display text-2xl font-bold text-foreground tracking-tight">{titles[mode]}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{subtitles[mode]}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground/50" />
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your display name"
                        className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground/50" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>

                {mode !== 'forgot' && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground/50" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        minLength={6}
                        className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50 glow-primary mt-6"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 space-y-3 text-center text-sm">
                {mode === 'login' && (
                  <>
                    <button onClick={() => setMode('forgot')} className="text-muted-foreground hover:text-primary transition-colors text-xs">
                      Forgot your password?
                    </button>
                    <p className="text-muted-foreground">
                      Don't have an account?{' '}
                      <button onClick={() => setMode('signup')} className="text-primary hover:underline font-semibold">
                        Sign up free
                      </button>
                    </p>
                  </>
                )}
                {mode === 'signup' && (
                  <p className="text-muted-foreground">
                    Already have an account?{' '}
                    <button onClick={() => setMode('login')} className="text-primary hover:underline font-semibold">
                      Sign in
                    </button>
                  </p>
                )}
                {mode === 'forgot' && (
                  <button onClick={() => setMode('login')} className="text-primary hover:underline font-semibold">
                    Back to sign in
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}