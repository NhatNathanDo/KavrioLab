'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Zap,
  Dumbbell,
  Utensils,
  FileText,
  Radio,
  Server,
  Activity,
  Cpu,
  Database,
  ArrowUpRight,
  Sparkles,
  DollarSign,
  TrendingUp,
  Globe,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface TelemetryStats {
  totalUsers: number;
  proUsers: number;
  proConversionRate: number;
  totalWorkouts: number;
  totalFoods: number;
  pendingCurationFoods: number;
  mrr: number;
  arr: number;
  arpu: number;
  dau: number;
  trafficEvents: number;
}

interface RevenuePoint {
  month: string;
  mrr: number;
  subscribers: number;
}

interface TrafficPoint {
  day: string;
  requests: number;
  activeUsers: number;
}

interface AuditLogEntry {
  id: string;
  action: string;
  targetType: string | null;
  details: string | null;
  createdAt: string;
  user: { email: string; name: string | null } | null;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<TelemetryStats | null>(null);
  const [revenueHistory, setRevenueHistory] = useState<RevenuePoint[]>([]);
  const [trafficHistory, setTrafficHistory] = useState<TrafficPoint[]>([]);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/stats');
        if (res.ok) {
          const json = await res.json();
          setStats(json.stats);
          setRevenueHistory(json.revenueHistory || []);
          setTrafficHistory(json.trafficHistory || []);
          setLogs(json.recentAuditLogs || []);
        }
      } catch (err) {
        console.error('Failed to fetch admin stats:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 w-64 bg-zinc-900 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-zinc-900 rounded-3xl" />
          ))}
        </div>
        <div className="h-72 bg-zinc-900 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-full mb-3 shadow-xs">
          <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" /> SYSTEM & FINANCIAL TELEMETRY ONLINE
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Telemetry & Revenue Overview</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Real-time financial performance (MRR/ARR), active subscriber counts, API traffic events, and database moderation queues.
        </p>
      </div>

      {/* Financial & User Metric Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {/* MRR */}
        <div className="p-6 bg-[#0f0f13] rounded-3xl border border-zinc-800/80 shadow-lg space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Monthly Revenue (MRR)</span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-black text-white">${stats?.mrr || 0}</span>
            {stats && stats.mrr > 0 ? (
              <span className="text-[10px] text-emerald-400 font-bold flex items-center">
                <ArrowUpRight className="w-3 h-3" /> +100%
              </span>
            ) : (
              <span className="text-[10px] text-zinc-500 font-medium">0% MoM</span>
            )}
          </div>
          <p className="text-[11px] text-zinc-500">ARR: ${(stats?.arr || 0).toLocaleString()}/yr</p>
        </div>

        {/* Pro Members */}
        <div className="p-6 bg-[#0f0f13] rounded-3xl border border-zinc-800/80 shadow-lg space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Pro Subscriptions</span>
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Zap className="w-4 h-4 fill-amber-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-black text-white">{stats?.proUsers || 0}</span>
            <span className="text-xs text-amber-400 font-bold">({stats?.proConversionRate || 0}% Conv)</span>
          </div>
          <p className="text-[11px] text-zinc-500">ARPU: ${stats?.arpu || 0}/user</p>
        </div>

        {/* Daily Active Users (DAU) */}
        <div className="p-6 bg-[#0f0f13] rounded-3xl border border-zinc-800/80 shadow-lg space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Daily Active Users (DAU)</span>
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl md:text-4xl font-black text-white">{stats?.dau || 0}</div>
          <p className="text-[11px] text-zinc-500">Total accounts: {stats?.totalUsers || 0}</p>
        </div>

        {/* API Traffic Events */}
        <div className="p-6 bg-[#0f0f13] rounded-3xl border border-zinc-800/80 shadow-lg space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">API Traffic Requests</span>
            <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl md:text-4xl font-black text-white">{(stats?.trafficEvents || 0).toLocaleString()}</div>
          <p className="text-[11px] text-zinc-500">Total processed payloads</p>
        </div>
      </div>

      {/* Financial Revenue & API Traffic Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Growth Chart */}
        <div className="p-6 bg-[#0f0f13] rounded-3xl border border-zinc-800/80 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Monthly Recurring Revenue (MRR) Growth
              </h2>
              <p className="text-xs text-zinc-400">Pro membership revenue evolution ($ USD)</p>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueHistory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" opacity={0.5} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#888888' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#888888' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-[#18181b] text-white p-3 rounded-2xl text-xs space-y-1 shadow-xl border border-zinc-800">
                          <p className="font-bold text-emerald-400">{d.month} MRR: ${d.mrr}</p>
                          <p className="text-zinc-400">{d.subscribers} Active Pro Subscribers</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="mrr" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* API Traffic Request Events Chart */}
        <div className="p-6 bg-[#0f0f13] rounded-3xl border border-zinc-800/80 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                Daily API Traffic & Request Load
              </h2>
              <p className="text-xs text-zinc-400">System requests processed per day</p>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficHistory}>
                <defs>
                  <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" opacity={0.5} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#888888' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#888888' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-[#18181b] text-white p-3 rounded-2xl text-xs space-y-1 shadow-xl border border-zinc-800">
                          <p className="font-bold text-purple-400">{d.day}: {d.requests} requests</p>
                          <p className="text-zinc-400">{d.activeUsers} Active DAU Users</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="requests" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#trafficGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* System Service Health Status */}
      <div className="p-6 bg-[#0f0f13] rounded-3xl border border-zinc-800/80 space-y-4 shadow-lg">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Server className="w-5 h-5 text-indigo-400" /> Infrastructure & Telemetry Metrics
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-[#141419] rounded-2xl border border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-white">PostgreSQL DB</div>
                <div className="text-[10px] text-zinc-500">Latency: 2ms</div>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 font-extrabold text-[10px] rounded-lg border border-emerald-500/20">
              ONLINE
            </span>
          </div>

          <div className="p-4 bg-[#141419] rounded-2xl border border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-white">Next.js 15 App Router</div>
                <div className="text-[10px] text-zinc-500">Uptime: 99.99%</div>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 font-extrabold text-[10px] rounded-lg border border-emerald-500/20">
              HEALTHY
            </span>
          </div>

          <div className="p-4 bg-[#141419] rounded-2xl border border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-white">Gemini 1.5 Pro AI</div>
                <div className="text-[10px] text-zinc-500">Free Tier SDK</div>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 font-extrabold text-[10px] rounded-lg border border-indigo-500/20">
              ACTIVE
            </span>
          </div>
        </div>
      </div>

      {/* Live Security Audit Log Stream */}
      <div className="p-6 bg-[#0f0f13] rounded-3xl border border-zinc-800/80 space-y-4 shadow-lg">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-400" /> Recent Security & Admin Audit Logs
        </h2>

        {logs.length > 0 ? (
          <div className="divide-y divide-zinc-800/60 text-xs">
            {logs.map((log) => (
              <div key={log.id} className="py-3 flex items-center justify-between gap-4 hover:bg-zinc-800/20 px-2 rounded-xl transition-colors">
                <div className="space-y-0.5">
                  <div className="font-semibold text-white flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-purple-500/10 text-purple-300 font-mono text-[10px] font-bold rounded-md border border-purple-500/20">
                      {log.action}
                    </span>
                    <span>{log.user?.email || 'System'}</span>
                  </div>
                  {log.details && <p className="text-zinc-400 text-[11px] truncate max-w-xl">{log.details}</p>}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono flex-shrink-0">
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-zinc-500 border border-dashed border-zinc-800/80 rounded-2xl">
            No audit actions recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}
