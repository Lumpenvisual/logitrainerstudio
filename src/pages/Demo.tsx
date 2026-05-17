import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  Play,
  Sparkles,
  Layers,
  Clock,
  Mic,
  Image,
  Bot,
  Megaphone,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface DemoManifest {
  title: string;
  generatedAt: string;
  videoFile: string;
  scenes: {
    sceneNumber: number;
    sceneType: string;
    voiceOverScript: string;
    visualPrompt: string;
    durationSec: number;
    image: string;
    audio: string;
  }[];
}

const FEATURES = [
  { icon: Sparkles, title: "Arquitecto de guion", desc: "Brief → escenas con prompts visuales y voz en off (Gemini)." },
  { icon: Image, title: "Asset Studio", desc: "Imágenes cinematográficas y narración TTS por escena." },
  { icon: Clock, title: "Timeline", desc: "Montaje con pistas de video y audio." },
  { icon: Bot, title: "Copilot IA", desc: "Chat contextual sobre tu producción." },
  { icon: Megaphone, title: "Marketing", desc: "Copys y secuencias generadas con IA." },
];

const BASE = "/demo/logitrainer";

export default function DemoPage() {
  const [manifest, setManifest] = useState<DemoManifest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeScene, setActiveScene] = useState(0);

  useEffect(() => {
    fetch(`${BASE}/manifest.json`)
      .then((r) => {
        if (!r.ok) throw new Error("Demo no generado aún. Ejecuta: npm run demo:generate");
        return r.json();
      })
      .then(setManifest)
      .catch((e) => setError(e.message));
  }, []);

  const videoSrc = manifest ? `${BASE}/${manifest.videoFile}` : null;
  const scene = manifest?.scenes[activeScene];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background text-foreground"
    >
      <header className="border-b border-border/60 bg-card/30 backdrop-blur-md sticky top-0 z-20">
        <motion.div layout className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Studio
          </Link>
          <motion.div layout className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <span className="font-display font-bold text-sm">Demo LogiTrainer</span>
          </motion.div>
          <a
            href="https://logitrainerstudio.vercel.app"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
          >
            Producción <ExternalLink className="h-3 w-3" />
          </a>
        </motion.div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-10">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-gradient-primary mb-3">
            LogiTrainer Studio
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
            Demo generada con el pipeline real: guion, imágenes Gemini, voz TTS y montaje automático.
          </p>
          {manifest && (
            <p className="text-[10px] font-mono text-muted-foreground/50 mt-2">
              Generado: {new Date(manifest.generatedAt).toLocaleString("es")}
            </p>
          )}
        </motion.div>

        {error && (
          <div className="rounded-xl border border-warning/30 bg-warning/5 p-6 text-center max-w-lg mx-auto">
            <p className="text-sm text-warning mb-2">{error}</p>
            <code className="text-xs bg-background/50 px-2 py-1 rounded">npm run demo:generate</code>
          </div>
        )}

        {!error && !manifest && (
          <motion.div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </motion.div>
        )}

        {manifest && videoSrc && (
          <>
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="rounded-2xl border border-border/50 bg-card/40 overflow-hidden shadow-premium-lg mb-10"
            >
              <div className="aspect-video bg-black">
                <video
                  controls
                  className="w-full h-full"
                  src={videoSrc}
                  poster={scene ? `${BASE}/${scene.image}` : undefined}
                >
                  Tu navegador no soporta video HTML5.
                </video>
              </div>
              <div className="p-4 flex flex-wrap gap-2 justify-center border-t border-border/40">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:brightness-110"
                >
                  <Play className="h-4 w-4" />
                  Abrir Studio
                </Link>
                <a
                  href={videoSrc}
                  download
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-secondary/40"
                >
                  Descargar MP4
                </a>
              </div>
            </motion.div>

            <section className="mb-12">
              <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Escenas del demo
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {manifest.scenes.map((s, i) => (
                  <button
                    key={s.sceneNumber}
                    type="button"
                    onClick={() => setActiveScene(i)}
                    className={`text-left rounded-xl border p-4 transition-all ${
                      activeScene === i
                        ? "border-primary/40 bg-primary/5"
                        : "border-border/40 bg-card/30 hover:border-primary/20"
                    }`}
                  >
                    <div className="flex gap-3">
                      <img
                        src={`${BASE}/${s.image}`}
                        alt=""
                        className="w-28 h-16 object-cover rounded-lg shrink-0"
                      />
                      <motion.div layout className="min-w-0 flex-1">
                        <p className="text-[10px] font-mono text-primary uppercase">{s.sceneType}</p>
                        <p className="text-xs text-foreground/80 line-clamp-2 mt-1 italic">"{s.voiceOverScript}"</p>
                        <audio controls className="mt-2 h-7 w-full" src={`${BASE}/${s.audio}`} preload="none" />
                      </motion.div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}

        <section>
          <h2 className="font-display text-lg font-bold mb-6 text-center">Funciones destacadas</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <motion.div
                key={title}
                className="rounded-xl border border-border/40 bg-card/20 p-5 backdrop-blur-sm"
              >
                <Icon className="h-6 w-6 text-primary mb-3" />
                <h3 className="font-display font-semibold text-sm mb-1">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </motion.div>
  );
}
