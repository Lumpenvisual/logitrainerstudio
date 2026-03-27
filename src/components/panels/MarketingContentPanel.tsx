import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Megaphone, Mail, Globe, CalendarDays, Video, Hash,
  Sparkles, Loader2, Copy, Check, ChevronRight, Zap,
  FileText, GitBranch, Repeat, BarChart3, ArrowRight,
  Target, Users, DollarSign, TrendingUp, Layers,
  Magnet, LayoutTemplate, Webhook, Trash2, Download
} from 'lucide-react';

// ─── Content Tools ─────────────────────────────────────────────
const CONTENT_TOOLS = [
  { id: 'ad-copy', label: 'Ad Copy Generator', desc: 'Facebook, Google, TikTok ads', icon: Megaphone, color: 'text-orange-400', placeholder: 'Describe your product/service and target audience...' },
  { id: 'email-sequence', label: 'Email Sequences', desc: 'Nurture & conversion flows', icon: Mail, color: 'text-blue-400', placeholder: 'Describe the product and goal of the email sequence...' },
  { id: 'landing-page', label: 'Landing Page Copy', desc: 'Headlines, CTAs, features', icon: Globe, color: 'text-green-400', placeholder: 'Describe the product/service for the landing page...' },
  { id: 'social-calendar', label: 'Social Calendar', desc: '7-day content plan', icon: CalendarDays, color: 'text-purple-400', placeholder: 'Describe your brand and target platforms...' },
  { id: 'short-script', label: 'Short-Form Scripts', desc: 'Reels, TikTok, Shorts', icon: Video, color: 'text-pink-400', placeholder: 'Describe the topic and style for the short video...' },
  { id: 'seo-keywords', label: 'SEO & Hashtags', desc: 'Keywords, hashtags, ideas', icon: Hash, color: 'text-cyan-400', placeholder: 'Describe your niche, product, or content topic...' },
  { id: 'lead-magnet', label: 'Lead Magnet Creator', desc: 'eBooks, checklists, guides', icon: Magnet, color: 'text-amber-400', placeholder: 'Describe your ideal customer and what problem you solve...' },
  { id: 'landing-template', label: 'Landing Page Builder', desc: 'Full page structure', icon: LayoutTemplate, color: 'text-emerald-400', placeholder: 'Describe the product/service for a complete landing page...' },
  { id: 'webhook-trigger', label: 'Automation Flows', desc: 'Triggers & webhooks', icon: Webhook, color: 'text-rose-400', placeholder: 'Describe the marketing automation you need...' },
] as const;

// ─── Copywriting Templates ─────────────────────────────────────
const COPY_TEMPLATES = [
  { id: 'aida', name: 'AIDA', full: 'Attention → Interest → Desire → Action', color: 'from-orange-500/20 to-red-500/20',
    structure: 'A: Hook that stops the scroll\nI: Interesting fact or benefit\nD: Paint the dream outcome\nA: Clear CTA with urgency' },
  { id: 'pas', name: 'PAS', full: 'Problem → Agitate → Solution', color: 'from-blue-500/20 to-cyan-500/20',
    structure: 'P: State the painful problem\nA: Make it worse — what happens if ignored\nS: Your product as the perfect solution' },
  { id: 'bab', name: 'BAB', full: 'Before → After → Bridge', color: 'from-green-500/20 to-emerald-500/20',
    structure: 'B: Life before (the struggle)\nA: Life after (the transformation)\nB: Your product is the bridge' },
  { id: '4ps', name: '4Ps', full: 'Promise → Picture → Proof → Push', color: 'from-purple-500/20 to-violet-500/20',
    structure: 'Promise: Bold benefit claim\nPicture: Vivid visualization\nProof: Testimonials/data\nPush: CTA with scarcity' },
  { id: 'storybrand', name: 'StoryBrand', full: 'Hero → Problem → Guide → Plan → CTA', color: 'from-pink-500/20 to-rose-500/20',
    structure: 'Hero: Your customer\nProblem: Their challenge\nGuide: You (empathy + authority)\nPlan: 3 simple steps\nCTA: Clear action\nSuccess: What they achieve\nFailure: What they avoid' },
  { id: '4cs', name: '4Cs', full: 'Clear → Concise → Compelling → Credible', color: 'from-teal-500/20 to-sky-500/20',
    structure: 'Clear: No jargon, simple language\nConcise: Every word counts\nCompelling: Benefits over features\nCredible: Data, testimonials, guarantees' },
];

