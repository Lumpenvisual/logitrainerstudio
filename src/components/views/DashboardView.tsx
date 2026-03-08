import { useAPIStore } from '@/store/useAPIStore';
import { useAlertStore } from '@/store/useAlertStore';
import { useProjectStore } from '@/store/useProjectStore';
import {
  BarChart3, Activity, Clock, AlertTriangle, CheckCircle, XCircle,
  Zap, TrendingUp, Cpu, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend
} from 'recharts';

const COLORS = {
  primary: 'hsl(250, 95%, 64%)',
  success: 'hsl(155, 75%, 45%)',
  warning: 'hsl(40, 95%, 55%)',
  destructive: 'hsl(0, 72%, 55%)',
  muted: 'hsl(225, 15%, 35%)',
};

function StatCard({ icon: Icon, label, value, subValue, color, trend }: {
  icon: typeof BarChart3; label: string; value: string | number; subValue?: string; color: string; trend?: 'up' | 'down' | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card/50 p-4 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-${color}/10 border border-${color}/20`}>
          <Icon className={`h-4 w-4 text-${color}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-0.5 text-[10px] font-mono ${trend === 'up' ? 'text-success' : 'text-destructive'}`}>
            {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold font-mono text-foreground tracking-tight">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{label}</p>
      {subValue && <p className="text-[10px] text-muted-foreground/50 font-mono mt-0.5">{subValue}</p>}
    </motion.div>
  );
}

export function DashboardView() {
  const { callLogs, totalCalls, totalErrors, avgLatency } = useAPIStore();
  const { alerts } = useAlertStore();
  const { scenes } = useProjectStore();

  const successRate = totalCalls > 0 ? Math.round(((totalCalls - totalErrors) / totalCalls) * 100) : 0;

  // Build time-series data from call logs
  const timeSeriesData = useMemo(() => {
    const buckets: Record<string, { time: string; calls: number; errors: number; latency: number; count: number }> = {};
    callLogs.forEach((log) => {
      const d = new Date(log.timestamp);
      const key = `${d.getHours().toString().padStart(2, '0')}:${(Math.floor(d.getMinutes() / 5) * 5).toString().padStart(2, '0')}`;
      if (!buckets[key]) buckets[key] = { time: key, calls: 0, errors: 0, latency: 0, count: 0 };
      buckets[key].calls++;
      if (log.status === 'error') buckets[key].errors++;
      buckets[key].latency += log.latencyMs;
      buckets[key].count++;
    });
    return Object.values(buckets)
      .map((b) => ({ ...b, latency: b.count > 0 ? Math.round(b.latency / b.count) : 0 }))
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [callLogs]);

  // Provider breakdown
  const providerData = useMemo(() => {
    const map: Record<string, { name: string; calls: number; errors: number; avgLatency: number; totalLatency: number }> = {};
    callLogs.forEach((log) => {
      const provider = log.model.split('/')[0] || 'unknown';
      if (!map[provider]) map[provider] = { name: provider, calls: 0, errors: 0, avgLatency: 0, totalLatency: 0 };
      map[provider].calls++;
      if (log.status === 'error') map[provider].errors++;
      map[provider].totalLatency += log.latencyMs;
    });
    return Object.values(map).map((p) => ({
      ...p,
      avgLatency: p.calls > 0 ? Math.round(p.totalLatency / p.calls) : 0,
      successRate: p.calls > 0 ? Math.round(((p.calls - p.errors) / p.calls) * 100) : 0,
    }));
  }, [callLogs]);

  // Function breakdown for pie chart
  const functionData = useMemo(() => {
    const map: Record<string, number> = {};
    callLogs.forEach((log) => {
      map[log.function] = (map[log.function] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [callLogs]);

  const pieColors = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.destructive, COLORS.muted];

  const customTooltipStyle = {
    backgroundColor: 'hsl(230, 20%, 8%)',
    border: '1px solid hsl(230, 15%, 18%)',
    borderRadius: '8px',
    fontSize: '11px',
    color: 'hsl(220, 20%, 95%)',
  };

  return (
    <div className="flex h-full flex-col overflow-auto">
      {/* Header */}
      <div className="border-b border-border p-5">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="font-display text-base font-bold text-foreground">Observability Dashboard</h2>
          <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[9px] font-mono font-bold text-primary tracking-wider">
            LIVE
          </span>
        </div>
        <p className="text-xs text-muted-foreground/60">Real-time monitoring of API performance, costs, and system health.</p>
      </div>

      <div className="p-5 space-y-5">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={BarChart3} label="Total API Calls" value={totalCalls} color="primary" />
          <StatCard icon={CheckCircle} label="Success Rate" value={`${successRate}%`} subValue={`${totalErrors} errors`} color="success" trend={successRate >= 95 ? 'up' : successRate < 80 ? 'down' : null} />
          <StatCard icon={Clock} label="Avg Latency" value={avgLatency > 0 ? `${avgLatency}ms` : '—'} color="warning" trend={avgLatency > 5000 ? 'down' : avgLatency > 0 ? 'up' : null} />
          <StatCard icon={AlertTriangle} label="Active Alerts" value={alerts.filter((a) => !a.is_dismissed).length} subValue={`${alerts.filter((a) => !a.is_read).length} unread`} color="destructive" />
        </div>

        {/* Charts Row */}
        {callLogs.length > 0 ? (
          <div className="grid lg:grid-cols-2 gap-5">
            {/* API Calls Over Time */}
            <div className="rounded-xl border border-border bg-card/50 p-4">
              <h3 className="text-xs font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                API Calls Over Time
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 15%, 15%)" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'hsl(225, 15%, 45%)' }} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(225, 15%, 45%)' }} axisLine={false} />
                  <RechartsTooltip contentStyle={customTooltipStyle} />
                  <Area type="monotone" dataKey="calls" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.15} strokeWidth={2} />
                  <Area type="monotone" dataKey="errors" stroke={COLORS.destructive} fill={COLORS.destructive} fillOpacity={0.1} strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Latency by Provider */}
            <div className="rounded-xl border border-border bg-card/50 p-4">
              <h3 className="text-xs font-semibold text-foreground mb-4 flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-warning" />
                Avg Latency by Provider
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={providerData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 15%, 15%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(225, 15%, 45%)' }} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(225, 15%, 45%)' }} axisLine={false} unit="ms" />
                  <RechartsTooltip contentStyle={customTooltipStyle} />
                  <Bar dataKey="avgLatency" fill={COLORS.warning} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Function Distribution */}
            <div className="rounded-xl border border-border bg-card/50 p-4">
              <h3 className="text-xs font-semibold text-foreground mb-4 flex items-center gap-2">
                <Cpu className="h-3.5 w-3.5 text-success" />
                Calls by Function
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={functionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {functionData.map((_, i) => (
                      <Cell key={i} fill={pieColors[i % pieColors.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={customTooltipStyle} />
                  <Legend
                    formatter={(value) => <span style={{ color: 'hsl(225, 15%, 55%)', fontSize: '10px' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Provider Performance Table */}
            <div className="rounded-xl border border-border bg-card/50 p-4">
              <h3 className="text-xs font-semibold text-foreground mb-4 flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-primary" />
                Provider Performance
              </h3>
              <div className="space-y-2">
                {providerData.map((p) => (
                  <div key={p.name} className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/30 px-3 py-2.5">
                    <span className="text-xs font-semibold text-foreground capitalize w-20 truncate font-display">{p.name}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-success to-primary transition-all"
                            style={{ width: `${p.successRate}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground w-8">{p.successRate}%</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-muted-foreground">{p.calls} calls</span>
                      <span className="text-[10px] font-mono text-muted-foreground/50 ml-2">~{p.avgLatency}ms</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="rounded-2xl bg-primary/5 border border-primary/10 p-6 mb-4">
              <BarChart3 className="h-12 w-12 text-primary/30" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">No data yet</h3>
            <p className="text-sm text-muted-foreground/50 max-w-sm text-center">
              Start generating scripts, images, or chatting with the Neural Assistant. API metrics will appear here in real-time.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
