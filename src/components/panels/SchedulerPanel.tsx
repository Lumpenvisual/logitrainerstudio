import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  CalendarDays, Plus, Trash2, Clock, CheckCircle, Circle,
  Loader2, Send, Instagram, Twitter, Linkedin, Youtube, Globe
} from 'lucide-react';

interface ScheduledPost {
  id: string;
  platform: string;
  content: string;
  hashtags: string[];
  scheduled_at: string;
  status: string;
  created_at: string;
}

const PLATFORM_ICONS: Record<string, typeof Globe> = {
  Instagram, 'Twitter/X': Twitter, LinkedIn: Linkedin, YouTube: Youtube,
};
const PLATFORM_COLORS: Record<string, string> = {
  Instagram: 'text-pink-400', 'Twitter/X': 'text-sky-400', LinkedIn: 'text-blue-500',
  YouTube: 'text-red-400', Facebook: 'text-blue-400', TikTok: 'text-foreground',
};
const PLATFORMS_LIST = ['Instagram', 'Twitter/X', 'LinkedIn', 'YouTube', 'Facebook', 'TikTok'];

export function SchedulerPanel() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formPlatform, setFormPlatform] = useState('Instagram');
  const [formContent, setFormContent] = useState('');
  const [formHashtags, setFormHashtags] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('10:00');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('scheduled_posts')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_at', { ascending: true })
        .limit(100);
      if (data) setPosts(data as ScheduledPost[]);
      setLoading(false);
    };
    load();
  }, [user]);

  const handleCreate = async () => {
    if (!user || !formContent.trim() || !formDate) return;
    setSaving(true);
    const scheduledAt = new Date(`${formDate}T${formTime}`).toISOString();
    const hashtags = formHashtags.split(/[,\s]+/).filter(h => h.startsWith('#') || h.length > 0).map(h => h.startsWith('#') ? h : `#${h}`);

    const { data, error } = await supabase.from('scheduled_posts').insert({
      user_id: user.id,
      platform: formPlatform,
      content: formContent.trim(),
      hashtags,
      scheduled_at: scheduledAt,
      status: 'scheduled',
    }).select().single();

    if (error) { toast.error('Failed to schedule'); }
    else if (data) {
      setPosts(p => [...p, data as ScheduledPost].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()));
      setShowForm(false);
      setFormContent('');
      setFormHashtags('');
      toast.success('Post scheduled!');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('scheduled_posts').delete().eq('id', id);
    setPosts(p => p.filter(post => post.id !== id));
    toast.success('Post removed');
  };

  const handleMarkDone = async (id: string) => {
    await supabase.from('scheduled_posts').update({ status: 'published' }).eq('id', id);
    setPosts(p => p.map(post => post.id === id ? { ...post, status: 'published' } : post));
    toast.success('Marked as published');
  };

  const upcoming = posts.filter(p => p.status === 'scheduled');
  const published = posts.filter(p => p.status === 'published');

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-border/40 px-5 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20">
              <CalendarDays className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground font-display">Social Scheduler</h2>
              <p className="text-[9px] text-muted-foreground font-mono">{upcoming.length} scheduled · {published.length} published</p>
            </div>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1.5 text-[10px] font-medium text-primary hover:bg-primary/20 transition-all">
            <Plus className="h-3 w-3" /> New Post
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* New Post Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1 block">Platform</label>
                <div className="flex flex-wrap gap-1">
                  {PLATFORMS_LIST.map(p => (
                    <button key={p} onClick={() => setFormPlatform(p)}
                      className={cn('rounded-full px-2.5 py-0.5 text-[9px] font-medium border transition-all',
                        formPlatform === p ? 'bg-primary/15 border-primary/30 text-primary' : 'border-border/50 text-muted-foreground hover:border-border'
                      )}>{p}</button>
                  ))}
                </div>
              </div>
              <textarea value={formContent} onChange={e => setFormContent(e.target.value)} placeholder="Post content..."
                rows={3} className="w-full rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 focus:border-primary/40 focus:outline-none resize-none" />
              <input value={formHashtags} onChange={e => setFormHashtags(e.target.value)} placeholder="#marketing #ai #content"
                className="w-full rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 focus:border-primary/40 focus:outline-none" />
              <div className="flex gap-2">
                <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
                  className="flex-1 rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-xs text-foreground focus:border-primary/40 focus:outline-none" />
                <input type="time" value={formTime} onChange={e => setFormTime(e.target.value)}
                  className="w-24 rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-xs text-foreground focus:border-primary/40 focus:outline-none" />
              </div>
              <button onClick={handleCreate} disabled={!formContent.trim() || !formDate || saving}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-2 text-xs font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50 transition-all">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Schedule Post
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div>
            <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
              <Clock className="h-3 w-3" /> Upcoming ({upcoming.length})
            </h3>
            <div className="space-y-2">
              {upcoming.map(post => {
                const PlatIcon = PLATFORM_ICONS[post.platform] || Globe;
                return (
                  <motion.div key={post.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    className="rounded-xl border border-border/50 bg-card/50 p-3 group">
                    <div className="flex items-start gap-2">
                      <PlatIcon className={cn('h-4 w-4 mt-0.5 shrink-0', PLATFORM_COLORS[post.platform] || 'text-foreground')} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-semibold text-foreground">{post.platform}</span>
                          <span className="text-[9px] text-muted-foreground font-mono">
                            {new Date(post.scheduled_at).toLocaleDateString()} {new Date(post.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[10px] text-foreground leading-relaxed line-clamp-3">{post.content}</p>
                        {post.hashtags && post.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {post.hashtags.map((h, i) => (
                              <span key={i} className="text-[8px] text-primary/60 font-mono">{h}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleMarkDone(post.id)} className="rounded-lg px-2 py-1 text-[9px] text-green-400 hover:bg-green-500/10 transition-all">
                        <CheckCircle className="h-3 w-3" />
                      </button>
                      <button onClick={() => handleDelete(post.id)} className="rounded-lg px-2 py-1 text-[9px] text-destructive hover:bg-destructive/10 transition-all">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Published */}
        {published.length > 0 && (
          <div>
            <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-400" /> Published ({published.length})
            </h3>
            <div className="space-y-1.5">
              {published.slice(0, 10).map(post => (
                <div key={post.id} className="flex items-center justify-between rounded-lg border border-border/30 bg-card/30 px-3 py-2 group">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={cn('text-[10px] font-medium', PLATFORM_COLORS[post.platform])}>{post.platform}</span>
                    <span className="text-[9px] text-muted-foreground truncate">{post.content.slice(0, 50)}...</span>
                  </div>
                  <button onClick={() => handleDelete(post.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                    <Trash2 className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {posts.length === 0 && !showForm && (
          <div className="text-center py-12">
            <CalendarDays className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">No scheduled posts yet</p>
            <p className="text-xs text-muted-foreground mb-4">Plan your content calendar with scheduled posts</p>
            <button onClick={() => setShowForm(true)}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:brightness-110 transition-all">
              Schedule Your First Post
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
