import { useState } from "react";
import { Activity, AlertCircle, Loader2, Lock, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { UNIFIED_EMAIL } from "@/lib/unifiedCredentials";
import { useUnifiedLogin } from "@/hooks/useUnifiedLogin";

type UnifiedLoginScreenProps = {
  subtitle?: string;
  tunnelHint?: string;
  onSuccess: () => void;
};

export function UnifiedLoginScreen({ subtitle, tunnelHint, onSuccess }: UnifiedLoginScreenProps) {
  const [email, setEmail] = useState(UNIFIED_EMAIL);
  const [password, setPassword] = useState("");
  const { login, error, setError, submitting } = useUnifiedLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await login(email, password);
    if (ok) onSuccess();
  };

  return (
    <div className="lts-auth-shell flex min-h-[100dvh] min-h-screen w-full items-center justify-center px-4 py-6 sm:px-6 sm:py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="lts-auth-card w-full max-w-md rounded-2xl border border-border/60 bg-card/90 p-6 shadow-xl backdrop-blur-xl sm:p-8"
      >
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/25 bg-primary/15 sm:mb-6 sm:h-14 sm:w-14">
          <Activity className="h-6 w-6 text-primary sm:h-7 sm:w-7" />
        </div>

        <h1 className="text-center font-display text-xl font-bold sm:text-2xl">
          <span className="text-gradient-primary">LogiTrainer</span> Studio
        </h1>
        <p className="mt-2 text-center text-xs text-muted-foreground sm:text-sm">
          {subtitle ?? "Un solo correo y una contraseña para todo el estudio."}
        </p>
        {tunnelHint && (
          <p className="mt-2 break-all text-center text-[10px] font-mono text-primary/80">{tunnelHint}</p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 sm:mt-8">
          <div>
            <label
              htmlFor="unified-email"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Correo
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
              <input
                id="unified-email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                className="w-full rounded-lg border border-border/60 bg-background/80 py-3 pl-11 pr-4 text-base text-foreground outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/30 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="unified-password"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Contraseña
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
              <input
                id="unified-password"
                type="password"
                autoComplete="current-password"
                required
                minLength={4}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="••••••••••••"
                className="w-full rounded-lg border border-border/60 bg-background/80 py-3 pl-11 pr-4 text-base text-foreground outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/30 sm:text-sm"
              />
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !password.trim() || !email.trim()}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Acceder al Studio
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
