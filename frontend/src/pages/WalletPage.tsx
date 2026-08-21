import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet as WalletIcon,
  Coins,
  ArrowDownToLine,
  ArrowUpRight,
  Gift,
  Search,
  Filter,
  Sparkles,
  TrendingUp,
  ArrowDownRight,
  Building2,
  Smartphone
} from 'lucide-react';
import { api } from '../services/api';
import { Wallet, PointTransaction } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const WalletPage: React.FC = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadWalletData();
  }, [typeFilter, page]);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const [walletRes, txRes] = await Promise.all([
        api.get('/wallet'),
        api.get(`/wallet/transactions?type=${typeFilter}&page=${page}&limit=20`),
      ]);

      if (walletRes.data?.success) setWallet(walletRes.data.data);
      if (txRes.data?.success) {
        setTransactions(txRes.data.data.items);
        setTotalPages(txRes.data.data.pages);
      }
    } catch (err) {
      console.error('Failed to load wallet data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTxTypeBadge = (type: string) => {
    switch (type) {
      case 'EARN':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
      case 'BONUS':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/20';
      case 'REDEEM':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/20';
      case 'REFUND':
        return 'bg-sky-500/15 text-sky-400 border-sky-500/20';
      case 'ADJUSTMENT':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/20';
      default:
        return 'bg-slate-500/15 text-slate-400 border-slate-500/20';
    }
  };

  const filteredTxs = transactions.filter((tx) =>
    tx.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* 1. TOP BALANCE CARD */}
      <div className="glass-panel rounded-3xl p-8 sm:p-10 border border-emerald-500/30 relative overflow-hidden glow-emerald">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Immutable Ledger Balance</span>
            </div>
            <h1 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Available Point Balance
            </h1>
            <div className="font-display font-black text-4xl sm:text-6xl text-white mt-1">
              {wallet?.available_points.toLocaleString() || user?.points.toLocaleString()}{' '}
              <span className="text-xl sm:text-2xl font-bold text-emerald-400">PTS</span>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <span className="font-display font-extrabold text-xl sm:text-2xl text-amber-300">
                ≈ ₹{wallet?.demo_inr_value.toFixed(2) || user?.demo_inr_value.toFixed(2)} Demo Value
              </span>
              <span className="text-xs text-slate-400 border-l border-white/20 pl-3">
                100 pts = ₹1.00 Demo
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/rewards"
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-display font-bold text-sm shadow-xl shadow-emerald-500/30 hover:opacity-95 transition-all flex items-center gap-2"
            >
              <Gift className="w-4 h-4" />
              <span>Redeem Rewards</span>
            </Link>
            <Link
              to="/withdrawals"
              className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-display font-semibold text-sm border border-white/15 transition-all flex items-center gap-2"
            >
              <ArrowDownToLine className="w-4 h-4 text-emerald-400" />
              <span>Request Payout</span>
            </Link>
          </div>
        </div>

        {/* Glow Blob */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. STATS BREAKDOWN */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="glass-card rounded-2xl p-5 border border-white/10">
          <span className="text-xs font-semibold text-slate-400 block">Lifetime Earned</span>
          <span className="font-display font-bold text-2xl text-emerald-400 mt-1 block">
            +{wallet?.total_earned.toLocaleString() || 0} pts
          </span>
        </div>
        <div className="glass-card rounded-2xl p-5 border border-white/10">
          <span className="text-xs font-semibold text-slate-400 block">Total Redeemed</span>
          <span className="font-display font-bold text-2xl text-purple-400 mt-1 block">
            -{wallet?.total_spent.toLocaleString() || 0} pts
          </span>
        </div>
        <div className="glass-card rounded-2xl p-5 border border-white/10">
          <span className="text-xs font-semibold text-slate-400 block">Pending Rewards</span>
          <span className="font-display font-bold text-2xl text-amber-300 mt-1 block">
            {wallet?.pending_points || 0} pts
          </span>
        </div>
        <div className="glass-card rounded-2xl p-5 border border-white/10">
          <span className="text-xs font-semibold text-slate-400 block">Locked Points</span>
          <span className="font-display font-bold text-2xl text-slate-400 mt-1 block">
            {wallet?.locked_points || 0} pts
          </span>
        </div>
      </div>

      {/* 3. IMMUTABLE TRANSACTION LEDGER */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-white">
              Transaction History
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Immutable ledger of all points earned, bonuses, and sandbox redemptions.
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search description..."
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Type Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {['ALL', 'EARN', 'BONUS', 'REDEEM', 'REFUND', 'ADJUSTMENT'].map((type) => (
            <button
              key={type}
              onClick={() => {
                setTypeFilter(type);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                typeFilter === type
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs text-slate-400 uppercase tracking-wider">
                <th className="pb-3 font-semibold">Date & Time</th>
                <th className="pb-3 font-semibold">Description</th>
                <th className="pb-3 font-semibold">Type</th>
                <th className="pb-3 font-semibold text-right">Points</th>
                <th className="pb-3 font-semibold text-right">Balance After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">Loading ledger records...</td>
                </tr>
              ) : filteredTxs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">No transactions found.</td>
                </tr>
              ) : (
                filteredTxs.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 text-xs text-slate-400 font-mono">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                    <td className="py-4 font-medium text-white max-w-xs sm:max-w-md truncate">
                      {tx.description}
                    </td>
                    <td className="py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getTxTypeBadge(tx.type)}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-4 text-right font-display font-bold">
                      <span className={tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {tx.amount > 0 ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 text-right font-mono text-xs text-slate-300">
                      {tx.balance_after.toLocaleString()} pts
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-30"
            >
              Previous
            </button>
            <span className="text-slate-400">
              Page <strong>{page}</strong> of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