// ─── Funnel Stages ─────────────────────────────────────────────
const FUNNEL_STAGES = [
  { name: 'TOFU', label: 'Awareness', desc: 'Reels, TikToks, Blog posts, SEO', icon: Users, color: 'text-blue-400', width: 'w-full', tool: 'short-script' },
  { name: 'MOFU', label: 'Interest', desc: 'Lead magnets, Email nurture', icon: Target, color: 'text-purple-400', width: 'w-[85%]', tool: 'lead-magnet' },
  { name: 'BOFU', label: 'Decision', desc: 'Landing pages, Webinars, Demos', icon: DollarSign, color: 'text-orange-400', width: 'w-[65%]', tool: 'landing-template' },
  { name: 'Sale', label: 'Action', desc: 'Checkout, Upsell, Ad Copy', icon: TrendingUp, color: 'text-green-400', width: 'w-[45%]', tool: 'ad-copy' },
  { name: 'Referral', label: 'Advocate', desc: 'Referral program, Reviews', icon: Repeat, color: 'text-pink-400', width: 'w-[30%]', tool: 'email-sequence' },
];

const PLATFORMS = ['Facebook', 'Google', 'TikTok', 'Instagram', 'LinkedIn', 'YouTube', 'Twitter/X'];
type Tab = 'tools' | 'templates' | 'funnel' | 'stats';

interface Generation {
  id: string;
  content_type: string;
  framework: string | null;
  platform: string | null;
  prompt: string;
  result: any;
  model: string | null;
  created_at: string;
}

