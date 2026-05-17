import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { generateEmailSequence } from "@/services/aiService";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Mail, Plus, Sparkles, Trash2, Power } from "lucide-react";
import { toast } from "sonner";

const FRAMEWORKS = ["AIDA", "PAS", "BAB", "4Ps", "StoryBrand"];

interface EmailItem {
  day: number;
  subject: string;
  preheader?: string;
  body: string;
  cta?: string;
}

interface Sequence {
  id: string;
  name: string;
  description: string | null;
  framework: string | null;
  emails: EmailItem[];
  is_active: boolean;
  created_at: string;
}

export function EmailAutomationPanel() {
  const { user } = useAuth();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [framework, setFramework] = useState("AIDA");
  const [selected, setSelected] = useState<Sequence | null>(null);

  const fetchSequences = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("email_sequences")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setSequences((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchSequences(); }, [user]);

  const handleGenerate = async () => {
    if (!topic.trim() || !user) return;
    setGenerating(true);
    try {
      const { data, error } = await generateEmailSequence({ topic, framework, audience });
      if (error) throw new Error(error);
      const seq = data?.sequence;
      if (!seq?.emails) throw new Error("Invalid response");

      const { error: insertErr } = await supabase.from("email_sequences").insert({
        user_id: user.id,
        name: seq.name || topic.slice(0, 60),
        description: seq.description || null,
        framework,
        emails: seq.emails,
      });
      if (insertErr) throw insertErr;
      toast.success("Email sequence generated and saved");
      setTopic("");
      setAudience("");
      fetchSequences();
    } catch (e: any) {
      toast.error(e.message || "Failed to generate sequence");
    } finally {
      setGenerating(false);
    }
  };

  const toggleActive = async (seq: Sequence) => {
    const { error } = await supabase
      .from("email_sequences")
      .update({ is_active: !seq.is_active })
      .eq("id", seq.id);
    if (error) toast.error(error.message);
    else fetchSequences();
  };

  const deleteSequence = async (id: string) => {
    const { error } = await supabase.from("email_sequences").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Sequence deleted"); fetchSequences(); if (selected?.id === id) setSelected(null); }
  };

  return (
    <div className="flex h-full overflow-hidden bg-background">
      <div className="w-[420px] border-r border-border/60 flex flex-col">
        <div className="p-4 border-b border-border/60">
          <h2 className="font-display text-lg font-bold flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" /> Email Automation Builder
          </h2>
          <p className="text-xs text-muted-foreground mt-1">7-email sequences powered by AI frameworks</p>
        </div>

        <div className="p-4 space-y-3 border-b border-border/60">
          <Input
            placeholder="Topic (e.g. Launching course on AI marketing)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            maxLength={1000}
          />
          <Input
            placeholder="Target audience (optional)"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            maxLength={200}
          />
          <Select value={framework} onValueChange={setFramework}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FRAMEWORKS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={handleGenerate} disabled={generating || !topic.trim()} className="w-full">
            {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Generate Sequence
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading && <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}
          {!loading && sequences.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No sequences yet. Generate your first one above.</p>
          )}
          {sequences.map((s) => (
            <Card
              key={s.id}
              onClick={() => setSelected(s)}
              className={`p-3 cursor-pointer transition-all hover:border-primary/40 ${selected?.id === s.id ? 'border-primary' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{s.name}</h4>
                  <div className="flex items-center gap-1 mt-1">
                    {s.framework && <Badge variant="outline" className="text-[10px]">{s.framework}</Badge>}
                    <Badge variant={s.is_active ? "default" : "secondary"} className="text-[10px]">
                      {s.is_active ? "Active" : "Paused"}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{s.emails?.length || 0} emails</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); toggleActive(s); }}>
                    <Power className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); deleteSequence(s.id); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {selected ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <h3 className="font-display text-2xl font-bold mb-1">{selected.name}</h3>
            {selected.description && <p className="text-muted-foreground mb-4">{selected.description}</p>}
            <div className="flex gap-2 mb-6">
              {selected.framework && <Badge>{selected.framework}</Badge>}
              <Badge variant="outline">{selected.emails?.length || 0} emails</Badge>
            </div>

            <div className="space-y-4">
              {(selected.emails || []).map((em, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">Day {em.day}</Badge>
                    <h4 className="font-semibold flex-1">{em.subject}</h4>
                  </div>
                  {em.preheader && <p className="text-xs text-muted-foreground italic mb-2">Preheader: {em.preheader}</p>}
                  <Textarea readOnly value={em.body} className="min-h-[140px] text-sm" />
                  {em.cta && <p className="text-sm mt-2"><strong>CTA:</strong> {em.cta}</p>}
                </Card>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Select a sequence to view its emails</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
