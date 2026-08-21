import React, { useState, useEffect } from 'react';
import { X, Flame, Sparkles, CheckCircle2, Lock, Gift, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { DailyStreakResponse } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface DailyStreakModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DailyStreakModal: React.FC<DailyStreakModalProps> = ({ isOpen, onClose }) => {
  const { refreshProfile } = useAuth();
  const [streakData, setStreakData] = useState<DailyStreakResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimedMessage, setClaimedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadStreak();
    }
  }, [isOpen]);

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
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
        await refreshProfile();
        await loadStreak();
      }
    } catch (err: any) {
      setClaimedMessage(err.response?.data?.message || 'Could not claim streak reward.');
    } finally {
      setClaiming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-xl rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl relative">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          {/* Flame Icon */}
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-lg shadow-amber-500/20">
            <Flame className="w-10 h-10 fill-amber-400 animate-pulse" />
          </div>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white mt-4">
            Daily Streak Rewards 🔥
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Check in every day to keep your streak alive and unlock massive point multipliers!
          </p>

          {/* Current streak banner */}
          <div className="mt-4 inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 px-4 py-1.5 rounded-full text-amber-300 font-bold text-sm">
            <Flame className="w-4 h-4 fill-amber-400" />
            <span>Current Streak: {streakData?.current_streak || 0} Consecutive Days</span>
          </div>

          {/* 7-Day Ladder Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5 mt-6">
            {streakData?.days_schedule.map((day) => (
              <div
                key={day.day}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-between min-h-[95px] ${
                  day.is_completed
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : day.is_current
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 ring-2 ring-amber-500/40 scale-105'
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                <span className="text-[11px] font-semibold block">Day {day.day}</span>
                <div className="my-1">
                  {day.is_completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : day.is_current ? (
                    <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4 text-slate-500" />
                  )}
                </div>
                <span className="text-xs font-bold text-white">+{day.points_reward}</span>
              </div>
            ))}
          </div>

          {/* Feedback message */}
          {claimedMessage && (
            <div className="mt-4 p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-medium">
              {claimedMessage}
            </div>
          )}

          {/* Action Button */}
          <div className="mt-6">
            {streakData?.can_claim_today ? (
              <button
                onClick={handleClaim}
                disabled={claiming}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-display font-extrabold text-base shadow-xl shadow-amber-500/25 hover:opacity-95 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
              >
                {claiming ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Claiming Daily Reward...</span>
                  </>
                ) : (
                  <>
                    <Gift className="w-5 h-5" />
                    <span>Claim Today (+{streakData?.next_claim_points} Pts)</span>
                  </>
                )}
              </button>
            ) : (
              <div className="w-full py-3.5 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-semibold text-sm flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Today's reward already claimed! Come back tomorrow.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
