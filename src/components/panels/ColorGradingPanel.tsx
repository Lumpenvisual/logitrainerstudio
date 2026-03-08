import { motion } from 'framer-motion';
import { Palette, SunDim, Contrast, Droplets, Thermometer, X, RotateCcw } from 'lucide-react';
import { useState, useCallback } from 'react';

interface ColorGradingSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  temperature: number;
  tint: number;
  exposure: number;
  highlights: number;
  shadows: number;
  vibrance: number;
}

const DEFAULT_SETTINGS: ColorGradingSettings = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  temperature: 0,
  tint: 0,
  exposure: 0,
  highlights: 0,
  shadows: 0,
  vibrance: 0,
};

const PRESETS = [
  { name: 'Cinematic', settings: { brightness: -5, contrast: 15, saturation: -10, temperature: -8, tint: 0, exposure: -3, highlights: -10, shadows: 5, vibrance: 10 } },
  { name: 'Warm Film', settings: { brightness: 5, contrast: 8, saturation: -5, temperature: 15, tint: 5, exposure: 3, highlights: -5, shadows: 8, vibrance: 5 } },
  { name: 'Cool Tone', settings: { brightness: 0, contrast: 10, saturation: -8, temperature: -15, tint: -3, exposure: 0, highlights: -8, shadows: 3, vibrance: 8 } },
  { name: 'High Key', settings: { brightness: 15, contrast: -5, saturation: -3, temperature: 3, tint: 0, exposure: 10, highlights: 15, shadows: 10, vibrance: -5 } },
  { name: 'Low Key', settings: { brightness: -15, contrast: 20, saturation: 5, temperature: -5, tint: 0, exposure: -10, highlights: -15, shadows: -10, vibrance: 12 } },
  { name: 'Vintage', settings: { brightness: 3, contrast: -5, saturation: -20, temperature: 10, tint: 8, exposure: 5, highlights: -8, shadows: 12, vibrance: -15 } },
];

function Slider({ label, value, onChange, min = -100, max = 100, icon: Icon }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; icon: typeof SunDim;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3 w-3 text-muted-foreground/50" />
          <span className="text-[10px] text-muted-foreground/70">{label}</span>
        </div>
        <span className={`text-[10px] font-mono tabular-nums ${value !== 0 ? 'text-primary' : 'text-muted-foreground/40'}`}>
          {value > 0 ? '+' : ''}{value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 cursor-pointer appearance-none rounded-full bg-border accent-primary"
      />
    </div>
  );
}

export function ColorGradingPanel({ onClose }: { onClose: () => void }) {
  const [settings, setSettings] = useState<ColorGradingSettings>(DEFAULT_SETTINGS);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const updateSetting = useCallback((key: keyof ColorGradingSettings, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setActivePreset(null);
  }, []);

  const applyPreset = (name: string, presetSettings: ColorGradingSettings) => {
    setSettings(presetSettings);
    setActivePreset(name);
  };

  const resetAll = () => {
    setSettings(DEFAULT_SETTINGS);
    setActivePreset(null);
  };

  // Generate CSS filter string for preview
  const cssFilter = `brightness(${1 + settings.brightness / 100}) contrast(${1 + settings.contrast / 100}) saturate(${1 + settings.saturation / 100})`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[85vh] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
              <Palette className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-sm font-bold text-foreground">Color Grading</h2>
              <p className="text-[10px] text-muted-foreground">Professional color correction</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={resetAll} className="rounded-lg p-2 text-muted-foreground hover:bg-muted/50 transition-colors" title="Reset all">
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted/50 transition-colors text-lg">✕</button>
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 border-b border-border">
          <div className="relative h-32 rounded-lg bg-secondary/20 overflow-hidden" style={{ filter: cssFilter }}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-warning/10 to-success/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-mono text-foreground/50">Preview</span>
            </div>
          </div>
        </div>

        {/* Presets */}
        <div className="p-4 border-b border-border">
          <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider mb-2">Presets</p>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map(({ name, settings: presetSettings }) => (
              <button
                key={name}
                onClick={() => applyPreset(name, presetSettings)}
                className={`rounded-lg px-3 py-1.5 text-[10px] font-medium transition-all ${
                  activePreset === name
                    ? 'bg-primary/15 text-primary border border-primary/30'
                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary border border-transparent'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div className="overflow-y-auto max-h-[40vh] p-4 space-y-3">
          <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider mb-1">Adjustments</p>
          <Slider label="Brightness" value={settings.brightness} onChange={(v) => updateSetting('brightness', v)} icon={SunDim} />
          <Slider label="Contrast" value={settings.contrast} onChange={(v) => updateSetting('contrast', v)} icon={Contrast} />
          <Slider label="Saturation" value={settings.saturation} onChange={(v) => updateSetting('saturation', v)} icon={Droplets} />
          <Slider label="Temperature" value={settings.temperature} onChange={(v) => updateSetting('temperature', v)} icon={Thermometer} />
          <Slider label="Exposure" value={settings.exposure} onChange={(v) => updateSetting('exposure', v)} icon={SunDim} />
          <Slider label="Highlights" value={settings.highlights} onChange={(v) => updateSetting('highlights', v)} icon={SunDim} />
          <Slider label="Shadows" value={settings.shadows} onChange={(v) => updateSetting('shadows', v)} icon={SunDim} />
          <Slider label="Vibrance" value={settings.vibrance} onChange={(v) => updateSetting('vibrance', v)} icon={Palette} />
        </div>
      </motion.div>
    </motion.div>
  );
}
