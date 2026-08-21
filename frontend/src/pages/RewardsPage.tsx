import React, { useState, useEffect } from 'react';
import { Gift, Smartphone, CreditCard, Building2, Sparkles, Search } from 'lucide-react';
import { api } from '../services/api';
import { Reward } from '../types';
import { RewardCard } from '../components/RewardCard';
import { RedeemModal } from '../components/RedeemModal';
import { useAuth } from '../contexts/AuthContext';

export const RewardsPage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);

  const categories = ['ALL', 'Recharge', 'UPI Payout', 'Bank Transfer', 'Gift Cards'];

  useEffect(() => {
    loadRewards();
  }, [selectedCategory]);

  const loadRewards = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'ALL') params.append('category', selectedCategory);

      const res = await api.get(`/rewards?${params.toString()}`);
      if (res.data?.success) {
        setRewards(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load rewards:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sandbox Marketplace</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white">
            Redeem Points & Rewards
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mt-1">
            Exchange your earned points for simulated mobile recharge vouchers, UPI payouts, and gift cards.
          </p>
        </div>

        {/* User points balance pill */}
        <div className="glass-card px-5 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">Your Points</span>
            <span className="font-display font-bold text-lg text-emerald-400">
              {user?.points.toLocaleString()} pts
            </span>
          </div>
          <span className="text-sm font-semibold text-amber-300 border-l border-white/10 pl-3">
            ≈ ₹{user?.demo_inr_value.toFixed(2)} Demo
          </span>
        </div>
      </div>

      {/* Categories */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/25'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            {cat === 'ALL' ? 'All Rewards' : cat}
          </button>
        ))}
      </div>

      {/* Rewards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card rounded-3xl p-6 h-64 shimmer-effect border border-white/5" />
          ))}
        </div>
      ) : rewards.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center text-slate-400 space-y-3 border border-white/10">
          <Gift className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="font-bold text-lg text-white">No Rewards Found</h3>
          <p className="text-sm">Check back soon for new reward catalog items.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((reward) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              onRedeem={(r) => setSelectedReward(r)}
            />
          ))}
        </div>
      )}

      {/* Redeem Modal */}
      <RedeemModal
        reward={selectedReward}
        onClose={() => setSelectedReward(null)}
        onSuccess={() => {
          loadRewards();
          refreshProfile();
        }}
      />
    </div>
  );
};
