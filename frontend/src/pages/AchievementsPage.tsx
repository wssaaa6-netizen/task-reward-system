import React, { useState, useEffect } from 'react';
import { Trophy, CheckCircle2, Lock, Sparkles, Award, Zap, Flame, Brain, Target, Coins, Gift, Users, Crown } from 'lucide-react';
import { api } from '../services/api';
import { AchievementsListResponse, AchievementItem } from '../types';

export const AchievementsPage: React.FC = () => {
  const [data, setData] = useState<AchievementsListResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const res = await api.get('/achievements');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'Common':
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
      case 'Rare':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Epic':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Legendary':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 glow-gold';
      default:
        return 'bg-white/10 text-white';
    }
  };

  const getIconComponent = (icon: string) => {
    switch (icon) {
      case 'Target': return <Target className="w-6 h-6 text-emerald-400" />;
      case 'CheckCheck': return <CheckCircle2 className="w-6 h-6 text-sky-400" />;
      case 'Lightbulb': return <Sparkles className="w-6 h-6 text-amber-400" />;
      case 'Brain': return <Brain className="w-6 h-6 text-purple-400" />;
      case 'Award': return <Award className="w-6 h-6 text-rose-400" />;
      case 'Zap': return <Zap className="w-6 h-6 text-yellow-400" />;
      case 'Flame': return <Flame className="w-6 h-6 text-amber-400 fill-amber-400" />;
      case 'Coins': return <Coins className="w-6 h-6 text-emerald-400" />;
      case 'Trophy': return <Trophy className="w-6 h-6 text-amber-400" />;
      case 'Gift': return <Gift className="w-6 h-6 text-purple-400" />;
      case 'Users': return <Users className="w-6 h-6 text-blue-400" />;
      case 'Crown': return <Crown className="w-6 h-6 text-amber-400 fill-amber-400" />;
      default: return <Award className="w-6 h-6 text-emerald-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass-panel rounded-3xl p-8 border border-white/10 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold">
            <Trophy className="w-3.5 h-3.5" />
            <span>Badges & Milestones</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white">
            Achievements Gallery
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl">
            Complete milestones across quizzes, tasks, and streaks to earn permanent badges and bonus points!
          </p>
        </div>

        <div className="flex items-center gap-4 z-10">
          <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl text-center">
            <span className="text-xs text-slate-400 block">Badges Unlocked</span>
            <span className="font-display font-black text-2xl text-white mt-0.5">
              {data?.total_unlocked || 0} / {data?.total_achievements || 12}
            </span>
          </div>
          <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl text-center">
            <span className="text-xs text-slate-400 block">Bonus Awarded</span>
            <span className="font-display font-black text-2xl text-emerald-400 mt-0.5">
              +{data?.total_points_awarded.toLocaleString() || 0} pts
            </span>
          </div>
        </div>

        {/* Glow */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card rounded-3xl p-6 h-56 shimmer-effect border border-white/5" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.achievements.map((ach) => (
            <div
              key={ach.code}
              className={`glass-card rounded-3xl p-6 border transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                ach.is_unlocked
                  ? 'border-emerald-500/40 glow-emerald'
                  : 'border-white/10 opacity-75'
              }`}
            >
              <div>
                {/* Top badges */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${
                      ach.is_unlocked
                        ? 'bg-emerald-500/15 border-emerald-500/30'
                        : 'bg-white/5 border-white/10 text-slate-500'
                    }`}
                  >
                    {ach.is_unlocked ? getIconComponent(ach.icon) : <Lock className="w-5 h-5 text-slate-500" />}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getRarityBadge(ach.rarity)}`}>
                      {ach.rarity}
                    </span>
                    <span className="font-bold text-xs text-emerald-400">
                      +{ach.points_reward} pts
                    </span>
                  </div>
                </div>

                {/* Title & Desc */}
                <h3 className="font-display font-bold text-lg text-white">
                  {ach.title}
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm mt-1 leading-relaxed">
                  {ach.description}
                </p>
              </div>

              {/* Progress */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-400">
                    {ach.is_unlocked ? 'Completed' : `${ach.current_progress} / ${ach.target_value}`}
                  </span>
                  <span className={`font-bold ${ach.is_unlocked ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {ach.progress_percentage}%
                  </span>
                </div>

                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      ach.is_unlocked
                        ? 'bg-emerald-500'
                        : 'bg-gradient-to-r from-amber-500 to-emerald-400'
                    }`}
                    style={{ width: `${ach.progress_percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
