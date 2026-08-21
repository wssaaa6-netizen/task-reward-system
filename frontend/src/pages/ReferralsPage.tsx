import React, { useState, useEffect } from 'react';
import {
  Users2,
  Copy,
  Check,
  Share2,
  Sparkles,
  Gift,
  Award,
  ArrowRight,
  Send,
  MessageSquare
} from 'lucide-react';
import { api } from '../services/api';
import { ReferralDashboard } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const ReferralsPage: React.FC = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<ReferralDashboard | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReferrals();
  }, []);

  const loadReferrals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/referrals');
      if (res.data?.success) {
        setDashboard(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  const referralCode = dashboard?.referral_code || user?.referral_code || 'T2C-USER';
  const referralUrl = `${window.location.origin}/register?ref=${referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = `Join me on Task2Cash and get +50 free points! Complete quick tasks and quizzes to earn rewards: ${referralUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleTwitterShare = () => {
    const text = `Earn points and redeem rewards on Task2Cash! Use my referral code ${referralCode} to claim free bonus points: ${referralUrl}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold mb-2">
          <Users2 className="w-3.5 h-3.5" />
          <span>Referral Program</span>
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white">
          Invite Friends. Earn Bonus Points Together!
        </h1>
        <p className="text-slate-400 text-sm sm:text-base mt-1">
          Share your referral code. You earn <strong className="text-emerald-400">+{dashboard?.bonus_per_referral || 250} points</strong> for every friend who completes their first activity.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-card rounded-3xl p-6 border border-white/10">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Friends Invited</span>
          <span className="font-display font-black text-3xl text-white mt-1 block">
            {dashboard?.total_referrals || 0}
          </span>
        </div>

        <div className="glass-card rounded-3xl p-6 border border-white/10">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Qualified Referrals</span>
          <span className="font-display font-black text-3xl text-emerald-400 mt-1 block">
            {dashboard?.qualified_referrals || 0}
          </span>
        </div>

        <div className="glass-card rounded-3xl p-6 border border-white/10">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Referral Points Earned</span>
          <span className="font-display font-black text-3xl text-amber-300 mt-1 block">
            +{dashboard?.points_earned.toLocaleString() || 0} pts
          </span>
        </div>
      </div>

      {/* Share Box */}
      <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-purple-500/30 relative overflow-hidden glow-purple">
        <div className="max-w-2xl space-y-6">
          <div>
            <span className="text-xs font-bold text-purple-300 uppercase tracking-wider block">
              Your Exclusive Referral Code
            </span>
            <div className="flex items-center gap-3 mt-2">
              <span className="font-display font-black text-3xl sm:text-4xl text-white tracking-wider bg-black/40 px-5 py-2.5 rounded-2xl border border-white/15 font-mono">
                {referralCode}
              </span>
              <button
                onClick={handleCopyLink}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 hover:opacity-95 flex items-center gap-2 transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div>
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-3">
              1-Click Share on Socials:
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleWhatsAppShare}
                className="px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-semibold text-xs flex items-center gap-2 transition-colors"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>Share to WhatsApp</span>
              </button>
              <button
                onClick={handleTwitterShare}
                className="px-4 py-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 text-sky-300 font-semibold text-xs flex items-center gap-2 transition-colors"
              >
                <Share2 className="w-4 h-4 text-sky-400" />
                <span>Share to Twitter / X</span>
              </button>
            </div>
          </div>
        </div>

        {/* Glow */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Referrals List Table */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-4">
        <h2 className="font-display font-bold text-xl text-white">
          Your Invited Friends
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs text-slate-400 uppercase tracking-wider">
                <th className="pb-3 font-semibold">User</th>
                <th className="pb-3 font-semibold">Joined Date</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Points Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400">Loading referral data...</td>
                </tr>
              ) : dashboard?.referral_list.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400">
                    No referrals yet. Share your code above to start earning!
                  </td>
                </tr>
              ) : (
                dashboard?.referral_list.map((ref, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5">
                      <p className="font-semibold text-white">{ref.referee_name}</p>
                      <p className="text-xs text-slate-500">{ref.referee_email_masked}</p>
                    </td>
                    <td className="py-3.5 text-xs text-slate-400 font-mono">
                      {new Date(ref.joined_date).toLocaleDateString()}
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          ref.status === 'QUALIFIED'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {ref.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right font-display font-bold text-emerald-400">
                      +{ref.points_earned_for_referrer} pts
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
