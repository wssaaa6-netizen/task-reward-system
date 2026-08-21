import React from 'react';
import { Smartphone, CreditCard, Building2, Gift, Sparkles, ArrowRight, Lock } from 'lucide-react';
import { Reward } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface RewardCardProps {
  reward: Reward;
  onRedeem: (reward: Reward) => void;
}

export const RewardCard: React.FC<RewardCardProps> = ({ reward, onRedeem }) => {
  const { user } = useAuth();
  const canAfford = user ? user.points >= reward.required_points : false;

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'MOBILE_RECHARGE':
        return <Smartphone className="w-6 h-6 text-sky-400" />;
      case 'UPI_PAYOUT':
        return <CreditCard className="w-6 h-6 text-emerald-400" />;
      case 'BANK_TRANSFER':
        return <Building2 className="w-6 h-6 text-purple-400" />;
      default:
        return <Gift className="w-6 h-6 text-amber-400" />;
    }
  };

  return (
    <div className="glass-card rounded-3xl p-6 flex flex-col justify-between hover:border-emerald-500/40 hover:-translate-y-1 transition-all duration-200 group relative overflow-hidden">
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/15 transition-all pointer-events-none" />

      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            {getRewardIcon(reward.type)}
          </div>

          <div className="flex flex-col items-end">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Demo Reward
            </span>
            <span className="text-[11px] font-semibold text-slate-400 mt-1">
              Min. Level: {reward.min_level_required}
            </span>
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="font-display font-bold text-lg text-white group-hover:text-emerald-400 transition-colors">
          {reward.name}
        </h3>
        <p className="text-slate-400 text-sm mt-1.5 line-clamp-2 leading-relaxed">
          {reward.description}
        </p>

        {/* Valuation Pill */}
        <div className="mt-5 p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Demo Cash Value</span>
            <span className="font-display font-extrabold text-lg text-white">
              ₹{reward.demo_cash_value.toFixed(2)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block font-medium">Required Points</span>
            <span className="font-display font-bold text-emerald-400">
              {reward.required_points.toLocaleString()} pts
            </span>
          </div>
        </div>
      </div>

      {/* Redeem Button */}
      <div className="mt-6">
        <button
          onClick={() => onRedeem(reward)}
          disabled={!canAfford}
          className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
            canAfford
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:opacity-95 group-hover:scale-[1.01]'
              : 'bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed'
          }`}
        >
          {canAfford ? (
            <>
              <span>Redeem Reward</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>
                Need {(reward.required_points - (user?.points || 0)).toLocaleString()} more pts
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
