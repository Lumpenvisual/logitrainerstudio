import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, Copy, CheckCircle, Users, Share2, Trophy, Loader2, Star, Zap, Crown, Medal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function ReferralPanel() {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [usesCount, setUsesCount] = useState(0);
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'tiers' | 'share'>('overview');

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data: codes } = await supabase.from('referral_codes').select('*').eq('user_id', user.id).limit(1);
      if (codes && codes.length > 0) { setReferralCode(codes[0].code); setUsesCount(codes[0].uses_count); }
      const { data: rw } = await supabase.from('referral_rewards').select('*').eq('referrer_id', user.id);
      if (rw) setRewards(rw);
      setLoading(false);
    };
    load();
  }, [user]);

  const shareUrl = `${window.location.origin}/auth?ref=${referralCode}`;

  const copyCode = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast.success('Referral code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = (platform?: string) => {
    const text = `🚀 Join LogiTrainer AI Studio — the all-in-one AI marketing & video platform! Use my code: ${referralCode}`;
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(shareUrl);

    if (platform === 'twitter') window.open(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, '_blank');
    else if (platform === 'whatsapp') window.open(`https://wa.me/?text=${encodedText}%20${encodedUrl}`, '_blank');
    else if (platform === 'linkedin') window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, '_blank');
    else if (platform === 'email') window.open(`mailto:?subject=${encodeURIComponent('Join LogiTrainer AI Studio')}&body=${encodedText}%0A${encodedUrl}`);
    else if (navigator.share) navigator.share({ title: 'Join LogiTrainer AI Studio', text, url: shareUrl });
    else { navigator.clipboard.writeText(shareUrl); toast.success('Share link copied!'); }
  };

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  const tiers = [
    { referrals: 1, reward: 'Early Supporter Badge', icon: Medal, color: 'text-amber-400', reached: usesCount >= 1, benefit: 'Profile badge + recognition' },
    { referrals: 3, reward: 'Pro Creator', icon: Star, color: 'text-blue-400', reached: usesCount >= 3, benefit: 'Priority support + extended AI limits' },
    { referrals: 10, reward: 'Power Marketer', icon: Zap, color: 'text-purple-400', reached: usesCount >= 10, benefit: 'Unlimited AI generations for 30 days' },
    { referrals: 25, reward: 'Growth Leader', icon: Trophy, color: 'text-orange-400', reached: usesCount >= 25, benefit: 'All premium features unlocked' },
    { referrals: 50, reward: 'VIP Ambassador', icon: Crown, color: 'text-yellow-400', reached: usesCount >= 50, benefit: 'Lifetime VIP + revenue share' },
  ];
  const currentTier = tiers.filter(t => t.reached).pop();
  const nextTier = tiers.find(t => !t.reached);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-border/40 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20">
            <Gift className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground font-display">Referral Program</h2>
            <p className="text-[9px] text-muted-foreground font-mono">Both you AND your friend earn rewards</p>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex border-b border-border/40">
        {(['overview', 'tiers', 'share'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn('flex-1 py-2 text-[10px] font-medium uppercase tracking-wider transition-all',
              activeTab === tab ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground'
            )}>{tab}</button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {activeTab === 'overview' && (
          <>
            {/* Referral Code Card */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-5">
              <p className="text-[9px] font-mono text-amber-400/60 uppercase tracking-wider mb-2">Your Referral Code</p>
              <div className="flex items-center gap-3">
                <span className="font-mono text-2xl font-bold text-foreground tracking-[0.15em] flex-1">{referralCode || '—'}</span>
                <button onClick={copyCode}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition-all">
                  {copied ? <CheckCircle className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-border/50 bg-card/50 p-3 text-center">
                <Users className="h-4 w-4 text-primary mx-auto mb-1" />
                <p className="font-mono text-xl font-bold text-foreground">{usesCount}</p>
                <p className="text-[8px] text-muted-foreground uppercase">Referrals</p>
              </div>
              <div className="rounded-xl border border-border/50 bg-card/50 p-3 text-center">
                <Trophy className="h-4 w-4 text-amber-400 mx-auto mb-1" />
                <p className="font-mono text-xl font-bold text-foreground">{tiers.filter(t => t.reached).length}</p>
                <p className="text-[8px] text-muted-foreground uppercase">Tiers</p>
              </div>
              <div className="rounded-xl border border-border/50 bg-card/50 p-3 text-center">
                <Gift className="h-4 w-4 text-green-400 mx-auto mb-1" />
                <p className="font-mono text-xl font-bold text-foreground">{rewards.length}</p>
                <p className="text-[8px] text-muted-foreground uppercase">Rewards</p>
              </div>
            </div>

            {/* Current tier */}
            {currentTier && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-center gap-3">
                <currentTier.icon className={cn('h-6 w-6', currentTier.color)} />
                <div>
                  <p className="text-xs font-bold text-foreground">{currentTier.reward}</p>
                  <p className="text-[9px] text-muted-foreground">{currentTier.benefit}</p>
                </div>
              </div>
            )}

            {/* Progress to next tier */}
            {nextTier && (
              <div className="rounded-xl border border-border/30 bg-card/30 p-3">
                <div className="flex justify-between text-[10px] mb-1.5">
                  <span className="text-muted-foreground">Next: <strong className="text-foreground">{nextTier.reward}</strong></span>
                  <span className="font-mono text-primary">{usesCount}/{nextTier.referrals}</span>
                </div>
                <div className="h-2 rounded-full bg-border overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (usesCount / nextTier.referrals) * 100)}%` }}
                    transition={{ duration: 1 }}
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400" />
                </div>
                <p className="text-[9px] text-muted-foreground mt-1">{nextTier.referrals - usesCount} more referral{nextTier.referrals - usesCount !== 1 ? 's' : ''} to unlock</p>
              </div>
            )}

            {/* Double reward callout */}
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-3">
              <p className="text-[10px] font-bold text-green-400 mb-1">🎉 Double Reward System</p>
              <p className="text-[9px] text-muted-foreground leading-relaxed">
                When someone uses your code, <strong className="text-foreground">both of you</strong> earn rewards. Your friend gets priority access and you climb the tier ladder!
              </p>
            </div>
          </>
        )}

        {activeTab === 'tiers' && (
          <div className="space-y-2">
            {tiers.map((tier, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className={cn('rounded-xl border p-4 transition-all', tier.reached ? 'border-green-500/30 bg-green-500/5' : 'border-border/40 bg-card/20')}>
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', tier.reached ? 'bg-green-500/15' : 'bg-card')}>
                    <tier.icon className={cn('h-5 w-5', tier.reached ? 'text-green-400' : tier.color)} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-foreground">{tier.reward}</p>
                      {tier.reached && <CheckCircle className="h-3 w-3 text-green-400" />}
                    </div>
                    <p className="text-[9px] text-muted-foreground">{tier.benefit}</p>
                    <p className="text-[8px] text-primary/50 font-mono mt-0.5">{tier.referrals} referral{tier.referrals > 1 ? 's' : ''} needed</p>
                  </div>
                  {!tier.reached && (
                    <div className="w-12 text-right">
                      <p className="text-[10px] font-mono text-muted-foreground">{Math.max(0, tier.referrals - usesCount)}</p>
                      <p className="text-[7px] text-muted-foreground/50">to go</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'share' && (
          <div className="space-y-4">
            {/* Share link */}
            <div className="rounded-xl border border-border/50 bg-card/50 p-4">
              <p className="text-[10px] font-bold text-foreground mb-2">Your Share Link</p>
              <div className="flex items-center gap-2">
                <input readOnly value={shareUrl} className="flex-1 rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-[10px] font-mono text-foreground" />
                <button onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success('Link copied!'); }}
                  className="shrink-0 rounded-lg bg-primary/10 border border-primary/20 p-2 text-primary hover:bg-primary/20 transition-all">
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Social share buttons */}
            <div>
              <p className="text-[10px] font-bold text-foreground mb-2">Share on</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'Twitter/X', action: () => shareLink('twitter'), emoji: '🐦' },
                  { name: 'WhatsApp', action: () => shareLink('whatsapp'), emoji: '💬' },
                  { name: 'LinkedIn', action: () => shareLink('linkedin'), emoji: '💼' },
                  { name: 'Email', action: () => shareLink('email'), emoji: '📧' },
                ].map(s => (
                  <button key={s.name} onClick={s.action}
                    className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/50 p-3 text-xs font-medium text-foreground hover:border-primary/30 hover:bg-card transition-all">
                    <span className="text-base">{s.emoji}</span>{s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Pre-written messages */}
            <div className="rounded-xl border border-border/50 bg-card/50 p-4">
              <p className="text-[10px] font-bold text-foreground mb-2">Quick Share Messages</p>
              <div className="space-y-2">
                {[
                  `🚀 I'm using LogiTrainer AI Studio to create marketing content 10x faster. Try it with my code: ${referralCode}`,
                  `🎬 Best AI tool for video + marketing I've found. Free to join: ${shareUrl}`,
                  `💡 This AI platform generates ad copy, email sequences, landing pages, and videos — all in one place. Use code ${referralCode} for priority access!`,
                ].map((msg, i) => (
                  <div key={i} className="rounded-lg border border-border/30 bg-background/50 p-2.5 group">
                    <p className="text-[9px] text-foreground leading-relaxed">{msg}</p>
                    <button onClick={() => handleCopy(msg)}
                      className="mt-1.5 text-[8px] text-primary hover:text-primary/80 font-medium opacity-0 group-hover:opacity-100 transition-all">
                      Copy message
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  }
}
