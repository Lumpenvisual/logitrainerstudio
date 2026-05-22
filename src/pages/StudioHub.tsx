import { useState, useEffect } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  ExternalLink,
  Globe,
  LogOut,
  MonitorPlay,
  Server,
  Cloud,
  FolderGit2,
} from "lucide-react";
import {
  clearStudioHubSession,
  fetchTunnelProjectInfo,
  getHubLinks,
  getStudioHubSession,
  type TunnelProjectInfo,
} from "@/lib/studioHub";
import { useRequireStudioAuth } from "@/hooks/useStudioAuth";
import { UnifiedLoginScreen } from "@/components/auth/UnifiedLoginScreen";
import { useAuth } from "@/hooks/useAuth";
import { signOutUnified } from "@/lib/unifiedSession";

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
  const location = useLocation();
  const links = getHubLinks();
  const loginState = location.state as { from?: string; initialView?: string } | null;

  useEffect(() => {
    if (getStudioHubSession()) {
      const target = loginState?.from && loginState.from !== "/studio/login" ? loginState.from : "/studio/dashboard";
      navigate(target, { replace: true, state: loginState?.initialView ? { initialView: loginState.initialView } : undefined });
    }
  }, [navigate, loginState]);

  const handleSuccess = () => {
    const target = loginState?.from && loginState.from !== "/studio/login" ? loginState.from : "/studio/dashboard";
    navigate(target, {
      replace: true,
      state: loginState?.initialView ? { initialView: loginState.initialView } : undefined,
    });
  };

  return (
    <StudioShell>
      <UnifiedLoginScreen
        tunnelHint={links.isTunnel ? `Túnel · ${links.tunnelPublicUrl}` : undefined}
        onSuccess={handleSuccess}
      />
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

  const { signOut } = useAuth();

  const handleLogout = () => {
    void signOutUnified(signOut).then(() => navigate("/studio/login", { replace: true }));
  };

  return (
    <StudioShell>
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10">
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
            title="LogiTrainer Studio"
            description="Studio Pro unificado: guion, timeline, Production Suite (editor DnD, funnels, ebooks, export canvas), APIs Gemini."
            href={links.appPrincipal}
            icon={Server}
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
          Misma cuenta en hub, Studio Pro y Production Suite.
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
