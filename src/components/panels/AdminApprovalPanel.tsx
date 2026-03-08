import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CheckCircle, XCircle, Clock, User, Loader2, RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface ApprovalUser {
  user_id: string;
  status: string;
  email?: string;
  display_name?: string;
  avatar_url?: string;
  created_at: string;
  reviewed_at?: string;
}

export function AdminApprovalPanel({ onClose }: { onClose: () => void }) {
  const [users, setUsers] = useState<ApprovalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-approve-user', {
        body: { action: 'list' },
      });
      if (error) throw error;
      setUsers(data.data || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleAction = async (userId: string, action: 'approve' | 'reject') => {
    setActing(userId);
    try {
      const { error } = await supabase.functions.invoke('admin-approve-user', {
        body: { action, user_id: userId },
      });
      if (error) throw error;
      toast.success(`User ${action === 'approve' ? 'approved' : 'rejected'}`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    } finally {
      setActing(null);
    }
  };

  const filtered = users.filter(u => filter === 'all' || u.status === filter);

  const statusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

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
        className="w-full max-w-2xl max-h-[80vh] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">User Approvals</h2>
              <p className="text-xs text-muted-foreground">{users.filter(u => u.status === 'pending').length} pending</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchUsers} className="rounded-lg p-2 text-muted-foreground hover:bg-muted/50 transition-colors">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted/50 transition-colors text-lg">✕</button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-1 p-3 border-b border-border">
          {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                filter === f ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-muted/50'
              }`}
            >
              {f} {f !== 'all' && `(${users.filter(u => u.status === f).length})`}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="overflow-y-auto max-h-[55vh] p-3 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No users found</div>
          ) : (
            <AnimatePresence>
              {filtered.map(user => (
                <motion.div
                  key={user.user_id}
                  layout
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/50 p-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{user.display_name || 'No name'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusIcon(user.status)}
                    <span className="text-xs text-muted-foreground capitalize">{user.status}</span>
                  </div>
                  {user.status === 'pending' && (
                    <div className="flex gap-1.5 ml-2">
                      <button
                        onClick={() => handleAction(user.user_id, 'approve')}
                        disabled={acting === user.user_id}
                        className="rounded-lg bg-green-500/15 px-3 py-1.5 text-xs font-medium text-green-500 hover:bg-green-500/25 transition-colors disabled:opacity-50"
                      >
                        {acting === user.user_id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleAction(user.user_id, 'reject')}
                        disabled={acting === user.user_id}
                        className="rounded-lg bg-destructive/15 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/25 transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
