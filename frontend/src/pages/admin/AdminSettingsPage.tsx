import React, { useState, useEffect } from 'react';
import { Sliders, Save, CheckCircle2, AlertCircle, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';

export const AdminSettingsPage: React.FC = () => {
  const [conversionRate, setConversionRate] = useState<number>(100);
  const [minWithdrawal, setMinWithdrawal] = useState<number>(5000);
  const [dailyWithdrawalLimit, setDailyWithdrawalLimit] = useState<number>(50000);
  const [referralBonus, setReferralBonus] = useState<number>(250);
  const [welcomeBonus, setWelcomeBonus] = useState<number>(50);
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      if (res.data?.success) {
        const s = res.data.data;
        setConversionRate(s.points_per_inr || 100);
        setMinWithdrawal(s.min_withdrawal_points || 5000);
        setDailyWithdrawalLimit(s.daily_withdrawal_limit_points || 50000);
        setReferralBonus(s.referral_bonus_points || 250);
        setWelcomeBonus(s.welcome_bonus_points || 50);
        setMaintenanceMode(s.maintenance_mode || false);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const payload = {
        points_per_inr: Number(conversionRate),
        min_withdrawal_points: Number(minWithdrawal),
        daily_withdrawal_limit_points: Number(dailyWithdrawalLimit),
        referral_bonus_points: Number(referralBonus),
        welcome_bonus_points: Number(welcomeBonus),
        maintenance_mode: maintenanceMode,
      };

      const res = await api.put('/settings', payload);
      if (res.data?.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update system settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="font-display font-black text-3xl text-white">
          System Economics & Settings
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Dynamically configure points conversion valuations, payout thresholds, and bonus rules.
        </p>
      </div>

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>System configuration updated globally! All calculations refreshed.</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1: Valuation */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-400" />
              Points Valuation & Conversion
            </h3>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Active: {conversionRate} pts = ₹1.00 Demo
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Points Per ₹1.00 INR (Conversion Rate)
              </label>
              <input
                type="number"
                min={1}
                value={conversionRate}
                onChange={(e) => setConversionRate(Number(e.target.value))}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                required
              />
              <p className="text-xs text-slate-500 mt-1">Adjusts live INR valuation calculations platform-wide.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Minimum Withdrawal Threshold (Points)
              </label>
              <input
                type="number"
                min={100}
                value={minWithdrawal}
                onChange={(e) => setMinWithdrawal(Number(e.target.value))}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                required
              />
              <p className="text-xs text-slate-500 mt-1">Users cannot request payouts below this point amount.</p>
            </div>
          </div>
        </div>

        {/* Section 2: Bonus & Rewards */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-4">
          <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Bonus & Growth Incentives
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Welcome Signup Bonus (Points)
              </label>
              <input
                type="number"
                value={welcomeBonus}
                onChange={(e) => setWelcomeBonus(Number(e.target.value))}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Referral Reward Bonus (Points per referee)
              </label>
              <input
                type="number"
                value={referralBonus}
                onChange={(e) => setReferralBonus(Number(e.target.value))}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-500/25 hover:opacity-95 flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Updating System Settings...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save & Apply Settings Globally</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
