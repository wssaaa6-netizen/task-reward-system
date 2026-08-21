import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Flame,
  Zap,
  Brain,
  Cpu,
  Target,
  Gift,
  Sparkles,
  ArrowUpDown,
  GiftIcon,
  CheckCircle2,
  ListTodo,
  TrendingUp,
  Award,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import { Task, DailyTaskSummary, TaskSubmissionResponse } from '../types';
import { TaskCard } from '../components/TaskCard';
import { TaskSubmitModal } from '../components/TaskSubmitModal';
import { useAuth } from '../contexts/AuthContext';

const FILTER_TABS = [
  { id: 'ALL', label: 'All Tasks', icon: Layers },
  { id: 'Quick Tasks', label: '⚡ Quick', icon: Zap },
  { id: 'EASY', label: '🟢 Easy', icon: Sparkles },
  { id: 'Knowledge', label: '🧠 Knowledge', icon: Brain },
  { id: 'Technology', label: '💻 Technology', icon: Cpu },
  { id: 'Daily Challenges', label: '🎯 Daily', icon: Target },
  { id: 'Streak Tasks', label: '🔥 Streak', icon: Flame },
  { id: 'Bonus Tasks', label: '⭐ Bonus', icon: Gift },
];

export const TasksPage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dailySummary, setDailySummary] = useState<DailyTaskSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [sortBy, setSortBy] = useState<'recommended' | 'points' | 'time' | 'newest'>('recommended');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksRes, summaryRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/tasks/daily-summary'),
      ]);

      if (tasksRes.data?.success) {
        setTasks(tasksRes.data.data);
      }
      if (summaryRes.data?.success) {
        setDailySummary(summaryRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load tasks data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskSuccess = async (res?: TaskSubmissionResponse) => {
    await refreshProfile();
    await loadData();
  };

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        // Tab filtering
        if (activeTab === 'EASY') {
          if (task.difficulty !== 'Easy') return false;
        } else if (activeTab !== 'ALL') {
          if (
            task.category.toLowerCase() !== activeTab.toLowerCase() &&
            !(activeTab === 'Knowledge' && task.category === 'General Knowledge') &&
            !(activeTab === 'Daily Challenges' && task.category === 'Daily Challenge')
          ) {
            return false;
          }
        }

        // Search filtering
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchesTitle = task.title.toLowerCase().includes(q);
          const matchesDesc = task.description.toLowerCase().includes(q);
          const matchesCat = task.category.toLowerCase().includes(q);
          if (!matchesTitle && !matchesDesc && !matchesCat) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Incomplete first
        if (a.is_completed_by_user !== b.is_completed_by_user) {
          return a.is_completed_by_user ? 1 : -1;
        }

        if (sortBy === 'points') {
          return b.points - a.points;
        }
        if (sortBy === 'time') {
          return a.time_limit_minutes - b.time_limit_minutes;
        }
        if (sortBy === 'newest') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        // Recommended default: Easy tasks first, then higher points
        if (a.difficulty === 'Easy' && b.difficulty !== 'Easy') return -1;
        if (b.difficulty === 'Easy' && a.difficulty !== 'Easy') return 1;
        return b.points - a.points;
      });
  }, [tasks, activeTab, search, sortBy]);

  // Today's Quick Tasks (featured 6 top easy tasks)
  const todayQuickTasks = useMemo(() => {
    return tasks.filter((t) => t.is_daily || t.difficulty === 'Easy').slice(0, 6);
  }, [tasks]);

  const completedToday = dailySummary?.today_completed_count || 0;
  const bonusTarget = dailySummary?.daily_bonus_target || 3;
  const isBonusClaimed = dailySummary?.daily_bonus_claimed || false;
  const availablePointsToday = dailySummary?.today_available_points || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* 1. TOP HERO SECTION */}
      <div className="relative rounded-3xl overflow-hidden glass-panel p-6 sm:p-10 border border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-500/15 via-teal-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 fill-emerald-400 animate-pulse" />
              <span>Earn Points Today</span>
            </div>

            <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-white tracking-tight leading-tight">
              Complete Easy Tasks, <br className="hidden sm:inline" />
              <span className="text-emerald-400">Earn Instant Rewards</span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Complete simple 1–5 minute activities, test your knowledge, maintain streaks, and build your redeemable balance in sandbox mode.
            </p>
          </div>

          {/* Today's Available Points Card */}
          <div className="glass-card rounded-2xl p-6 border border-emerald-500/30 bg-emerald-950/30 flex flex-col sm:flex-row lg:flex-col justify-between gap-4 shrink-0 min-w-[280px]">
            <div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Today's Available Points
              </span>
              <div className="font-display font-extrabold text-3xl sm:text-4xl text-white mt-1 flex items-center gap-2">
                <span className="text-amber-400">⭐</span>
                <span>Up to {availablePointsToday.toLocaleString()}+ pts</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Calculated dynamically from {tasks.length} active platform tasks
              </p>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-slate-400">Your Current Balance:</span>
              <span className="font-bold text-emerald-300 font-mono">
                {user?.points.toLocaleString() || 0} pts
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DAILY BONUS 3-TASK PROGRESS CARD */}
      <div className="rounded-3xl p-6 sm:p-7 glass-panel border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent relative overflow-hidden shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/20">
              <GiftIcon className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-xl text-white">
                  🎁 DAILY BONUS: Complete Any 3 Tasks
                </h3>
                {isBonusClaimed && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Unlocked Today
                  </span>
                )}
              </div>
              <p className="text-slate-300 text-sm mt-1">
                Complete at least 3 tasks today and unlock an instant{' '}
                <strong className="text-amber-400">+300 Bonus Points</strong> reward once per day.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-300">Progress:</span>
              <span className="font-display font-extrabold text-lg text-amber-300">
                {Math.min(completedToday, bonusTarget)} / {bonusTarget} Tasks
              </span>
            </div>

            {/* Visual 3-step pills */}
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((step) => {
                const isStepDone = completedToday >= step;
                return (
                  <div
                    key={step}
                    className={`w-12 h-3 rounded-full transition-all ${
                      isStepDone
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-400 shadow-md shadow-amber-500/30'
                        : 'bg-white/10'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. TODAY'S QUICK TASKS SECTION */}
      {todayQuickTasks.length > 0 && activeTab === 'ALL' && !search && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400">
                <Flame className="w-5 h-5 fill-orange-400" />
              </div>
              <div>
                <h2 className="font-display font-extrabold text-2xl text-white">
                  🔥 TODAY'S QUICK TASKS
                </h2>
                <p className="text-xs text-slate-400">
                  Fast 1–3 minute challenges designed for instant points and streak building.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {todayQuickTasks.map((task) => (
              <TaskCard key={task.id} task={task} onSelect={setSelectedTask} />
            ))}
          </div>
        </section>
      )}

      {/* 4. SEARCH, FILTER TABS & ALL TASKS */}
      <section className="space-y-6 pt-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-extrabold text-2xl text-white flex items-center gap-2">
              <Zap className="w-6 h-6 text-amber-400" />
              <span>⚡ QUICK & EASY TASKS</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Complete these small tasks and build your points quickly.
            </p>
          </div>

          {/* Search & Sort Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks..."
                className="w-full bg-black/40 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-900 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer w-full"
              >
                <option value="recommended">Sort: Recommended</option>
                <option value="points">Sort: Highest Points</option>
                <option value="time">Sort: Shortest Time</option>
                <option value="newest">Sort: Newest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {FILTER_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/25 font-bold'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:text-white hover:bg-white/10 hover:border-emerald-500/30'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-emerald-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tasks Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-12">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="glass-card rounded-2xl p-6 h-64 animate-pulse space-y-4">
                <div className="h-6 bg-white/10 rounded-lg w-1/3" />
                <div className="h-6 bg-white/10 rounded-lg w-3/4" />
                <div className="h-16 bg-white/5 rounded-lg" />
                <div className="h-10 bg-white/10 rounded-xl mt-4" />
              </div>
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-16 text-center glass-card rounded-3xl border border-white/10 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto text-slate-500">
              <ListTodo className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-white">No tasks match your filters</h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">
              Try switching your category tab or clearing the search query.
            </p>
            <button
              onClick={() => {
                setActiveTab('ALL');
                setSearch('');
              }}
              className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((task) => (
              <TaskCard key={task.id} task={task} onSelect={setSelectedTask} />
            ))}
          </div>
        )}
      </section>

      {/* Interactive Task Modal */}
      <TaskSubmitModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onSuccess={handleTaskSuccess}
      />
    </div>
  );
};
