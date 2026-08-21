import React from 'react';
import {
  Clock,
  Award,
  CheckCircle2,
  ArrowRight,
  Zap,
  BookOpen,
  Code,
  Flame,
  Gift,
  Brain,
  Cpu,
  Target,
  Sparkles
} from 'lucide-react';
import { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onSelect: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onSelect }) => {
  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'Quick Tasks':
        return {
          icon: <Zap className="w-4 h-4 text-amber-400" />,
          badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
          gradient: 'from-amber-500/10 to-transparent'
        };
      case 'Knowledge':
      case 'General Knowledge':
        return {
          icon: <Brain className="w-4 h-4 text-purple-400" />,
          badge: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
          gradient: 'from-purple-500/10 to-transparent'
        };
      case 'Technology':
        return {
          icon: <Cpu className="w-4 h-4 text-sky-400" />,
          badge: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
          gradient: 'from-sky-500/10 to-transparent'
        };
      case 'Learning':
      case 'Reading':
      case 'Education':
        return {
          icon: <BookOpen className="w-4 h-4 text-emerald-400" />,
          badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
          gradient: 'from-emerald-500/10 to-transparent'
        };
      case 'Daily Challenges':
      case 'Daily Challenge':
        return {
          icon: <Target className="w-4 h-4 text-rose-400" />,
          badge: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
          gradient: 'from-rose-500/10 to-transparent'
        };
      case 'Streak Tasks':
        return {
          icon: <Flame className="w-4 h-4 text-orange-400" />,
          badge: 'bg-orange-500/10 text-orange-300 border-orange-500/20',
          gradient: 'from-orange-500/10 to-transparent'
        };
      case 'Bonus Tasks':
        return {
          icon: <Gift className="w-4 h-4 text-yellow-400" />,
          badge: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
          gradient: 'from-yellow-500/10 to-transparent'
        };
      case 'Coding':
        return {
          icon: <Code className="w-4 h-4 text-cyan-400" />,
          badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
          gradient: 'from-cyan-500/10 to-transparent'
        };
      default:
        return {
          icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
          badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
          gradient: 'from-emerald-500/10 to-transparent'
        };
    }
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'Easy':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'Medium':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Hard':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'Expert':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      default:
        return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
    }
  };

  const theme = getCategoryTheme(task.category);

  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:border-emerald-500/40 hover:-translate-y-1 transition-all duration-200 group relative overflow-hidden">
      {/* Subtle glowing ambient gradient */}
      <div
        className={`absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl ${theme.gradient} rounded-full blur-2xl group-hover:opacity-100 opacity-60 transition-opacity pointer-events-none`}
      />

      <div>
        {/* Top: Category Icon & Difficulty */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-semibold ${theme.badge}`}>
            {theme.icon}
            <span>{task.category}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {task.is_daily && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Flame className="w-3 h-3 text-amber-400" /> Daily
              </span>
            )}
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getDifficultyBadge(task.difficulty)}`}>
              🟢 {task.difficulty}
            </span>
          </div>
        </div>

        {/* Middle: Title & Description */}
        <h3 className="font-display font-bold text-lg text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
          {task.title}
        </h3>

        <p className="text-slate-400 text-sm mt-2 line-clamp-2 leading-relaxed">
          {task.description}
        </p>

        {/* Bottom Meta Badges */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>⏱ {task.time_limit_minutes} min</span>
          </div>

          <div className="flex items-center gap-1 text-emerald-400 font-extrabold text-sm">
            <span>⭐ +{task.points} Points</span>
          </div>
        </div>
      </div>

      {/* Button State */}
      <div className="mt-5">
        {task.is_completed_by_user ? (
          <div className="w-full py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>✓ Completed (+{task.points} Pts Earned)</span>
          </div>
        ) : (
          <button
            onClick={() => onSelect(task)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:opacity-95 group-hover:scale-[1.01] transition-all"
          >
            <span>Start Task</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );
};
