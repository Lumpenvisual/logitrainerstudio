import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { runAgentOrchestrator } from '@/services/aiService';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Bot, Play, Plus, Activity, Trash2, Pencil, ChevronRight, Users, Cpu, Loader2, CheckCircle2, XCircle, Search, Palette, Wrench, HeartHandshake, BookOpen, Mail, Megaphone, Presentation, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface Agent {
  id: string;
  name: string;
  role: string;
  goal: string;
  backstory?: string;
  system_prompt: string;
  model: string;
  temperature: number;
  category: string;
  icon: string;
  color: string;
  is_active: boolean;
  total_executions: number;
  success_count: number;
  total_tokens: number;
  avg_latency_ms: number;
}

interface Crew {
  id: string;
  name: string;
  description?: string;
  mission: string;
  orchestrator_agent_id?: string;
  process_type: string;
  is_active: boolean;
  total_runs: number;
}

interface CrewMember { id: string; crew_id: string; agent_id: string; position: number; task_description?: string; agent?: Agent }

interface Execution {
  id: string;
  agent_id?: string;
  crew_id?: string;
  status: string;
  input: string;
  output: any;
  error?: string;
  tokens_used: number;
  latency_ms: number;
  created_at: string;
}

const DEFAULT_AGENTS = [
  { name: 'Orchestrator', role: 'Master Orchestrator & Strategist', goal: 'Break down complex missions into clear sub-tasks and coordinate specialist agents.', backstory: 'You are a senior project lead with 15 years of experience orchestrating cross-functional creative and technical teams. You know how to extract the right work from each specialist.', system_prompt: 'You are the master orchestrator. When given a mission, produce a precise execution plan with numbered steps mapped to the available specialists. Anticipate dependencies, risks and quality criteria. Always be concrete and actionable.', icon: 'Sparkles', color: 'primary', category: 'orchestrator', temperature: 0.5 },
  { name: 'Researcher', role: 'Senior Market Researcher', goal: 'Gather, synthesize and validate facts, market data, audience insights and competitive intelligence.', backstory: 'You are a former McKinsey analyst turned market researcher. You cite sources, separate signal from noise, and quantify claims.', system_prompt: 'You produce structured research briefs with: 1) key facts, 2) audience pain points & desires, 3) competitor landscape, 4) opportunities, 5) recommended angles. Every claim is concrete; you never invent statistics. When unsure, say "based on common patterns".', icon: 'Search', color: 'info', category: 'specialist', temperature: 0.4 },
  { name: 'Designer', role: 'Module & UX Architect', goal: 'Design feature modules, UX flows, information architecture and component hierarchies.', backstory: 'You are a principal product designer at a unicorn SaaS. You think in components, user journeys, and edge cases.', system_prompt: 'You design modules with: 1) purpose, 2) user flows step by step, 3) UI components needed, 4) data model, 5) edge cases & error states, 6) success metrics. Output is implementation-ready.', icon: 'Palette', color: 'accent', category: 'specialist', temperature: 0.6 },
  { name: 'Copywriter', role: 'World-class Direct-Response Copywriter', goal: 'Craft persuasive, conversion-focused copy using proven frameworks (AIDA, PAS, StoryBrand).', backstory: 'Trained by the school of Eugene Schwartz, Gary Halbert and Stefan Georgi. Your copy has generated 9 figures.', system_prompt: 'You write copy that converts. Always specify: hook, body using a proven framework, CTA. No fluff, no clichés, no placeholders. Every line earns its place.', icon: 'Megaphone', color: 'warning', category: 'specialist', temperature: 0.8 },
  { name: 'Fixer', role: 'Code & Quality Reviewer', goal: 'Detect bugs, inconsistencies, missing pieces and propose concrete fixes.', backstory: 'You are a staff engineer who has shipped systems serving 100M users. You think in invariants and failure modes.', system_prompt: 'You audit work and produce a structured review: 1) issues found (severity), 2) root cause, 3) concrete fix with example, 4) what to test. Be ruthless but constructive.', icon: 'Wrench', color: 'destructive', category: 'specialist', temperature: 0.3 },
  { name: 'Assistant', role: 'Executive Assistant & Communicator', goal: 'Polish, summarize, format and prepare deliverables for the user.', backstory: 'You are a Chief of Staff with impeccable taste and zero tolerance for unclear writing.', system_prompt: 'You take draft outputs and turn them into polished, well-structured deliverables. Headings, bullets, clear action items. Friendly, professional, concise.', icon: 'HeartHandshake', color: 'success', category: 'specialist', temperature: 0.5 },
  { name: 'Ebook Author', role: 'Long-form Content Author', goal: 'Write rich, multi-chapter ebooks with genuine value and zero filler.', backstory: 'You have ghost-written best-selling business books. You write in a clear, energetic voice.', system_prompt: 'You produce full ebooks with: title, subtitle, intro, 5-8 chapters (each with 3-5 sections, examples, action steps), conclusion, CTA. Each chapter must teach something concrete and immediately useful.', icon: 'BookOpen', color: 'primary', category: 'content', temperature: 0.75 },
  { name: 'Email Writer', role: 'Email Marketing Specialist', goal: 'Write high-converting email sequences (welcome, nurture, sales).', backstory: 'You have written for 8-figure DTC brands. You know subject-line science and behavioral triggers.', system_prompt: 'You write email sequences as JSON or markdown with: subject, preheader, body (real, useful content), CTA. Voice is warm, specific, and benefit-led.', icon: 'Mail', color: 'info', category: 'content', temperature: 0.75 },
  { name: 'Slide Designer', role: 'Presentation & Pitch Architect', goal: 'Build compelling slide decks with narrative arc and strong visuals descriptions.', backstory: 'Former TED speaker coach and McKinsey deck wizard.', system_prompt: 'You produce presentation outlines with: slide title, key message, bullet points (max 3), suggested visual, speaker notes. Decks tell a story; every slide moves it forward.', icon: 'Presentation', color: 'accent', category: 'content', temperature: 0.65 },
];

