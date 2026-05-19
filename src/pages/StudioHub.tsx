import { useState, useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  Activity,
  ExternalLink,
  Globe,
  FolderGit2,
  Lock,
  LogOut,
  MonitorPlay,
  KeyRound,
  AlertCircle,
  Server,
  Cloud,
} from "lucide-react";
import {
  clearStudioHubSession,
  fetchTunnelProjectInfo,
  getHubLinks,
  getStudioHubSession,
  type TunnelProjectInfo,
} from "@/lib/studioHub";
import { useStudioAuth, useRequireStudioAuth } from "@/hooks/useStudioAuth";

function StudioShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(hsl(var(--primary) / 0.5) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function StudioHubLogin() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const { authenticated, error, setError, login } = useStudioAuth();
  const links = getHubLinks();

  useEffect(() => {
    if (authenticated || getStudioHubSession()) {
      navigate("/studio/dashboard", { replace: true });
    }
  }, [authenticated, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(password)) {
      navigate("/studio/dashboard", { replace: true });
    }
  };

  return (
    <StudioShell>
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card/80 p-8 shadow-xl backdrop-blur-xl">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/25 bg-primary/15">
            <Activity className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-center font-display text-2xl font-bold">
            <span className="text-gradient-primary">LogiTrainer</span> Studio
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Acceso unificado — una sola contraseña para toda la plataforma.
          </p>
          {links.isTunnel && (
            <p className="mt-2 text-center text-[10px] font-mono text-primary/80">
              Túnel Cloudflare · {links.tunnelPublicUrl}
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label
                htmlFor="studio-password"
                className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                Contraseña de acceso
              </label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                <input
                  id="studio-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="••••••••••••"
                  className="w-full rounded-lg border border-border/60 bg-background/80 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {error && (
              <p className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!password.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
            >
              <Lock className="h-4 w-4" />
              Acceder al Studio
            </button>
          </form>
        </div>
      </div>
    </StudioShell>
  );
}

function HubLinkCard({
  title,
  description,
  href,
  icon: Icon,
  external,
  disabled,
  warning,
}: {
  title: string;
  description: string;
  href: string;
  icon: typeof Globe;
  external?: boolean;
  disabled?: boolean;
  warning?: string;
}) {
  const inner = (
    <div
      className={`flex h-full flex-col rounded-xl border p-5 transition-all ${
        disabled
          ? "cursor-not-allowed border-border/30 bg-card/20 opacity-60"
          : "border-border/50 bg-card/40 hover:border-primary/30 hover:bg-card/60 hover:shadow-premium"
      }`}
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="font-display font-semibold text-sm">{title}</h3>
      <p className="mt-1 flex-1 text-xs text-muted-foreground leading-relaxed">{description}</p>
      {warning && <p className="mt-2 text-[10px] font-mono text-warning/90">{warning}</p>}
      {!disabled && (
        <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-primary">
          Abrir {external && <ExternalLink className="h-3 w-3" />}
        </span>
      )}
    </div>
  );

  if (disabled) return inner;
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer">
        {inner}
      </a>
    );
  }
  return <Link to={href}>{inner}</Link>;
}

function ProjectInfoPanel({ info }: { info: TunnelProjectInfo | null }) {
  if (!info) {
    return (
      <div className="rounded-xl border border-border/40 bg-card/30 p-5 text-xs text-muted-foreground">
        <p className="flex items-center gap-2 font-medium text-foreground">
          <FolderGit2 className="h-4 w-4 text-primary" />
          Info del proyecto
        </p>
        <p className="mt-2">Ejecuta <code className="font-mono text-primary/90">npm start</code> para generar tunnel-info.json.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card/40 p-5 sm:col-span-2">
      <p className="flex items-center gap-2 font-display text-sm font-semibold">
        <FolderGit2 className="h-4 w-4 text-primary" />
        Info del proyecto
      </p>
      <dl className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Carpeta</dt>
          <dd className="font-mono break-all text-foreground/90">{info.projectPath}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Git</dt>
          <dd className="font-mono">
            {info.gitBranch ?? "—"} @ {info.gitCommit ?? "—"}
            {info.gitClean ? " · limpio" : " · cambios pendientes"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Versión</dt>
          <dd>{info.version}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Túnel</dt>
          <dd className="font-mono text-primary">{info.tunnelUrl}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">Actualizado</dt>
          <dd className="font-mono text-muted-foreground">{info.updatedAt}</dd>
        </div>
      </dl>
    </div>
  );
}

export function StudioHubDashboard() {
  const navigate = useNavigate();
  const links = getHubLinks();
  const authenticated = useRequireStudioAuth();
  const [projectInfo, setProjectInfo] = useState<TunnelProjectInfo | null>(null);

  useEffect(() => {
    fetchTunnelProjectInfo().then(setProjectInfo);
  }, []);

  if (!authenticated) return null;

  const handleLogout = () => {
    clearStudioHubSession();
    navigate("/studio/login", { replace: true });
  };

  const appDisabled = links.isVercelProduction;
  const appWarning = appDisabled
    ? `Usa el túnel: ${links.tunnelPublicUrl}`
    : undefined;

  return (
    <StudioShell>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/25 bg-primary/15">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold">LogiTrainer Studio</h1>
              <p className="text-xs text-muted-foreground">
                {links.isTunnel ? "Panel · túnel Cloudflare" : "Panel de acceso unificado"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/30 px-4 py-2 text-xs font-medium transition hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-3.5 w-3.5" />
            Cerrar sesión
          </button>
        </header>

        <p className="mb-8 text-sm text-muted-foreground">Sesión activa. Elige dónde continuar:</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <HubLinkCard
            title="App principal"
            description="Studio local vía túnel o localhost — guion, timeline, APIs Gemini."
            href={links.appPrincipal}
            icon={Server}
            disabled={appDisabled}
            warning={appWarning}
          />
          <HubLinkCard
            title="Demo promocional"
            description="Video IA: guion, imágenes y voz LogiTrainer."
            href={links.demo}
            icon={MonitorPlay}
          />
          <HubLinkCard
            title="Producción (Vercel)"
            description="Despliegue público en Vercel — misma app, sin túnel."
            href={links.production}
            icon={Globe}
            external
          />
          {links.isTunnel && (
            <HubLinkCard
              title="Túnel Cloudflare"
              description="URL pública de este entorno (compartir con el equipo)."
              href={links.tunnelPublicUrl + "/studio"}
              icon={Cloud}
              external
            />
          )}
          <ProjectInfoPanel info={projectInfo} />
        </div>

        <p className="mt-10 text-center text-[10px] font-mono text-muted-foreground/50">
          Back-office Supabase: inicia sesión en /auth tras abrir la app principal.
        </p>
      </div>
    </StudioShell>
  );
}

export default function StudioHubIndex() {
  if (getStudioHubSession()) {
    return <Navigate to="/studio/dashboard" replace />;
  }
  return <Navigate to="/studio/login" replace />;
}
