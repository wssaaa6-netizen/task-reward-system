import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, Flame, Award, Sparkles, User as UserIcon } from 'lucide-react';
import { api } from '../services/api';
import { LeaderboardResponse, LeaderboardEntry } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<'global' | 'weekly' | 'monthly'>('global');
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [timeframe]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/leaderboard?timeframe=${timeframe}`);
      if (res.data?.success) {
        setLeaderboard(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const top3 = leaderboard?.top_entries.slice(0, 3) || [];
  const remaining = leaderboard?.top_entries.slice(3) || [];
  const userRank = leaderboard?.current_user_rank;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* Header */}
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold mb-2">
          <Trophy className="w-3.5 h-3.5" />
          <span>Hall of Fame</span>
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-white">
          Community Leaderboard
        </h1>
        <p className="text-slate-400 text-sm sm:text-base">
          Compete with fellow earners, maintain streaks, and climb to the top of the podium!
        </p>
      </div>

      {/* Timeframe Tabs */}
      <div className="flex items-center justify-center gap-2">
        {(['global', 'weekly', 'monthly'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setTimeframe(tab)}
            className={`px-6 py-2.5 rounded-2xl text-xs font-bold capitalize transition-all ${
              timeframe === tab
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-lg shadow-amber-500/25 scale-105'
                : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            {tab === 'global' ? 'All-Time Global' : `${tab} Rankings`}
          </button>
        ))}
      </div>

      {/* Current User Rank Highlight Banner */}
      {userRank && (
        <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-emerald-500/30 flex items-center justify-between gap-4 glow-emerald">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 font-display font-black text-xl flex items-center justify-center border border-emerald-500/40">
              #{userRank.rank}
            </div>
            <div>
              <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Your Ranking Position</p>
              <h3 className="font-bold text-white text-lg">{userRank.name} (You)</h3>
            </div>
          </div>

          <div className="flex items-center gap-6 text-right">
            <div className="hidden sm:block">
              <span className="text-xs text-slate-400 block">Streak</span>
              <span className="font-bold text-amber-400 text-sm">🔥 {userRank.streak_count}d</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Points</span>
              <span className="font-display font-black text-xl text-emerald-400">
                {userRank.points.toLocaleString()} pts
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TOP 3 PODIUM VISUAL */}
      {top3.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-6">
          {/* 2nd Place (Silver) */}
          <div className="order-2 md:order-1 glass-card rounded-3xl p-6 border border-slate-400/30 text-center flex flex-col justify-between relative overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-slate-300/20 text-slate-300 font-black text-sm flex items-center justify-center mx-auto border border-slate-300/40 mb-3">
              #2
            </div>
            <img
              src={top3[1].avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${top3[1].name}`}
              alt={top3[1].name}
              className="w-16 h-16 rounded-2xl mx-auto bg-slate-800 object-cover shadow-lg"
            />
            <h3 className="font-bold text-white text-lg mt-3">{top3[1].name}</h3>
            <span className="text-xs font-semibold text-slate-400">{top3[1].level} Tier</span>
            <div className="mt-4 p-3 bg-white/5 rounded-2xl">
              <span className="font-display font-black text-xl text-slate-200 block">
                {top3[1].points.toLocaleString()} pts
              </span>
              <span className="text-xs text-slate-500">🔥 {top3[1].streak_count}d streak</span>
            </div>
          </div>

          {/* 1st Place (Gold) - Elevated */}
          <div className="order-1 md:order-2 glass-panel rounded-3xl p-7 border border-amber-500/40 text-center flex flex-col justify-between relative overflow-hidden glow-gold md:-translate-y-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 font-black text-base flex items-center justify-center mx-auto shadow-lg mb-3">
              <Crown className="w-6 h-6 fill-slate-950" />
            </div>
            <img
              src={top3[0].avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${top3[0].name}`}
              alt={top3[0].name}
              className="w-20 h-20 rounded-3xl mx-auto bg-amber-950 object-cover shadow-xl border-2 border-amber-400/50"
            />
            <h3 className="font-display font-extrabold text-white text-xl mt-3">{top3[0].name}</h3>
            <span className="text-xs font-bold text-amber-300">{top3[0].level} Tier 🏆</span>
            <div className="mt-4 p-3.5 bg-amber-500/15 border border-amber-500/30 rounded-2xl">
              <span className="font-display font-black text-2xl text-amber-300 block">
                {top3[0].points.toLocaleString()} pts
              </span>
              <span className="text-xs text-amber-200/80 font-semibold">🔥 {top3[0].streak_count}d active streak</span>
            </div>
          </div>

          {/* 3rd Place (Bronze) */}
          <div className="order-3 md:order-3 glass-card rounded-3xl p-6 border border-amber-700/30 text-center flex flex-col justify-between relative overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-amber-700/20 text-amber-500 font-black text-sm flex items-center justify-center mx-auto border border-amber-700/40 mb-3">
              #3
            </div>
            <img
              src={top3[2].avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${top3[2].name}`}
              alt={top3[2].name}
              className="w-16 h-16 rounded-2xl mx-auto bg-slate-800 object-cover shadow-lg"
            />
            <h3 className="font-bold text-white text-lg mt-3">{top3[2].name}</h3>
            <span className="text-xs font-semibold text-slate-400">{top3[2].level} Tier</span>
            <div className="mt-4 p-3 bg-white/5 rounded-2xl">
              <span className="font-display font-black text-xl text-amber-600 block">
                {top3[2].points.toLocaleString()} pts
              </span>
              <span className="text-xs text-slate-500">🔥 {top3[2].streak_count}d streak</span>
            </div>
          </div>
        </div>
      )}

      {/* FULL LEADERBOARD TABLE */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-4">
        <h2 className="font-display font-bold text-xl text-white">Full Leaderboard Table</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs text-slate-400 uppercase tracking-wider">
                <th className="pb-3 font-semibold">Rank</th>
                <th className="pb-3 font-semibold">Player</th>
                <th className="pb-3 font-semibold">Tier</th>
                <th className="pb-3 font-semibold">Streak</th>
                <th className="pb-3 font-semibold text-right">Total Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">Loading rankings...</td>
                </tr>
              ) : leaderboard?.top_entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">No participants yet in this timeframe.</td>
                </tr>
              ) : (
                leaderboard?.top_entries.map((entry) => (
                  <tr
                    key={entry.user_id}
                    className={`transition-colors ${
                      entry.is_current_user
                        ? 'bg-emerald-500/10 font-semibold'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <td className="py-3.5 font-display font-bold text-slate-400">
                      #{entry.rank}
                    </td>
                    <td className="py-3.5 flex items-center gap-3">
                      <img
                        src={entry.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${entry.name}`}
                        alt={entry.name}
                        className="w-8 h-8 rounded-xl bg-slate-800 object-cover"
                      />
                      <span className="text-white font-medium">
                        {entry.name} {entry.is_current_user && '(You)'}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/5 border border-white/10 text-slate-300">
                        {entry.level}
                      </span>
                    </td>
                    <td className="py-3.5 text-xs text-amber-400 font-bold">
                      🔥 {entry.streak_count}d
                    </td>
                    <td className="py-3.5 text-right font-display font-bold text-emerald-400">
                      {entry.points.toLocaleString()} pts
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
