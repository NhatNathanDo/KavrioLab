'use client';

import React, { useState, useEffect } from 'react';
import PortalModal from '@/components/shared/PortalModal';
import {
  Users,
  Search,
  Shield,
  Zap,
  Eye,
  X,
  Dumbbell,
  Utensils,
  Scale,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Activity,
  Layers,
} from 'lucide-react';

interface UserRecord {
  id: string;
  name: string | null;
  email: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  isPro: boolean;
  createdAt: string;
}

interface DebugUserDetail {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isPro: boolean;
  createdAt: string;
  profile: {
    targetCalories: number;
    targetProtein: number;
    targetCarbs: number;
    targetFat: number;
    unitSystem: string;
    activityTier: string;
  } | null;
  _count: {
    workoutLogs: number;
    nutritionLogs: number;
    weightLogs: number;
    bodyMeasurements: number;
    progressPhotos: number;
    habits: number;
  };
  workoutLogs: Array<{
    id: string;
    name: string;
    startedAt: string;
    completedAt: string | null;
  }>;
  weightLogs: Array<{
    id: string;
    weightKg: number;
    loggedAt: string;
  }>;
}

export default function UserModerationPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Debug Inspection Modal State
  const [debugUser, setDebugUser] = useState<DebugUserDetail | null>(null);
  const [isDebugLoading, setIsDebugLoading] = useState(false);

  const fetchUsers = async (q = '') => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const json = await res.json();
        setUsers(json.users || []);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetchUsers(search);
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) {
        setActionMessage(`Updated role for user to ${newRole}`);
        fetchUsers(search);
      }
    } catch (err) {
      console.error('Failed to update role:', err);
    }
  };

  const handleTogglePro = async (userId: string, currentPro: boolean) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isPro: !currentPro }),
      });
      if (res.ok) {
        setActionMessage(`Updated Pro status for user to ${!currentPro ? 'Pro' : 'Free'}`);
        fetchUsers(search);
      }
    } catch (err) {
      console.error('Failed to update pro status:', err);
    }
  };

  const handleOpenDebugLog = async (user: UserRecord) => {
    setIsDebugLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`);
      if (res.ok) {
        const json = await res.json();
        setDebugUser(json.user);
        setActionMessage(`Audit logged debug inspection for ${user.email}`);
      }
    } catch (err) {
      console.error('Failed to inspect user:', err);
    } finally {
      setIsDebugLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <Users className="w-8 h-8 text-emerald-400" /> User Moderation & Live Debug State
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Search platform accounts, grant/revoke Admin privileges, toggle Pro memberships, and inspect live database state.
        </p>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search users by email or display name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#0f0f13] border border-zinc-800 rounded-2xl text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-indigo-500"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl transition-colors cursor-pointer shadow-md"
        >
          Search
        </button>
      </form>

      {/* Users Table */}
      <div className="bg-[#0f0f13] rounded-3xl border border-zinc-800/80 overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-zinc-500 animate-pulse">Loading user records...</div>
        ) : users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#09090b] text-zinc-400 uppercase tracking-wider text-[10px] border-b border-zinc-800/80">
                <tr>
                  <th className="py-3.5 px-6">User</th>
                  <th className="py-3.5 px-6">Role</th>
                  <th className="py-3.5 px-6">Membership</th>
                  <th className="py-3.5 px-6">Joined Date</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-4 px-6 font-medium text-white">
                      <div className="font-bold">{u.name || 'Unnamed User'}</div>
                      <div className="text-[11px] text-zinc-400">{u.email}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg ${
                          u.role === 'ADMIN' || u.role === 'SUPER_ADMIN'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {u.isPro ? (
                        <span className="px-2.5 py-1 text-[10px] font-black rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1">
                          <Zap className="w-3 h-3 fill-amber-300" /> PRO
                        </span>
                      ) : (
                        <span className="text-zinc-500 font-medium">Standard</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-zinc-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleToggleRole(u.id, u.role)}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl transition-colors text-[11px] font-semibold cursor-pointer"
                      >
                        <Shield className="w-3 h-3 inline mr-1" /> Toggle Admin
                      </button>
                      <button
                        onClick={() => handleTogglePro(u.id, u.isPro)}
                        className={`px-3 py-1.5 rounded-xl transition-colors text-[11px] font-semibold cursor-pointer ${
                          u.isPro
                            ? 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/50'
                            : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        <Zap className="w-3 h-3 inline mr-1" />
                        {u.isPro ? 'Demote to Free' : 'Promote to Pro'}
                      </button>
                      <button
                        onClick={() => handleOpenDebugLog(u)}
                        disabled={isDebugLoading}
                        className="px-3 py-1.5 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 rounded-xl transition-colors text-[11px] font-semibold border border-indigo-800/50 cursor-pointer disabled:opacity-50"
                      >
                        <Eye className="w-3 h-3 inline mr-1" /> Debug State
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-zinc-500">No users found.</div>
        )}
      </div>

      {/* Debug State Inspection Modal */}
      <PortalModal
        isOpen={!!debugUser}
        onClose={() => setDebugUser(null)}
        maxWidth="2xl"
        className="space-y-6 !bg-[#0f0f13]"
      >
        {debugUser && (
          <>
            <button
              onClick={() => setDebugUser(null)}
              className="absolute right-5 top-5 p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-mono font-bold rounded-full mb-2">
                <Activity className="w-3 h-3 animate-pulse" /> LIVE DEBUG STATE INSPECTION
              </div>
              <h2 className="text-xl font-extrabold text-white">{debugUser.name || 'Unnamed User'}</h2>
              <p className="text-xs text-zinc-400">{debugUser.email} · ID: {debugUser.id}</p>
            </div>

            {/* Profile Targets */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-zinc-950/60 rounded-2xl border border-zinc-800 text-center">
                <div className="text-[10px] font-bold text-zinc-500 uppercase">Target Calories</div>
                <div className="text-base font-black text-amber-400">
                  {debugUser.profile?.targetCalories || 2200} <span className="text-[10px] font-normal text-zinc-400">kcal</span>
                </div>
              </div>

              <div className="p-3 bg-zinc-950/60 rounded-2xl border border-zinc-800 text-center">
                <div className="text-[10px] font-bold text-zinc-500 uppercase">Target Macros (P/C/F)</div>
                <div className="text-xs font-black text-indigo-300 mt-1">
                  {Number(debugUser.profile?.targetProtein || 150)}g / {Number(debugUser.profile?.targetCarbs || 250)}g / {Number(debugUser.profile?.targetFat || 65)}g
                </div>
              </div>

              <div className="p-3 bg-zinc-950/60 rounded-2xl border border-zinc-800 text-center">
                <div className="text-[10px] font-bold text-zinc-500 uppercase">Role / Plan</div>
                <div className="text-xs font-bold text-emerald-400 mt-1">
                  {debugUser.role} ({debugUser.isPro ? 'PRO' : 'FREE'})
                </div>
              </div>

              <div className="p-3 bg-zinc-950/60 rounded-2xl border border-zinc-800 text-center">
                <div className="text-[10px] font-bold text-zinc-500 uppercase">Unit System</div>
                <div className="text-xs font-bold text-zinc-300 mt-1">
                  {debugUser.profile?.unitSystem || 'METRIC'}
                </div>
              </div>
            </div>

            {/* Database Counts Grid */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Database Record Counts</h3>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                <div className="p-2.5 bg-zinc-900 rounded-xl border border-zinc-800">
                  <div className="text-lg font-black text-white">{debugUser._count.workoutLogs}</div>
                  <div className="text-[9px] text-zinc-400">Workouts</div>
                </div>
                <div className="p-2.5 bg-zinc-900 rounded-xl border border-zinc-800">
                  <div className="text-lg font-black text-white">{debugUser._count.nutritionLogs}</div>
                  <div className="text-[9px] text-zinc-400">Nutrition</div>
                </div>
                <div className="p-2.5 bg-zinc-900 rounded-xl border border-zinc-800">
                  <div className="text-lg font-black text-white">{debugUser._count.weightLogs}</div>
                  <div className="text-[9px] text-zinc-400">Weight Logs</div>
                </div>
                <div className="p-2.5 bg-zinc-900 rounded-xl border border-zinc-800">
                  <div className="text-lg font-black text-white">{debugUser._count.bodyMeasurements}</div>
                  <div className="text-[9px] text-zinc-400">Measurements</div>
                </div>
                <div className="p-2.5 bg-zinc-900 rounded-xl border border-zinc-800">
                  <div className="text-lg font-black text-white">{debugUser._count.progressPhotos}</div>
                  <div className="text-[9px] text-zinc-400">Photos</div>
                </div>
                <div className="p-2.5 bg-zinc-900 rounded-xl border border-zinc-800">
                  <div className="text-lg font-black text-white">{debugUser._count.habits}</div>
                  <div className="text-[9px] text-zinc-400">Habits</div>
                </div>
              </div>
            </div>

            {/* Recent Workouts */}
            {debugUser.workoutLogs.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Dumbbell className="w-3.5 h-3.5 text-indigo-400" /> Recent Workout Sessions
                </h3>
                <div className="space-y-1.5 text-xs">
                  {debugUser.workoutLogs.map((w) => (
                    <div key={w.id} className="p-2.5 bg-zinc-900 rounded-xl flex justify-between items-center border border-zinc-800/80">
                      <span className="font-semibold text-white">{w.name}</span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {new Date(w.startedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </PortalModal>
    </div>
  );
}