const ICON_MAP: Record<string, any> = { Sparkles, Search, Palette, Wrench, HeartHandshake, BookOpen, Mail, Megaphone, Presentation, Bot, FileText };

export function AgentCrewPanel() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [crews, setCrews] = useState<Crew[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [members, setMembers] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedCrew, setSelectedCrew] = useState<Crew | null>(null);
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [showCrewForm, setShowCrewForm] = useState(false);
  const [showExecution, setShowExecution] = useState<Execution | null>(null);

  const [runInput, setRunInput] = useState('');

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [a, c, m, e] = await Promise.all([
      supabase.from('agents').select('*').order('created_at', { ascending: false }),
      supabase.from('agent_crews').select('*').order('created_at', { ascending: false }),
      supabase.from('crew_members').select('*, agent:agents(*)').order('position'),
      supabase.from('agent_executions').select('*').order('created_at', { ascending: false }).limit(50),
    ]);
    setAgents((a.data as any) || []);
    setCrews((c.data as any) || []);
    setMembers((m.data as any) || []);
    setExecutions((e.data as any) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const seedDefaults = async () => {
    if (!user) return;
    setLoading(true);
    const rows = DEFAULT_AGENTS.map((d) => ({
      ...d, user_id: user.id, model: 'google/gemini-3-flash-preview', is_active: true, is_template: true,
    }));
    const { error } = await supabase.from('agents').insert(rows);
    if (error) toast.error(error.message); else toast.success('9 default agents created');
    await fetchAll();
  };

  const seedDefaultCrew = async () => {
    if (!user) return;
    if (agents.length === 0) { toast.error('Seed agents first'); return; }
    const orchestrator = agents.find(a => a.category === 'orchestrator');
    const researcher = agents.find(a => a.name === 'Researcher');
    const designer = agents.find(a => a.name === 'Designer');
    const copywriter = agents.find(a => a.name === 'Copywriter');
    const fixer = agents.find(a => a.name === 'Fixer');
    const assistant = agents.find(a => a.name === 'Assistant');
    if (!orchestrator || !researcher || !designer || !copywriter) { toast.error('Need default agents first'); return; }

    const { data: crew, error } = await supabase.from('agent_crews').insert({
      user_id: user.id, name: 'Full-Stack Marketing Crew',
      description: 'End-to-end research → design → copy → review → polish pipeline.',
      mission: 'Research, design, draft, review and deliver world-class marketing assets.',
      orchestrator_agent_id: orchestrator.id, process_type: 'sequential', is_active: true,
    }).select().single();
    if (error || !crew) { toast.error(error?.message || 'Failed'); return; }

    const sequence = [researcher, designer, copywriter, fixer, assistant].filter(Boolean) as Agent[];
    const memberRows = sequence.map((a, i) => ({
      crew_id: crew.id, agent_id: a.id, position: i,
      task_description: a.goal,
    }));
    await supabase.from('crew_members').insert(memberRows);
    toast.success('Default crew assembled');
    fetchAll();
  };

  const runAgent = async (agentId: string, input: string) => {
    setRunning(true);
    try {
      const { data, error } = await runAgentOrchestrator({ mode: 'agent', agentId, input });
      if (error) throw new Error(error);
      toast.success(`Agent finished — ${data.tokens} tokens, ${data.latency}ms`);
      fetchAll();
      const exec = (await supabase.from('agent_executions').select('*').eq('id', data.executionId).single()).data as any;
      if (exec) setShowExecution(exec);
    } catch (e: any) {
      toast.error(e.message || 'Run failed');
    } finally { setRunning(false); }
  };

  const runCrew = async (crewId: string, input: string) => {
    setRunning(true);
    try {
      const { data, error } = await runAgentOrchestrator({ mode: 'crew', crewId, input });
      if (error) throw new Error(error);
      toast.success(`Crew finished — ${data.totalTokens} tokens across ${data.results?.length || 0} agents`);
      fetchAll();
      const exec = (await supabase.from('agent_executions').select('*').eq('id', data.executionId).single()).data as any;
      if (exec) setShowExecution(exec);
    } catch (e: any) {
      toast.error(e.message || 'Crew run failed');
    } finally { setRunning(false); }
  };

  const deleteAgent = async (id: string) => {
    await supabase.from('agents').delete().eq('id', id);
    fetchAll();
  };
  const deleteCrew = async (id: string) => {
    await supabase.from('agent_crews').delete().eq('id', id);
    fetchAll();
  };
  const toggleAgent = async (a: Agent) => {
    await supabase.from('agents').update({ is_active: !a.is_active }).eq('id', a.id);
    fetchAll();
  };

  const totalExecutions = agents.reduce((s, a) => s + (a.total_executions || 0), 0);
  const totalTokens = agents.reduce((s, a) => s + (a.total_tokens || 0), 0);
  const avgSuccess = agents.length > 0
    ? Math.round(agents.reduce((s, a) => s + (a.total_executions ? (a.success_count / a.total_executions) * 100 : 0), 0) / Math.max(agents.filter(a => a.total_executions > 0).length, 1))
    : 0;

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-background to-muted/10">
      <div className="mx-auto max-w-7xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="h-7 w-7 text-primary" /> Agent Crew Studio
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Orchestrator + specialist agents — administrable, monitorable, trackeable.</p>
          </div>
          <div className="flex gap-2">
            {agents.length === 0 && (
              <Button onClick={seedDefaults} disabled={loading}><Plus className="h-4 w-4 mr-1.5" />Seed default crew</Button>
            )}
            <Button variant="outline" onClick={() => setShowAgentForm(true)}><Plus className="h-4 w-4 mr-1.5" />New Agent</Button>
            <Button variant="outline" onClick={() => setShowCrewForm(true)} disabled={agents.length === 0}><Users className="h-4 w-4 mr-1.5" />New Crew</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4"><div className="text-xs text-muted-foreground">Active Agents</div><div className="text-2xl font-bold">{agents.filter(a => a.is_active).length}</div></Card>
          <Card className="p-4"><div className="text-xs text-muted-foreground">Total Executions</div><div className="text-2xl font-bold">{totalExecutions}</div></Card>
          <Card className="p-4"><div className="text-xs text-muted-foreground">Tokens Used</div><div className="text-2xl font-bold">{totalTokens.toLocaleString()}</div></Card>
          <Card className="p-4"><div className="text-xs text-muted-foreground">Avg Success Rate</div><div className="text-2xl font-bold">{avgSuccess}%</div></Card>
        </div>

        <Tabs defaultValue="agents" className="w-full">
          <TabsList>
            <TabsTrigger value="agents"><Bot className="h-3.5 w-3.5 mr-1.5" />Agents ({agents.length})</TabsTrigger>
            <TabsTrigger value="crews"><Users className="h-3.5 w-3.5 mr-1.5" />Crews ({crews.length})</TabsTrigger>
            <TabsTrigger value="executions"><Activity className="h-3.5 w-3.5 mr-1.5" />Executions ({executions.length})</TabsTrigger>
          </TabsList>

          {/* AGENTS */}
          <TabsContent value="agents" className="mt-4">
            {agents.length === 0 ? (
              <Card className="p-12 text-center">
                <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-display text-lg font-semibold">No agents yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Seed the default crew to get started — orchestrator, researcher, designer, copywriter, fixer, assistant, and content specialists.</p>
                <Button onClick={seedDefaults}><Plus className="h-4 w-4 mr-1.5" />Seed default crew</Button>
              </Card>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {agents.map((a) => {
                  const Icon = ICON_MAP[a.icon] || Bot;
                  const success = a.total_executions > 0 ? Math.round((a.success_count / a.total_executions) * 100) : 0;
                  return (
                    <Card key={a.id} className="p-4 hover:border-primary/40 transition">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Icon className="h-5 w-5 text-primary" /></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold truncate">{a.name}</h4>
                            {a.category === 'orchestrator' && <Badge variant="secondary" className="text-[10px]">ORCHESTRATOR</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{a.role}</p>
                        </div>
                        <Switch checked={a.is_active} onCheckedChange={() => toggleAgent(a)} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{a.goal}</p>
                      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/50">
                        <div><div className="text-[10px] text-muted-foreground">Runs</div><div className="text-sm font-semibold">{a.total_executions}</div></div>
                        <div><div className="text-[10px] text-muted-foreground">Success</div><div className="text-sm font-semibold">{success}%</div></div>
                        <div><div className="text-[10px] text-muted-foreground">Avg ms</div><div className="text-sm font-semibold">{a.avg_latency_ms}</div></div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" className="flex-1" onClick={() => setSelectedAgent(a)} disabled={!a.is_active}><Play className="h-3 w-3 mr-1" />Run</Button>
                        <Button size="sm" variant="ghost" onClick={() => { setSelectedAgent(a); setShowAgentForm(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteAgent(a.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* CREWS */}
          <TabsContent value="crews" className="mt-4">
            {crews.length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-display text-lg font-semibold">No crews yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Build a team that runs sequentially: orchestrator plans, specialists execute.</p>
                <Button onClick={seedDefaultCrew} disabled={agents.length < 4}><Sparkles className="h-4 w-4 mr-1.5" />Assemble default crew</Button>
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {crews.map((c) => {
                  const cMembers = members.filter(m => m.crew_id === c.id);
                  return (
                    <Card key={c.id} className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-display font-semibold text-lg">{c.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{c.description}</p>
                        </div>
                        <Badge variant="outline">{c.process_type}</Badge>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-1.5">
                        {cMembers.map((m, i) => {
                          const Icon = ICON_MAP[m.agent?.icon || 'Bot'] || Bot;
                          return (
                            <div key={m.id} className="flex items-center gap-1">
                              {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                              <Badge variant="secondary" className="gap-1"><Icon className="h-3 w-3" />{m.agent?.name}</Badge>
                            </div>
                          );
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground mt-3">Mission: {c.mission}</div>
                      <div className="flex gap-2 mt-4 pt-3 border-t border-border/50">
                        <Button size="sm" className="flex-1" onClick={() => setSelectedCrew(c)}><Play className="h-3 w-3 mr-1" />Run Crew ({c.total_runs} runs)</Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteCrew(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* EXECUTIONS */}
          <TabsContent value="executions" className="mt-4">
            <div className="space-y-2">
              {executions.length === 0 && <Card className="p-12 text-center text-muted-foreground">No executions yet — run an agent or crew.</Card>}
              {executions.map((e) => (
                <Card key={e.id} className="p-3 cursor-pointer hover:border-primary/40 flex items-center gap-3" onClick={() => setShowExecution(e)}>
                  {e.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-success" />}
                  {e.status === 'failed' && <XCircle className="h-4 w-4 text-destructive" />}
                  {e.status === 'running' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{e.input.slice(0, 100)}</div>
                    <div className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()} • {e.tokens_used} tokens • {e.latency_ms}ms</div>
                  </div>
                  <Badge variant={e.status === 'completed' ? 'default' : e.status === 'failed' ? 'destructive' : 'secondary'}>{e.status}</Badge>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Run agent dialog */}
      <Dialog open={!!selectedAgent && !showAgentForm} onOpenChange={(o) => { if (!o) { setSelectedAgent(null); setRunInput(''); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Run {selectedAgent?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground">{selectedAgent?.role}</div>
            <Textarea rows={6} placeholder="Describe what you want this agent to do..." value={runInput} onChange={(e) => setRunInput(e.target.value)} />
          </div>
          <DialogFooter>
            <Button onClick={async () => { if (selectedAgent && runInput.trim()) { await runAgent(selectedAgent.id, runInput); setSelectedAgent(null); setRunInput(''); } }} disabled={running || runInput.length < 3}>
              {running ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />} Run Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Run crew dialog */}
      <Dialog open={!!selectedCrew} onOpenChange={(o) => { if (!o) { setSelectedCrew(null); setRunInput(''); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Run Crew: {selectedCrew?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground">{selectedCrew?.mission}</div>
            <Textarea rows={6} placeholder="What should the crew accomplish?" value={runInput} onChange={(e) => setRunInput(e.target.value)} />
          </div>
          <DialogFooter>
            <Button onClick={async () => { if (selectedCrew && runInput.trim()) { await runCrew(selectedCrew.id, runInput); setSelectedCrew(null); setRunInput(''); } }} disabled={running || runInput.length < 3}>
              {running ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />} Run Crew
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Agent form */}
      <AgentFormDialog open={showAgentForm} agent={selectedAgent} onClose={() => { setShowAgentForm(false); setSelectedAgent(null); }} onSaved={fetchAll} userId={user?.id} />

      {/* Crew form */}
      <CrewFormDialog open={showCrewForm} agents={agents} onClose={() => setShowCrewForm(false)} onSaved={fetchAll} userId={user?.id} />

      {/* Execution detail */}
      <Dialog open={!!showExecution} onOpenChange={(o) => !o && setShowExecution(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader><DialogTitle>Execution Detail</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            {showExecution && (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <Card className="p-2"><div className="text-muted-foreground">Status</div><div className="font-semibold">{showExecution.status}</div></Card>
                  <Card className="p-2"><div className="text-muted-foreground">Tokens</div><div className="font-semibold">{showExecution.tokens_used}</div></Card>
                  <Card className="p-2"><div className="text-muted-foreground">Latency</div><div className="font-semibold">{showExecution.latency_ms}ms</div></Card>
                  <Card className="p-2"><div className="text-muted-foreground">Date</div><div className="font-semibold">{new Date(showExecution.created_at).toLocaleString()}</div></Card>
                </div>
                <div><Label>Input</Label><div className="mt-1 p-3 bg-muted/30 rounded-md whitespace-pre-wrap">{showExecution.input}</div></div>
                {showExecution.error && <div><Label>Error</Label><div className="mt-1 p-3 bg-destructive/10 text-destructive rounded-md">{showExecution.error}</div></div>}
                {showExecution.output?.plan && <div><Label>Orchestrator Plan</Label><div className="mt-1 p-3 bg-primary/5 rounded-md whitespace-pre-wrap">{showExecution.output.plan}</div></div>}
                {showExecution.output?.results && (
                  <div className="space-y-3">
                    <Label>Agent Outputs ({showExecution.output.results.length})</Label>
                    {showExecution.output.results.map((r: any, i: number) => (
                      <Card key={i} className="p-3">
                        <div className="font-semibold text-sm flex items-center gap-2"><Cpu className="h-3.5 w-3.5" />{r.agentName} <Badge variant="outline" className="text-[10px]">{r.role}</Badge></div>
                        <div className="mt-2 whitespace-pre-wrap text-xs">{r.output}</div>
                        <div className="mt-2 text-[10px] text-muted-foreground">{r.tokens} tokens • {r.latency}ms</div>
                      </Card>
                    ))}
                  </div>
                )}
                {showExecution.output?.text && <div><Label>Output</Label><div className="mt-1 p-3 bg-muted/30 rounded-md whitespace-pre-wrap">{showExecution.output.text}</div></div>}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AgentFormDialog({ open, agent, onClose, onSaved, userId }: { open: boolean; agent: Agent | null; onClose: () => void; onSaved: () => void; userId?: string }) {
  const [form, setForm] = useState<any>({});
  useEffect(() => {
    if (agent) setForm(agent);
    else setForm({ name: '', role: '', goal: '', system_prompt: '', model: 'google/gemini-3-flash-preview', temperature: 0.7, category: 'specialist', icon: 'Bot', color: 'primary', is_active: true });
  }, [agent, open]);

  const save = async () => {
    if (!userId) return;
    if (!form.name || !form.role || !form.goal || !form.system_prompt) { toast.error('Fill required fields'); return; }
    if (agent) {
      await supabase.from('agents').update({
        name: form.name, role: form.role, goal: form.goal, backstory: form.backstory,
        system_prompt: form.system_prompt, model: form.model, temperature: Number(form.temperature),
        category: form.category, is_active: form.is_active,
      }).eq('id', agent.id);
      toast.success('Agent updated');
    } else {
      await supabase.from('agents').insert({ ...form, user_id: userId });
      toast.success('Agent created');
    }
    onSaved(); onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{agent ? 'Edit Agent' : 'New Agent'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Name</Label><Input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="orchestrator">Orchestrator</SelectItem><SelectItem value="specialist">Specialist</SelectItem><SelectItem value="content">Content</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Role</Label><Input value={form.role || ''} onChange={(e) => setForm({ ...form, role: e.target.value })} /></div>
          <div><Label>Goal</Label><Textarea rows={2} value={form.goal || ''} onChange={(e) => setForm({ ...form, goal: e.target.value })} /></div>
          <div><Label>Backstory</Label><Textarea rows={2} value={form.backstory || ''} onChange={(e) => setForm({ ...form, backstory: e.target.value })} /></div>
          <div><Label>System Prompt</Label><Textarea rows={5} value={form.system_prompt || ''} onChange={(e) => setForm({ ...form, system_prompt: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Model</Label>
              <Select value={form.model} onValueChange={(v) => setForm({ ...form, model: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="google/gemini-3-flash-preview">Gemini 3 Flash (fast)</SelectItem>
                  <SelectItem value="google/gemini-2.5-pro">Gemini 2.5 Pro (smart)</SelectItem>
                  <SelectItem value="google/gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                  <SelectItem value="openai/gpt-5">GPT-5</SelectItem>
                  <SelectItem value="openai/gpt-5-mini">GPT-5 mini</SelectItem>
                  <SelectItem value="openai/gpt-5.2">GPT-5.2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Temperature ({form.temperature})</Label><Input type="number" step="0.1" min="0" max="1" value={form.temperature ?? 0.7} onChange={(e) => setForm({ ...form, temperature: e.target.value })} /></div>
          </div>
        </div>
        <DialogFooter><Button onClick={save}>Save Agent</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CrewFormDialog({ open, agents, onClose, onSaved, userId }: { open: boolean; agents: Agent[]; onClose: () => void; onSaved: () => void; userId?: string }) {
  const [form, setForm] = useState<any>({ name: '', description: '', mission: '', orchestrator_agent_id: '', selected: [] as string[] });
  useEffect(() => {
    if (open) setForm({ name: '', description: '', mission: '', orchestrator_agent_id: '', selected: [] });
  }, [open]);

  const toggle = (id: string) => {
    setForm((f: any) => f.selected.includes(id) ? { ...f, selected: f.selected.filter((x: string) => x !== id) } : { ...f, selected: [...f.selected, id] });
  };

  const save = async () => {
    if (!userId) return;
    if (!form.name || !form.mission || form.selected.length === 0) { toast.error('Fill name, mission and pick at least one agent'); return; }
    const { data: crew, error } = await supabase.from('agent_crews').insert({
      user_id: userId, name: form.name, description: form.description, mission: form.mission,
      orchestrator_agent_id: form.orchestrator_agent_id || null, process_type: 'sequential', is_active: true,
    }).select().single();
    if (error || !crew) { toast.error(error?.message); return; }
    const rows = form.selected.map((id: string, i: number) => ({ crew_id: crew.id, agent_id: id, position: i }));
    await supabase.from('crew_members').insert(rows);
    toast.success('Crew created');
    onSaved(); onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>New Crew</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div><Label>Mission</Label><Textarea rows={2} value={form.mission} onChange={(e) => setForm({ ...form, mission: e.target.value })} /></div>
          <div><Label>Orchestrator (optional)</Label>
            <Select value={form.orchestrator_agent_id} onValueChange={(v) => setForm({ ...form, orchestrator_agent_id: v })}>
              <SelectTrigger><SelectValue placeholder="No orchestrator" /></SelectTrigger>
              <SelectContent>{agents.filter(a => a.category === 'orchestrator').map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Pick agents (in order)</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {agents.filter(a => a.category !== 'orchestrator').map(a => {
                const idx = form.selected.indexOf(a.id);
                const Icon = ICON_MAP[a.icon] || Bot;
                return (
                  <button key={a.id} onClick={() => toggle(a.id)} className={`text-left p-2 rounded-md border transition ${idx >= 0 ? 'border-primary bg-primary/10' : 'border-border'}`}>
                    <div className="flex items-center gap-2"><Icon className="h-4 w-4" /><span className="text-sm font-medium">{a.name}</span>{idx >= 0 && <Badge className="ml-auto text-[10px]">#{idx + 1}</Badge>}</div>
                    <div className="text-[10px] text-muted-foreground line-clamp-1">{a.role}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <DialogFooter><Button onClick={save}>Create Crew</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}