import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Coins,
  Flame,
  Trophy,
  Gift,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  HelpCircle,
  ListTodo,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Award
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Task, QuizListItem, PointTransaction, DailyStreakResponse } from '../types';
import { DailyStreakModal } from '../components/DailyStreakModal';
import { TaskSubmitModal } from '../components/TaskSubmitModal';
import { TaskCard } from '../components/TaskCard';

export const DashboardPage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [streakData, setStreakData] = useState<DailyStreakResponse | null>(null);
  const [streakModalOpen, setStreakModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [tasksRes, quizzesRes, txRes, streakRes] = await Promise.all([
        api.get('/tasks?limit=4'),
        api.get('/quizzes?limit=3'),
        api.get('/wallet/transactions?limit=5'),
        api.get('/streak'),
      ]);

      if (tasksRes.data?.success) setTasks(tasksRes.data.data.slice(0, 4));
      if (quizzesRes.data?.success) setQuizzes(quizzesRes.data.data.slice(0, 3));
      if (txRes.data?.success) setTransactions(txRes.data.data.items);
      if (streakRes.data?.success) setStreakData(streakRes.data.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const completedActivitiesCount = (user?.tasks_completed || 0) + (user?.quizzes_completed || 0);
  const dailyTarget = 5;
  const progressPercent = Math.min(100, Math.round((Math.min(completedActivitiesCount, dailyTarget) / dailyTarget) * 100));

  const levelProgress = user?.next_level_xp
    ? Math.min(100, Math.round((user.xp / user.next_level_xp) * 100))
    : 100;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* 1. TOP WELCOME BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 relative overflow-hidden">
        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Task2Cash Member Hub</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-4xl text-white">
            Welcome back, {user?.full_name.split(' ')[0] || 'Earner'} 👋
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            You have active tasks waiting. Complete activities to build your streak and level up!
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          {streakData?.can_claim_today && (
            <button
              onClick={() => setStreakModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-display font-bold text-sm shadow-xl shadow-amber-500/20 hover:scale-105 transition-all flex items-center gap-2 animate-bounce"
            >
              <Flame className="w-4 h-4 fill-slate-950" />
              <span>Claim Streak (+{streakData.next_claim_points} pts)</span>
            </button>
          )}

          <Link
            to="/rewards"
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-display font-bold text-sm shadow-xl shadow-emerald-500/20 hover:opacity-95 transition-all flex items-center gap-2"
          >
            <Gift className="w-4 h-4" />
            <span>Redeem Rewards</span>
          </Link>
        </div>

        {/* Glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Total Points */}
        <div className="glass-card rounded-3xl p-6 border border-white/10 hover:border-emerald-500/30 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Points</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="font-display font-black text-3xl text-white">
              {user?.points.toLocaleString()} <span className="text-xs font-semibold text-emerald-400">pts</span>
            </div>
            <Link to="/wallet" className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 mt-1">
              <span>View ledger</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 2: Demo INR Valuation */}
        <div className="glass-card rounded-3xl p-6 border border-white/10 hover:border-amber-500/30 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Demo INR Value</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Gift className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="font-display font-black text-3xl text-amber-300">
              ₹{user?.demo_inr_value.toFixed(2)}
            </div>
            <span className="text-xs text-slate-400 block mt-1">
              Rate: 100 pts = ₹1.00 Demo
            </span>
          </div>
        </div>

        {/* Card 3: Level & XP */}
        <div className="glass-card rounded-3xl p-6 border border-white/10 hover:border-purple-500/30 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Tier</span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <span className="font-display font-black text-2xl text-white">{user?.level}</span>
              <span className="text-xs text-purple-300 font-bold">{user?.xp} XP</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full transition-all duration-500"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Daily Streak */}
        <div
          onClick={() => setStreakModalOpen(true)}
          className="glass-card rounded-3xl p-6 border border-white/10 hover:border-amber-500/40 transition-all flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Streak</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Flame className="w-5 h-5 fill-amber-400 animate-pulse" />
            </div>
          </div>
          <div className="mt-4">
            <div className="font-display font-black text-3xl text-amber-400 flex items-center gap-1.5">
              <span>{user?.streak_count}</span>
              <span className="text-sm font-semibold text-slate-300">Days</span>
            </div>
            <span className="text-xs text-emerald-400 font-medium block mt-1 group-hover:underline">
              {streakData?.can_claim_today ? '🔥 Reward ready to claim!' : 'Check in tomorrow for next day'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. TODAY'S PROGRESS BAR */}
      <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white">Daily Target Progress</span>
          </div>
          <span className="font-bold text-emerald-400">{progressPercent}%</span>
        </div>

        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-700"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <p className="text-xs text-slate-400">
          Completed {completedActivitiesCount} activities. Complete more tasks to earn bonus achievements!
        </p>
      </div>

      {/* 3.5. RECOMMENDED FOR YOU SECTION */}
      <div className="rounded-3xl p-6 sm:p-7 glass-panel border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>RECOMMENDED FOR YOU</span>
            </div>
            <h3 className="font-display font-extrabold text-2xl text-white">
              Start with these quick tasks and earn your first points
            </h3>
            <p className="text-slate-300 text-sm">
              Complete these short 2-minute tasks to unlock your daily streak and earn bonus reward points.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
            <div className="text-center sm:text-right">
              <span className="text-xs text-slate-400 font-medium block">Total Possible Reward:</span>
              <span className="font-display font-black text-2xl text-emerald-400">⭐ +300+ Points</span>
            </div>
            <Link
              to="/tasks"
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-500/25 hover:scale-105 transition-all flex items-center gap-2"
            >
              <span>Start Earning</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4. TODAY'S TASKS & QUIZZES GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-emerald-400" />
              <h2 className="font-display font-bold text-xl text-white">Today's Tasks</h2>
            </div>
            <Link
              to="/tasks"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>View All ({tasks.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onSelect={(t) => setSelectedTask(t)}
              />
            ))}
          </div>
        </div>

        {/* Right 1 Col: Recommended Quizzes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-amber-400" />
              <h2 className="font-display font-bold text-xl text-white">Recommended Quizzes</h2>
            </div>
            <Link
              to="/quizzes"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>Explore</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="glass-card rounded-2xl p-4 border border-white/10 hover:border-amber-500/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <span className="text-[11px] font-semibold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded">
                    {quiz.category}
                  </span>
                  <h4 className="font-bold text-white text-sm mt-2 line-clamp-1">{quiz.title}</h4>
                  <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
                    <span>{quiz.total_questions} Questions</span>
                    <span className="font-bold text-emerald-400">+{quiz.total_points} pts</span>
                  </div>
                </div>
                <Link
                  to={`/quizzes/${quiz.id}/play`}
                  className="mt-3 w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 hover:opacity-95 transition-opacity"
                >
                  <span>Play Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. RECENT TRANSACTION ACTIVITY */}
      <div className="glass-card rounded-3xl p-6 sm:p-7 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h2 className="font-display font-bold text-lg text-white">Recent Points Activity</h2>
          </div>
          <Link
            to="/wallet"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            <span>Full Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-2">
          {transactions.length === 0 ? (
            <p className="text-slate-400 text-sm py-4 text-center">No points activity yet. Complete a task to start!</p>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/5 text-sm"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                      tx.amount > 0
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {tx.amount > 0 ? '+' : '-'}
                  </div>
                  <div>
                    <p className="font-medium text-white line-clamp-1">{tx.description}</p>
                    <p className="text-[11px] text-slate-500">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`font-display font-bold text-sm ${
                      tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount} pts
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      <DailyStreakModal
        isOpen={streakModalOpen}
        onClose={() => {
          setStreakModalOpen(false);
          loadDashboardData();
        }}
      />

      <TaskSubmitModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onSuccess={() => {
          loadDashboardData();
          refreshProfile();
        }}
      />
    </div>
  );
};
