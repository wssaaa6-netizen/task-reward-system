import React, { useState, useEffect } from 'react';
import { ArrowDownToLine, Check, X, ShieldAlert, AlertCircle, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { Withdrawal } from '../../types';

export const AdminWithdrawalsPage: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadWithdrawals();
  }, [statusFilter]);

  const loadWithdrawals = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/withdrawals?status=${statusFilter}`);
      if (res.data?.success) {
        setWithdrawals(res.data.data.items);
      }
    } catch (err) {
      console.error('Failed to load withdrawals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'COMPLETED' | 'REJECTED') => {
    setActionLoadingId(id);
    setFeedback(null);

    try {
      const res = await api.put(`/admin/withdrawals/${id}`, {
        status: newStatus,
        admin_notes: `Processed by Admin as ${newStatus} in Sandbox Mode`,
      });

      if (res.data?.success) {
        setFeedback(`Withdrawal ${id} marked as ${newStatus}. (If rejected, points were automatically refunded).`);
        await loadWithdrawals();
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch (err: any) {
      setFeedback(err.response?.data?.message || 'Action failed.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-3xl text-white">
            Withdrawal Approvals Queue
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Simulate 1-click approvals, bank disbursements, or refunds for payout requests.
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
          {['ALL', 'PENDING', 'COMPLETED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                statusFilter === st ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Table */}
      <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs text-slate-400 uppercase tracking-wider">
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold">User</th>
                <th className="pb-3 font-semibold">Method</th>
                <th className="pb-3 font-semibold">Destination</th>
                <th className="pb-3 font-semibold">Points</th>
                <th className="pb-3 font-semibold">Demo INR</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">Loading payout queue...</td>
                </tr>
              ) : withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">No withdrawals found for filter.</td>
                </tr>
              ) : (
                withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 text-xs text-slate-400 font-mono">
                      {new Date(w.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 font-bold text-white max-w-xs truncate">{w.user_name || 'User'}</td>
                    <td className="py-3.5 text-xs font-semibold text-white">{w.method}</td>
                    <td className="py-3.5 text-xs text-slate-300 font-mono">{w.destination_display}</td>
                    <td className="py-3.5 font-bold text-red-400">-{w.points.toLocaleString()} pts</td>
                    <td className="py-3.5 font-bold text-amber-300">₹{w.amount_inr.toFixed(2)}</td>
                    <td className="py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          w.status === 'COMPLETED'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : w.status === 'PENDING'
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse'
                            : 'bg-red-500/15 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {w.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      {w.status === 'PENDING' ? (
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateStatus(w.id, 'COMPLETED')}
                            disabled={actionLoadingId === w.id}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Approve Demo</span>
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(w.id, 'REJECTED')}
                            disabled={actionLoadingId === w.id}
                            className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold flex items-center gap-1 transition-colors"
                          >
                            <X className="w-3.5 h-3.5 text-red-400" />
                            <span>Reject & Refund</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 font-mono">{w.transaction_id}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
