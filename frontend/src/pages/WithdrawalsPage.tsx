import React, { useState, useEffect } from 'react';
import {
  ArrowDownToLine,
  CreditCard,
  Building2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Loader2,
  ShieldCheck,
  Clock,
  Send
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { Withdrawal } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const WithdrawalsPage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [method, setMethod] = useState<'UPI' | 'BANK_TRANSFER'>('UPI');
  const [points, setPoints] = useState<number>(5000);
  const [upiId, setUpiId] = useState('');
  const [upiName, setUpiName] = useState(user?.full_name || '');
  const [accountHolder, setAccountHolder] = useState(user?.full_name || '');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('HDFC Bank');

  const [limits, setLimits] = useState<any>({
    min_withdrawal_points: 5000,
    daily_withdrawal_limit_points: 50000,
    conversion_rate: 100,
  });
  const [history, setHistory] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadLimitsAndHistory();
  }, []);

  const loadLimitsAndHistory = async () => {
    try {
      setHistoryLoading(true);
      const [limitsRes, historyRes] = await Promise.all([
        api.get('/withdrawals/limits'),
        api.get('/withdrawals/history'),
      ]);

      if (limitsRes.data?.success) setLimits(limitsRes.data.data);
      if (historyRes.data?.success) setHistory(historyRes.data.data);
    } catch (err) {
      console.error('Failed to load withdrawals data:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const amountInr = (points / (limits.conversion_rate || 100)).toFixed(2);
  const minPoints = limits.min_withdrawal_points || 5000;
  const userBalance = user?.points || 0;
  const canWithdraw = userBalance >= points && points >= minPoints;

  const handleSubmitPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (points < minPoints) {
      setError(`Minimum withdrawal is ${minPoints.toLocaleString()} points.`);
      return;
    }

    if (userBalance < points) {
      setError(`Insufficient points balance. You have ${userBalance.toLocaleString()} points.`);
      return;
    }

    if (method === 'UPI') {
      if (!upiId || !upiId.includes('@')) {
        setError('Please enter a valid UPI ID (e.g., yourname@bank).');
        return;
      }
    } else {
      if (!accountNumber || !ifscCode || !accountHolder) {
        setError('Please enter complete Bank details.');
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        method,
        points: Number(points),
        upi_id: method === 'UPI' ? upiId.trim() : undefined,
        upi_name: method === 'UPI' ? upiName.trim() : undefined,
        account_holder_name: method === 'BANK_TRANSFER' ? accountHolder.trim() : undefined,
        account_number: method === 'BANK_TRANSFER' ? accountNumber.trim() : undefined,
        ifsc_code: method === 'BANK_TRANSFER' ? ifscCode.trim().toUpperCase() : undefined,
        bank_name: method === 'BANK_TRANSFER' ? bankName.trim() : undefined,
      };

      const res = await api.post('/withdrawals', payload);
      if (res.data?.success) {
        setSuccessMessage(
          `Demo payout of ₹${amountInr} simulated successfully! Ref ID: ${res.data.data.transaction_id}`
        );
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        await refreshProfile();
        await loadLimitsAndHistory();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Payout request failed. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
      case 'PROCESSING':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/20';
      case 'REJECTED':
        return 'bg-red-500/15 text-red-400 border-red-500/20';
      default:
        return 'bg-slate-500/15 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-2">
          <ArrowDownToLine className="w-3.5 h-3.5" />
          <span>Payouts & Withdrawals</span>
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white">
          Simulated Payout Request
        </h1>
        <p className="text-slate-400 text-sm sm:text-base mt-1">
          Withdraw your earned points directly to your UPI handle or Bank Account in sandbox demo mode.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 7 Cols: Withdrawal Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl">
            {/* Method Tabs */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setMethod('UPI')}
                className={`py-3 rounded-2xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                  method === 'UPI'
                    ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-500 shadow-lg shadow-emerald-500/20'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>UPI Transfer</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('BANK_TRANSFER')}
                className={`py-3 rounded-2xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                  method === 'BANK_TRANSFER'
                    ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-500 shadow-lg shadow-emerald-500/20'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Bank Account</span>
              </button>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmitPayout} className="space-y-4">
              {/* Points Amount Slider / Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Points to Withdraw
                  </label>
                  <span className="text-xs text-amber-300 font-bold">
                    = ₹{amountInr} Demo Value
                  </span>
                </div>
                <input
                  type="number"
                  step={500}
                  min={minPoints}
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-base font-bold text-white focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
                <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                  <span>Min: {minPoints.toLocaleString()} pts (₹50)</span>
                  <span>Available: {userBalance.toLocaleString()} pts</span>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-2 pt-1 pb-2">
                {[5000, 10000, 25000, 50000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setPoints(preset)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                      points === preset
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                    }`}
                  >
                    {preset.toLocaleString()} pts
                  </button>
                ))}
              </div>

              {/* UPI Fields */}
              {method === 'UPI' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      UPI Virtual Payment Address (VPA)
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. yourname@okhdfcbank"
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={upiName}
                      onChange={(e) => setUpiName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </>
              )}

              {/* Bank Transfer Fields */}
              {method === 'BANK_TRANSFER' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      placeholder="Name on Bank Account"
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Bank Account Number
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Account Number"
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                        placeholder="e.g. SBIN0001234"
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono uppercase"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="e.g. State Bank of India"
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Notice */}
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-xs text-amber-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Sandbox Demo Payout</span>
                </div>
                <p className="text-slate-400">
                  Transactions remain simulated for demonstration. Sensitive details are automatically masked in ledgers.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !canWithdraw}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm shadow-xl shadow-emerald-500/25 hover:opacity-95 disabled:opacity-40 flex items-center justify-center gap-2 transition-all mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Demo Payout...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Confirm & Request Payout (₹{amountInr} Demo)</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right 5 Cols: Limits & Policy */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-4">
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Withdrawal Rules & Limits
            </h3>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">Conversion Rate</span>
                <span className="font-bold text-white">100 Pts = ₹1.00 Demo</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">Minimum Threshold</span>
                <span className="font-bold text-emerald-400">5,000 Pts (₹50.00)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">Daily Payout Limit</span>
                <span className="font-bold text-white">50,000 Pts (₹500.00)</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Processing Time</span>
                <span className="font-bold text-emerald-400">Instant (Sandbox Demo)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Withdrawal History Table */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-4">
        <h2 className="font-display font-bold text-xl text-white">
          Payout Requests History
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs text-slate-400 uppercase tracking-wider">
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold">Method</th>
                <th className="pb-3 font-semibold">Destination</th>
                <th className="pb-3 font-semibold">Points</th>
                <th className="pb-3 font-semibold">Demo Amount</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Transaction ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {historyLoading ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">Loading payout records...</td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">No previous payout requests.</td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors text-xs sm:text-sm">
                    <td className="py-3 text-slate-400 font-mono">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 font-semibold text-white">{item.method}</td>
                    <td className="py-3 text-slate-300 font-mono">{item.destination_display}</td>
                    <td className="py-3 font-bold text-red-400">-{item.points.toLocaleString()} pts</td>
                    <td className="py-3 font-bold text-amber-300">₹{item.amount_inr.toFixed(2)}</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-xs text-emerald-400">{item.transaction_id}</td>
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
