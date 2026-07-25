import React from 'react';
import Link from 'next/link';
import { getAdminUser } from '@/lib/auth/admin';
import {
  ShieldAlert,
  BarChart3,
  Users,
  Utensils,
  FileText,
  ArrowLeft,
  ShieldCheck,
  Radio,
  Sparkles,
  Zap,
  Globe,
  Bell,
  Search,
} from 'lucide-react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminUser = await getAdminUser();

  if (!adminUser) {
    return (
      <div className="min-h-screen bg-[#0f0f12] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="p-5 rounded-3xl bg-rose-950/50 text-rose-400 mb-4 border border-rose-800/50 shadow-2xl backdrop-blur-md">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">403 — Access Restricted</h1>
        <p className="text-sm text-zinc-400 mt-2 max-w-md">
          This internal administration platform requires verified Administrator credentials.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-2xl transition-all border border-zinc-700 shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" /> Return to KavrioLab App
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0b0e] text-zinc-100 flex font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Admin Sidebar Navigation */}
      <aside className="w-64 bg-[#0f0f12] border-r border-zinc-800/80 p-6 flex flex-col justify-between flex-shrink-0 sticky top-0 h-screen overflow-y-auto">
        <div className="space-y-8">
          {/* Admin HQ Header */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 border border-indigo-500/30 shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="font-black text-sm text-white tracking-tight flex items-center gap-1.5">
                KavrioLab OS
                <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 text-[9px] font-mono rounded-md border border-indigo-500/30">
                  HQ
                </span>
              </div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 flex items-center gap-1 mt-0.5">
                <Radio className="w-3 h-3 animate-pulse text-emerald-400" /> SYSTEM ADMIN
              </div>
            </div>
          </div>

          {/* Navigation Group */}
          <div className="space-y-6">
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-3.5 mb-2">
                Core Operations
              </div>
              <Link
                href="/admin"
                className="flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-2xl text-zinc-300 hover:bg-zinc-800/80 hover:text-white transition-all border border-transparent hover:border-zinc-700/50"
              >
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                Telemetry & Revenue
              </Link>
              <Link
                href="/admin/users"
                className="flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-2xl text-zinc-300 hover:bg-zinc-800/80 hover:text-white transition-all border border-transparent hover:border-zinc-700/50"
              >
                <Users className="w-4 h-4 text-emerald-400" />
                User Moderation
              </Link>
              <Link
                href="/admin/curation"
                className="flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-2xl text-zinc-300 hover:bg-zinc-800/80 hover:text-white transition-all border border-transparent hover:border-zinc-700/50"
              >
                <Utensils className="w-4 h-4 text-amber-400" />
                Food Curation Queue
              </Link>
              <Link
                href="/admin/audit-logs"
                className="flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-2xl text-zinc-300 hover:bg-zinc-800/80 hover:text-white transition-all border border-transparent hover:border-zinc-700/50"
              >
                <FileText className="w-4 h-4 text-purple-400" />
                Audit Log Explorer
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Admin User Info */}
        <div className="pt-6 border-t border-zinc-800/80 space-y-3">
          <div className="p-3 bg-[#141419] rounded-2xl border border-zinc-800/80">
            <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Admin Account</div>
            <div className="text-xs text-zinc-200 font-bold truncate mt-0.5">{adminUser.email}</div>
          </div>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-2xl transition-all border border-zinc-700/80 shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to App
          </Link>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 bg-[#0f0f12]/90 backdrop-blur-md border-b border-zinc-800/80 px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 font-mono text-xs font-bold rounded-full border border-indigo-500/20">
              KavrioLab OS v1.0.0
            </span>
            <span className="text-xs text-zinc-500">|</span>
            <span className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-400" /> Production Environment
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#141419] rounded-xl border border-zinc-800 text-xs text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>DB Latency: 2ms</span>
            </div>

            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-xs shadow-md">
              {adminUser.email.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content Centered Viewport */}
        <main className="flex-1 p-8 md:p-12 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
