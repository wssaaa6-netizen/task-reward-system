import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, UserX, Eye, X, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { FraudAlert } from '../../types';

export const AdminFraudPage: React.FC = () => {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadFraudAlerts();
  }, [statusFilter]);

  const loadFraudAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/fraud?status=${statusFilter}`);
      if (res.data?.success) {
        setAlerts(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load fraud alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (action: 'DISMISS' | 'SUSPEND_USER') => {
    if (!selectedAlert) return;
    setActionLoading(true);

    try {
      await api.put(`/admin/fraud/${selectedAlert.id}/resolve`, {
        action,
        notes: resolutionNotes.trim() || `Marked as ${action} by Admin`,
      });
      setSelectedAlert(null);
      loadFraudAlerts();
    } catch (err) {
      console.error('Error resolving fraud event:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const getSeverityBadge = (severity?: string) => {
    const s = (severity || 'MEDIUM').toUpperCase();
    switch (s) {
      case 'HIGH':
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-3xl text-white">
            Fraud & Anti-Abuse Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Automated anomaly detection for rapid point farming, fast quiz speed bots, and multi-accounts.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
          {['ALL', 'OPEN', 'RESOLVED', 'SUSPENDED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                statusFilter === st ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Table */}
      <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs text-slate-400 uppercase tracking-wider">
                <th className="pb-3 font-semibold">Timestamp</th>
                <th className="pb-3 font-semibold">Flagged User</th>
                <th className="pb-3 font-semibold">Event Type</th>
                <th className="pb-3 font-semibold">Severity</th>
                <th className="pb-3 font-semibold">Reason</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">Scanning activity logs for fraud...</td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    🛡️ Clean ledger! No flagged suspicious events matching filter.
                  </td>
                </tr>
              ) : (
                alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 text-xs text-slate-400 font-mono">
                      {new Date(alert.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 font-bold text-white max-w-xs truncate">
                      {alert.user_name || 'Flagged User'}
                    </td>
                    <td className="py-3.5 text-xs font-semibold text-white">{alert.event_type}</td>
                    <td className="py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getSeverityBadge(alert.risk_level || alert.severity)}`}>
                        {alert.risk_level || alert.severity || 'MEDIUM'}
                      </span>
                    </td>
                    <td className="py-3.5 text-xs text-slate-300 max-w-xs truncate">{alert.reason}</td>
                    <td className="py-3.5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-white/5 border border-white/10 text-slate-300">
                        {alert.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => {
                          setSelectedAlert(alert);
                          setResolutionNotes('');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white inline-flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-red-400" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSPECT FRAUD MODAL */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl relative space-y-5">
            <button
              onClick={() => setSelectedAlert(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getSeverityBadge(selectedAlert.risk_level || selectedAlert.severity)}`}>
                {selectedAlert.risk_level || selectedAlert.severity || 'MEDIUM'} Severity Alert
              </span>
              <h2 className="font-display font-bold text-2xl text-white mt-2">
                {selectedAlert.event_type}
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">User: {selectedAlert.user_name}</p>
            </div>

            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-300 space-y-2">
              <strong className="block font-bold text-white">Heuristic Trigger Explanation:</strong>
              <p>{selectedAlert.reason}</p>
            </div>

            <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-xs font-mono text-slate-300 space-y-1">
              <div className="text-slate-500">Metadata Payload:</div>
              <pre className="text-[11px] overflow-x-auto text-emerald-400">
                {JSON.stringify(selectedAlert.metadata, null, 2)}
              </pre>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase block">
                Investigation Resolution Notes
              </label>
              <textarea
                rows={2}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Document resolution findings..."
                className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleResolve('DISMISS')}
                disabled={actionLoading}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold transition-colors"
              >
                Dismiss (False Positive)
              </button>
              <button
                type="button"
                onClick={() => handleResolve('SUSPEND_USER')}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold shadow-lg shadow-red-500/20 transition-all flex items-center gap-1.5"
              >
                <UserX className="w-4 h-4" />
                <span>Suspend User Account</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
