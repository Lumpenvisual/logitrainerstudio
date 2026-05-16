import { useState } from "react";
import { motion } from "framer-motion";
import { KeyRound, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

interface SiteAccessGateProps {
  verifyPassword: (password: string) => Promise<{ error: string | null }>;
  verifying: boolean;
}

export function SiteAccessGate({ verifyPassword, verifying }: SiteAccessGateProps) {
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await verifyPassword(password.trim());
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Access granted");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-screen items-center justify-center bg-background px-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-border/60 bg-card/80 p-8 shadow-xl backdrop-blur-xl"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 border border-primary/25"
        >
          <Lock className="h-7 w-7 text-primary" />
        </motion.div>
        <h1 className="text-center font-display text-2xl font-bold text-foreground">LogiTrainer Studio</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Enter the studio access password to continue.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="site-access-password" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Access password
            </label>
            <motion.div whileFocus={{ scale: 1.01 }} className="relative">
              <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
              <input
                id="site-access-password"
                type="password"
                autoComplete="current-password"
                required
                minLength={4}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-lg border border-border/60 bg-background/80 py-3 pl-11 pr-4 text-sm text-foreground outline-none ring-primary/30 transition focus:border-primary/50 focus:ring-2"
              />
            </motion.div>
          </div>
          <motion.button
            type="submit"
            disabled={verifying || !password.trim()}
            whileTap={{ scale: 0.98 }}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
          >
            {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enter studio"}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}
