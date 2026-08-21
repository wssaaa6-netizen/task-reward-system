import React, { useState, useEffect } from 'react';
import { Flame, Sparkles, CheckCircle2, Lock, Gift, Trophy, Zap, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { DailyStreakResponse } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const StreakPage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [streakData, setStreakData] = useState<DailyStreakResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimedMessage, setClaimedMessage] = useState<string | null>(null);

  useEffect(() => {
    loadStreak();
  }, []);

  const loadStreak = async () => {
    try {
      setLoading(true);
      const res = await api.get('/streak');
      if (res.data?.success) {
        setStreakData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load streak:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    try {
      setClaiming(true);
      const res = await api.post('/streak/claim');
      if (res.data?.success) {
        setClaimedMessage(res.data.message);
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
        });
        await refreshProfile();
        await loadStreak();
      }
    } catch (err: any) {
      setClaimedMessage(err.response?.data?.message || 'Failed to claim daily reward.');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-8 sm:p-12 text-center border border-amber-500/30 relative overflow-hidden glow-gold">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto shadow-2xl animate-float">
          <Flame className="w-12 h-12 fill-amber-400 animate-pulse" />
        </div>

        <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-white mt-5">
          Daily Streak Ladder 🔥
        </h1>
        <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-lg mx-auto leading-relaxed">
          Log in every consecutive day to keep the flame alive. Day 7 rewards a massive <strong className="text-amber-400">+500 bonus points</strong>!
        </p>

        <div className="flex items-center justify-center gap-4 mt-6">
          <div className="bg-white/5 border border-white/10 px-5 py-2.5 rounded-2xl">
            <span className="text-xs text-slate-400 block">Current Streak</span>
            <span className="font-display font-black text-2xl text-amber-400">
              {streakData?.current_streak || 0} Days
            </span>
          </div>
          <div className="bg-white/5 border border-white/10 px-5 py-2.5 rounded-2xl">
            <span className="text-xs text-slate-400 block">Longest Record</span>
            <span className="font-display font-black text-2xl text-emerald-400">
              {streakData?.longest_streak || 0} Days
            </span>
          </div>
        </div>

        {/* Claim Action */}
        <div className="mt-8 max-w-sm mx-auto">
          {streakData?.can_claim_today ? (
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-display font-black text-lg shadow-2xl shadow-amber-500/30 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              {claiming ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Claiming Streak...</span>
                </>
              ) : (
                <>
                  <Gift className="w-5 h-5" />
                  <span>Claim Today's Bonus (+{streakData?.next_claim_points} Pts)</span>
                </>
              )}
            </button>
          ) : (
            <div className="py-3.5 px-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold text-sm flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Today's streak reward claimed! Check back tomorrow.</span>
            </div>
          )}
        </div>

        {claimedMessage && (
          <p className="text-xs font-semibold text-amber-300 mt-3">{claimedMessage}</p>
        )}
      </div>

      {/* 7-Day Ladder Cards */}
      <div className="space-y-4">
        <h2 className="font-display font-bold text-xl text-white">7-Day Reward Progression</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {streakData?.days_schedule.map((day) => (
            <div
              key={day.day}
              className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-between min-h-[120px] ${
                day.is_completed
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : day.is_current
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 ring-2 ring-amber-500/40 scale-105 shadow-lg shadow-amber-500/15'
                  : 'bg-white/5 border-white/10 text-slate-400'
              }`}
            >
              <span className="text-xs font-bold uppercase tracking-wider block">Day {day.day}</span>
              <div className="my-2">
                {day.is_completed ? (
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                ) : day.is_current ? (
                  <Flame className="w-7 h-7 fill-amber-400 text-amber-400 animate-bounce" />
                ) : (
                  <Lock className="w-6 h-6 text-slate-500" />
                )}
              </div>
              <span className="text-sm font-extrabold text-white">+{day.points_reward} pts</span>
            </div>
          ))}
        </div>
      </div>

      {/* Streak Rules Explanation */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-4 text-sm text-slate-300">
        <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          How Streaks Work
        </h3>
        <ul className="space-y-2.5 list-disc list-inside text-slate-400 leading-relaxed">
          <li>Check in daily and complete activities to keep your streak count growing without interruptions.</li>
          <li>Every 7th consecutive day awards the maximum bonus reward (+100 points).</li>
          <li>If you miss a required day, your streak will reset back to Day 1.</li>
          <li>Reaching a 7-day streak unlocks the coveted <strong className="text-white">Streak Champion</strong> achievement badge!</li>
        </ul>
      </div>
    </div>
  );
};
