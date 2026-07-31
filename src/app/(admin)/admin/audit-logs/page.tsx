'use client';

import React, { useState, useEffect } from 'react';
import PortalModal from '@/components/shared/PortalModal';
import { FileText, Filter, X, Eye, Info, UserCheck, Shield } from 'lucide-react';

interface AuditLogEntry {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  targetEmail?: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string } | null;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const fetchLogs = async (action = '') => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/audit-logs?action=${encodeURIComponent(action)}`);
      if (res.ok) {
        const json = await res.json();
        setLogs(json.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(actionFilter);
  }, [actionFilter]);

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <FileText className="w-8 h-8 text-purple-400" /> Audit Log Explorer
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Full security trail of administrative write actions, food moderation approvals, user role modifications, and debug state inspections.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0f0f13] p-4 rounded-2xl border border-zinc-800 shadow-md">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold text-zinc-300">Filter Action Type:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-zinc-950 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-zinc-800 focus:outline-hidden focus:border-purple-500"
          >
            <option value="">All Audit Actions ({logs.length})</option>
            <option value="APPROVE_FOOD">APPROVE_FOOD</option>
            <option value="REJECT_FOOD">REJECT_FOOD</option>
            <option value="UPDATE_USER_ROLE">UPDATE_USER_ROLE</option>
            <option value="DEBUG_USER_INSPECTION">DEBUG_USER_INSPECTION</option>
            <option value="IMPERSONATE_USER_START">IMPERSONATE_USER_START</option>
          </select>
        </div>

        <div className="text-[11px] text-zinc-500 font-mono">
          Click any row to inspect complete un-truncated details payload.
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-[#0f0f13] rounded-3xl border border-zinc-800/80 overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-zinc-500 animate-pulse">Loading security audit records...</div>
        ) : logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#09090b] text-zinc-400 uppercase tracking-wider text-[10px] border-b border-zinc-800/80">
                <tr>
                  <th className="py-3.5 px-6">Timestamp</th>
                  <th className="py-3.5 px-6">Action</th>
                  <th className="py-3.5 px-6">Admin User</th>
                  <th className="py-3.5 px-6">Target Impacted</th>
                  <th className="py-3.5 px-6">Details</th>
                  <th className="py-3.5 px-6 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-zinc-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-6 text-zinc-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 text-[10px] font-mono font-extrabold rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-white">
                      {log.user?.email || 'System'}
                    </td>
                    <td className="py-4 px-6 font-medium text-amber-300">
                      {log.targetEmail ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-amber-300">{log.targetEmail}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">{log.targetType} ({log.targetId?.slice(0, 8)}...)</span>
                        </div>
                      ) : log.targetType ? (
                        <span className="font-mono text-zinc-400">{log.targetType} ({log.targetId?.slice(0, 8)}...)</span>
                      ) : (
                        <span className="text-zinc-500">—</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-zinc-400 max-w-sm truncate group-hover:text-zinc-200">
                      {log.details || '—'}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="px-2.5 py-1 bg-zinc-800 group-hover:bg-purple-950 text-zinc-300 group-hover:text-purple-300 rounded-lg text-[11px] font-medium transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-zinc-500">No audit logs matching criteria.</div>
        )}
      </div>

      {/* Full Audit Log Detail Modal */}
      <PortalModal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        maxWidth="xl"
        className="space-y-6 !bg-[#0f0f13]"
      >
        {selectedLog && (
          <>
            <button
              onClick={() => setSelectedLog(null)}
              className="absolute right-5 top-5 p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-mono font-bold rounded-full mb-2">
                <Info className="w-3.5 h-3.5" /> AUDIT EVENT INSPECTION DETAILS
              </div>
              <h2 className="text-xl font-extrabold text-white">{selectedLog.action}</h2>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">{new Date(selectedLog.createdAt).toUTCString()}</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800">
                <div className="text-[10px] font-bold text-zinc-500 uppercase">Performed By Admin</div>
                <div className="font-bold text-white mt-0.5">{selectedLog.user?.name || 'Admin Account'} ({selectedLog.user?.email || 'N/A'})</div>
              </div>

              {selectedLog.targetType && (
                <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1">
                  <div className="text-[10px] font-bold text-amber-400 uppercase">Target User / Entity Impacted</div>
                  {selectedLog.targetEmail && (
                    <div className="font-bold text-amber-300 text-sm">{selectedLog.targetEmail}</div>
                  )}
                  <div className="font-mono text-zinc-400 text-[11px]">{selectedLog.targetType} — ID: {selectedLog.targetId}</div>
                </div>
              )}

              <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1.5">
                <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Un-truncated Event Payload & Details</div>
                <pre className="text-[11px] font-mono text-zinc-200 whitespace-pre-wrap leading-relaxed bg-[#0a0a0d] p-3.5 rounded-xl border border-zinc-800/80 overflow-x-auto max-h-60">
                  {selectedLog.details || 'No additional details logged.'}
                </pre>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-2xl transition-colors cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </>
        )}
      </PortalModal>
    </div>
  );
}