export function MarketingContentPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('tools');
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [platform, setPlatform] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [abVariants, setAbVariants] = useState<any[]>([]);
  const [repurposed, setRepurposed] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<Generation[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Load generation history from DB
  useEffect(() => {
    if (!user || activeTab !== 'stats') return;
    const load = async () => {
      setHistoryLoading(true);
      const { data } = await supabase
        .from('marketing_generations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) setHistory(data as Generation[]);
      setHistoryLoading(false);
    };
    load();
  }, [user, activeTab]);

  const callAI = async (contentType: string, promptText: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-marketing-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ contentType, prompt: promptText, platform, model: 'google/gemini-3-flash-preview' }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Generation failed');
    return data.content;
  };

  const saveGeneration = async (contentType: string, promptText: string, resultData: any, model: string) => {
    if (!user) return;
    await supabase.from('marketing_generations').insert({
      user_id: user.id,
      content_type: contentType,
      framework: selectedTemplate || null,
      platform: platform || null,
      prompt: promptText.slice(0, 3000),
      result: resultData,
      model,
    });
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    const toolId = selectedTool || 'ad-copy';
    setIsGenerating(true);
    setResult(null);
    setAbVariants([]);
    setRepurposed([]);

    try {
      const template = COPY_TEMPLATES.find(t => t.id === selectedTemplate);
      const templateCtx = template ? `\n\nUse the ${template.name} copywriting framework:\n${template.structure}` : '';
      const fullPrompt = prompt.trim() + templateCtx;

      // Main generation
      const mainResult = await callAI(toolId, fullPrompt);
      setResult(mainResult);
      await saveGeneration(toolId, fullPrompt, mainResult, 'google/gemini-3-flash-preview');
      toast.success('Content generated & saved!');

      // Auto-generate A/B variant
      try {
        const variantResult = await callAI(toolId, `Create a completely DIFFERENT variation. Use different hooks, angles, and tone:\n\n${fullPrompt}`);
        setAbVariants([mainResult, variantResult]);
      } catch { /* optional */ }

      // Auto-repurpose
      try {
        const repurposeResult = await callAI('ad-copy', `Repurpose for: 1) Twitter/X (280 chars), 2) Instagram caption, 3) LinkedIn post. Return JSON: {"twitter":"...","instagram":"...","linkedin":"..."}\n\nOriginal: ${JSON.stringify(mainResult).slice(0, 1500)}`);
        if (repurposeResult) {
          const items: string[] = [];
          if (repurposeResult.twitter) items.push(`🐦 Twitter: ${repurposeResult.twitter}`);
          if (repurposeResult.instagram) items.push(`📸 Instagram: ${repurposeResult.instagram}`);
          if (repurposeResult.linkedin) items.push(`💼 LinkedIn: ${repurposeResult.linkedin}`);
          if (repurposeResult.raw) items.push(repurposeResult.raw);
          if (items.length > 0) setRepurposed(items);
        }
      } catch { /* optional */ }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to generate');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string | object) => {
    navigator.clipboard.writeText(typeof text === 'string' ? text : JSON.stringify(text, null, 2));
    setCopied(true);
    toast.success('Copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteGeneration = async (id: string) => {
    await supabase.from('marketing_generations').delete().eq('id', id);
    setHistory(h => h.filter(g => g.id !== id));
    toast.success('Deleted');
  };

  const handleExportHistory = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marketing-generations-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tool = CONTENT_TOOLS.find(t => t.id === selectedTool);

  // Stats calculations
  const totalGenerations = history.length;
  const byType = history.reduce<Record<string, number>>((acc, g) => {
    acc[g.content_type] = (acc[g.content_type] || 0) + 1;
    return acc;
  }, {});
  const byFramework = history.reduce<Record<string, number>>((acc, g) => {
    if (g.framework) acc[g.framework] = (acc[g.framework] || 0) + 1;
    return acc;
  }, {});
  const todayCount = history.filter(g => new Date(g.created_at).toDateString() === new Date().toDateString()).length;

  const tabs: { key: Tab; label: string; icon: typeof Zap }[] = [
    { key: 'tools', label: 'Generate', icon: Sparkles },
    { key: 'templates', label: 'Frameworks', icon: FileText },
    { key: 'funnel', label: 'Funnel', icon: Layers },
    { key: 'stats', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border/40 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground font-display">Marketing Content Studio</h2>
            <p className="text-[9px] text-muted-foreground font-mono">9 AI tools · A/B variants · repurposing · 6 frameworks</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/40">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); if (key === 'tools') { setSelectedTool(null); setResult(null); } }}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-[10px] font-medium uppercase tracking-wider transition-all',
              activeTab === key ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-4">
        {/* ═══ TAB: TOOLS ═══ */}
        {activeTab === 'tools' && !selectedTool && (
          <div className="grid grid-cols-3 gap-2">
            {CONTENT_TOOLS.map((t) => (
              <motion.button
                key={t.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedTool(t.id)}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-border/50 bg-card/50 p-3 text-center hover:border-primary/30 hover:bg-card transition-all group"
              >
                <t.icon className={cn('h-5 w-5', t.color)} />
                <p className="text-[10px] font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">{t.label}</p>
                <p className="text-[8px] text-muted-foreground leading-tight">{t.desc}</p>
              </motion.button>
            ))}
          </div>
        )}

        {activeTab === 'tools' && selectedTool && (
          <div className="space-y-3">
            <button onClick={() => { setSelectedTool(null); setResult(null); setAbVariants([]); setRepurposed([]); }} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
              ← Back to tools
            </button>

            <div className="flex items-center gap-2">
              {tool && <tool.icon className={cn('h-4 w-4', tool.color)} />}
              <h3 className="text-xs font-bold text-foreground">{tool?.label}</h3>
            </div>

            {/* Template selector */}
            <div>
              <label className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1 block">Copywriting Framework (optional)</label>
              <div className="flex flex-wrap gap-1.5">
                {COPY_TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(selectedTemplate === t.id ? null : t.id)}
                    className={cn(
                      'rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all border',
                      selectedTemplate === t.id
                        ? 'bg-primary/15 border-primary/30 text-primary'
                        : 'border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
                    )}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
              {selectedTemplate && (
                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-[9px] text-primary/70 mt-1 font-mono">
                  {COPY_TEMPLATES.find(t => t.id === selectedTemplate)?.full}
                </motion.p>
              )}
            </div>

            {/* Platform selector */}
            {['ad-copy', 'social-calendar', 'short-script'].includes(selectedTool) && (
              <div>
                <label className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1 block">Platform</label>
                <div className="flex flex-wrap gap-1">
                  {PLATFORMS.map(p => (
                    <button key={p} onClick={() => setPlatform(platform === p ? '' : p)}
                      className={cn('rounded-full px-2.5 py-0.5 text-[9px] font-medium transition-all border',
                        platform === p ? 'bg-primary/15 border-primary/30 text-primary' : 'border-border/50 text-muted-foreground hover:border-border'
                      )}>{p}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Prompt */}
            <textarea
              value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={tool?.placeholder} rows={3}
              className="w-full rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10 resize-none"
            />

            {/* Generate */}
            <motion.button whileTap={{ scale: 0.98 }} onClick={handleGenerate} disabled={!prompt.trim() || isGenerating}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50 transition-all">
              {isGenerating ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating...</> : <><Sparkles className="h-3.5 w-3.5" /> Generate + A/B + Repurpose</>}
            </motion.button>

            {/* ═══ RESULTS ═══ */}
            <AnimatePresence>
              {result && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  {/* Main Result */}
                  <div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
                    <div className="flex items-center justify-between border-b border-border/40 px-3 py-2">
                      <span className="text-[10px] font-bold text-foreground flex items-center gap-1"><span className="text-primary">A</span> Main Version</span>
                      <button onClick={() => handleCopy(result)} className="text-[9px] text-muted-foreground hover:text-foreground flex items-center gap-1">
                        {copied ? <Check className="h-2.5 w-2.5 text-green-500" /> : <Copy className="h-2.5 w-2.5" />} Copy
                      </button>
                    </div>
                    <div className="p-3 max-h-[200px] overflow-auto">
                      <pre className="text-[10px] text-foreground font-mono whitespace-pre-wrap leading-relaxed">{JSON.stringify(result, null, 2)}</pre>
                    </div>
                  </div>

                  {/* A/B Variant */}
                  {abVariants.length > 1 && (
                    <div className="rounded-xl border border-accent/30 bg-accent/5 overflow-hidden">
                      <div className="flex items-center justify-between border-b border-accent/20 px-3 py-2">
                        <span className="text-[10px] font-bold text-foreground flex items-center gap-1.5">
                          <GitBranch className="h-3 w-3 text-accent" />
                          <span className="text-accent">B</span> A/B Variant
                        </span>
                        <button onClick={() => handleCopy(abVariants[1])} className="text-[9px] text-muted-foreground hover:text-foreground flex items-center gap-1">
                          <Copy className="h-2.5 w-2.5" /> Copy
                        </button>
                      </div>
                      <div className="p-3 max-h-[200px] overflow-auto">
                        <pre className="text-[10px] text-foreground font-mono whitespace-pre-wrap leading-relaxed">{JSON.stringify(abVariants[1], null, 2)}</pre>
                      </div>
                    </div>
                  )}

                  {/* Repurposed */}
                  {repurposed.length > 0 && (
                    <div className="rounded-xl border border-green-500/30 bg-green-500/5 overflow-hidden">
                      <div className="flex items-center gap-1.5 border-b border-green-500/20 px-3 py-2">
                        <Repeat className="h-3 w-3 text-green-500" />
                        <span className="text-[10px] font-bold text-foreground">Repurposed Versions</span>
                      </div>
                      <div className="p-3 space-y-2">
                        {repurposed.map((item, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <p className="text-[10px] text-foreground leading-relaxed flex-1">{item}</p>
                            <button onClick={() => handleCopy(item)} className="shrink-0 text-muted-foreground hover:text-foreground">
                              <Copy className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ═══ TAB: FRAMEWORKS ═══ */}
        {activeTab === 'templates' && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground mb-3">Professional copywriting frameworks used by top marketers worldwide.</p>
            {COPY_TEMPLATES.map(t => (
              <motion.div key={t.id} whileHover={{ scale: 1.005 }}
                className={cn('rounded-xl border border-border/50 bg-gradient-to-br p-4 cursor-pointer hover:border-primary/30 transition-all', t.color)}
                onClick={() => { setSelectedTemplate(t.id); setActiveTab('tools'); }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-foreground">{t.name}</h4>
                  <span className="text-[9px] text-muted-foreground font-mono">{t.full}</span>
                </div>
                <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed">{t.structure}</pre>
                <div className="mt-2 flex items-center gap-1 text-[9px] text-primary">
                  <ArrowRight className="h-2.5 w-2.5" /> Click to use this framework
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ═══ TAB: FUNNEL ═══ */}
        {activeTab === 'funnel' && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">Marketing funnel — click any stage to generate content for it.</p>
            <div className="flex flex-col items-center gap-1 py-4">
              {FUNNEL_STAGES.map((stage, i) => (
                <motion.button
                  key={stage.name}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => { setSelectedTool(stage.tool); setActiveTab('tools'); }}
                  className={cn(
                    'relative rounded-lg border border-border/50 bg-card/80 py-3 px-4 text-center transition-all hover:border-primary/30 hover:bg-card',
                    stage.width
                  )}
                  style={{ opacity: 1 - i * 0.05 }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <stage.icon className={cn('h-4 w-4', stage.color)} />
                    <div>
                      <p className="text-xs font-bold text-foreground">{stage.label}</p>
                      <p className="text-[9px] text-muted-foreground">{stage.desc}</p>
                    </div>
                  </div>
                  <span className="absolute -left-5 top-1/2 -translate-y-1/2 text-[8px] font-mono text-muted-foreground/40">{stage.name}</span>
                </motion.button>
              ))}
            </div>
            <div className="rounded-xl border border-border/30 bg-card/30 p-3">
              <p className="text-[10px] text-muted-foreground text-center">
                <strong className="text-foreground">Pro Tip:</strong> Generate content for each funnel stage. TOFU attracts → MOFU nurtures → BOFU converts → Referral multiplies.
              </p>
            </div>
          </div>
        )}

        {/* ═══ TAB: ANALYTICS ═══ */}
        {activeTab === 'stats' && (
          <div className="space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: 'Total Generated', value: totalGenerations, icon: Sparkles, color: 'text-primary' },
                { label: 'Today', value: todayCount, icon: BarChart3, color: 'text-accent' },
                { label: 'Frameworks Used', value: Object.keys(byFramework).length, icon: FileText, color: 'text-orange-400' },
                { label: 'Content Types', value: Object.keys(byType).length, icon: Layers, color: 'text-green-400' },
              ].map(s => (
                <div key={s.label} className="rounded-xl border border-border/50 bg-card/50 p-3 text-center">
                  <s.icon className={cn('h-4 w-4 mx-auto mb-1', s.color)} />
                  <p className="text-lg font-bold font-mono text-foreground">{s.value}</p>
                  <p className="text-[9px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            {/* By type breakdown */}
            {Object.keys(byType).length > 0 && (
              <div className="rounded-xl border border-border/50 bg-card/50 p-3">
                <h4 className="text-[10px] font-bold text-foreground mb-2 uppercase tracking-wider">By Content Type</h4>
                <div className="space-y-1.5">
                  {Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                    <div key={type} className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="flex justify-between text-[10px] mb-0.5">
                          <span className="text-foreground">{CONTENT_TOOLS.find(t => t.id === type)?.label || type}</span>
                          <span className="text-muted-foreground font-mono">{count}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-border overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
                            style={{ width: `${(count / totalGenerations) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Export + History */}
            {history.length > 0 && (
              <>
                <div className="flex gap-2">
                  <button onClick={handleExportHistory} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-border/50 bg-card/50 py-2 text-[10px] font-medium text-foreground hover:bg-card transition-all">
                    <Download className="h-3 w-3" /> Export History
                  </button>
                </div>
                <div className="rounded-xl border border-border/50 bg-card/50 p-3">
                  <h4 className="text-[10px] font-bold text-foreground mb-2 uppercase tracking-wider">Recent Generations</h4>
                  <div className="space-y-1.5 max-h-[250px] overflow-auto">
                    {history.slice(0, 20).map((g) => (
                      <div key={g.id} className="flex items-center justify-between text-[10px] group">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-foreground font-medium truncate">{CONTENT_TOOLS.find(t => t.id === g.content_type)?.label || g.content_type}</span>
                          {g.framework && <span className="text-primary/60 font-mono text-[8px]">{g.framework.toUpperCase()}</span>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-muted-foreground">{new Date(g.created_at).toLocaleDateString()}</span>
                          <button onClick={() => handleDeleteGeneration(g.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                            <Trash2 className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {historyLoading && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            )}

            {!historyLoading && history.length === 0 && (
              <div className="text-center py-8">
                <BarChart3 className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No content generated yet. Start creating!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
