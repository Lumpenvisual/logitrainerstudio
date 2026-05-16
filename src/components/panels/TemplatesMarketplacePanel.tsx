import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Store, Plus, Heart, Copy, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

const FRAMEWORKS = ["AIDA", "PAS", "BAB", "4Ps", "StoryBrand", "Other"];
const CATEGORIES = ["Ad Copy", "Email", "Landing Page", "Social Post", "Lead Magnet", "VSL", "Other"];

interface Template {
  id: string;
  author_id: string;
  title: string;
  description: string | null;
  framework: string;
  category: string;
  content: any;
  tags: string[];
  likes_count: number;
  uses_count: number;
}

export function TemplatesMarketplacePanel() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterFramework, setFilterFramework] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [framework, setFramework] = useState("AIDA");
  const [category, setCategory] = useState("Ad Copy");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");

  const fetch = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("template_marketplace")
      .select("*")
      .order("likes_count", { ascending: false });
    if (error) toast.error(error.message);
    else setTemplates((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const create = async () => {
    if (!user || !title.trim() || !content.trim()) return;
    const { error } = await supabase.from("template_marketplace").insert({
      author_id: user.id,
      title,
      description,
      framework,
      category,
      content: { body: content },
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Template published to marketplace");
      setTitle(""); setDescription(""); setContent(""); setTags("");
      setOpen(false); fetch();
    }
  };

  const like = async (t: Template) => {
    await supabase.from("template_marketplace").update({ likes_count: t.likes_count + 1 }).eq("id", t.id);
    fetch();
  };

  const applyTemplate = async (t: Template) => {
    await supabase.from("template_marketplace").update({ uses_count: t.uses_count + 1 }).eq("id", t.id);
    const text = typeof t.content === "object" ? (t.content.body || JSON.stringify(t.content, null, 2)) : String(t.content);
    await navigator.clipboard.writeText(text);
    toast.success("Template copied to clipboard");
    fetch();
  };

  const remove = async (id: string) => {
    await supabase.from("template_marketplace").delete().eq("id", id);
    toast.success("Template deleted"); fetch();
  };

  const filtered = templates.filter((t) => {
    if (filterFramework !== "all" && t.framework !== filterFramework) return false;
    if (filterCategory !== "all" && t.category !== filterCategory) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !(t.description || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="h-full overflow-y-auto p-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl font-bold flex items-center gap-2">
              <Store className="h-6 w-6 text-primary" /> Templates Marketplace
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Community-shared copywriting templates by framework</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Publish Template</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Publish New Template</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
                <Input placeholder="Short description" value={description} onChange={(e) => setDescription(e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <Select value={framework} onValueChange={setFramework}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{FRAMEWORKS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Textarea placeholder="Template content..." value={content} onChange={(e) => setContent(e.target.value)} className="min-h-[180px]" />
                <Input placeholder="Tags (comma-separated)" value={tags} onChange={(e) => setTags(e.target.value)} />
                <Button onClick={create} className="w-full">Publish</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterFramework} onValueChange={setFilterFramework}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Frameworks</SelectItem>
              {FRAMEWORKS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading && <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}
        {!loading && filtered.length === 0 && (
          <Card className="p-12 text-center">
            <Store className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">No templates match your filters. Be the first to publish one!</p>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <Card key={t.id} className="p-4 flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-semibold flex-1">{t.title}</h4>
                {user?.id === t.author_id && (
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(t.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              {t.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{t.description}</p>}
              <div className="flex flex-wrap gap-1 mb-3">
                <Badge variant="outline" className="text-[10px]">{t.framework}</Badge>
                <Badge variant="secondary" className="text-[10px]">{t.category}</Badge>
                {t.tags.slice(0, 3).map((tag) => <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>)}
              </div>
              <div className="bg-muted/40 rounded p-2 text-xs font-mono mb-3 line-clamp-4 flex-1">
                {typeof t.content === "object" ? (t.content.body || JSON.stringify(t.content)) : String(t.content)}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <button onClick={() => like(t)} className="flex items-center gap-1 hover:text-destructive transition-colors">
                    <Heart className="h-3.5 w-3.5" /> {t.likes_count}
                  </button>
                  <span className="flex items-center gap-1"><Copy className="h-3.5 w-3.5" /> {t.uses_count}</span>
                </div>
                <Button size="sm" variant="outline" onClick={() => applyTemplate(t)}>
                  <Copy className="h-3.5 w-3.5 mr-1" /> Use
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
