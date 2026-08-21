import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  Coins,
  Gift,
  ArrowDownToLine,
  ShieldAlert,
  Sliders,
  TrendingUp,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { api } from '../../services/api';
import { AdminStats } from '../../types';

const COLORS = ['#10b981', '#f59e0b', '#8b5cf6', '#38bdf8', '#f43f5e'];

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/stats');
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const kpis = [
    { label: 'Total Registered Users', value: stats?.total_users || 0, icon: Users, color: 'text-sky-400' },
    { label: 'Active Users (24h)', value: stats?.active_users_24h || 0, icon: Activity, color: 'text-emerald-400' },
    { label: 'Tasks Completed', value: stats?.tasks_completed || 0, icon: CheckCircle2, color: 'text-amber-400' },
    { label: 'Quizzes Completed', value: stats?.quizzes_completed || 0, icon: TrendingUp, color: 'text-purple-400' },
    { label: 'Total Points Distributed', value: (stats?.points_distributed || 0).toLocaleString(), icon: Coins, color: 'text-emerald-400' },
    { label: 'Points Redeemed', value: (stats?.points_redeemed || 0).toLocaleString(), icon: Gift, color: 'text-rose-400' },
    { label: 'Pending Withdrawals', value: stats?.pending_withdrawals_count || 0, icon: ArrowDownToLine, color: 'text-amber-400' },
    { label: 'Flagged Fraud Alerts', value: stats?.fraud_alerts_count || 0, icon: ShieldAlert, color: 'text-red-400' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="font-display font-black text-3xl text-white">
          Platform Overview & Analytics
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Real-time metrics, user growth, points velocity, and reward redemptions.
        </p>
      </div>

      {/* 8 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="glass-card rounded-2xl p-5 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 block">{kpi.label}</span>
                <span className="font-display font-black text-2xl text-white mt-1 block">
                  {kpi.value}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* CHARTS ROW 1: USER GROWTH & POINTS FLOW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Growth Area Chart */}
        <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-4">
          <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-400" />
            User Acquisition Trend
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.user_growth || []}>
                <defs>
                  <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#64748b" textAnchor="end" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Area type="monotone" dataKey="users" stroke="#38bdf8" strokeWidth={3} fillOpacity={1} fill="url(#userGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Points Velocity Bar Chart */}
        <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-4">
          <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
            <Coins className="w-5 h-5 text-emerald-400" />
            Daily Points Flow (Earned vs Redeemed)
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.points_flow || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="earned" name="Points Earned" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="redeemed" name="Points Redeemed" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CHARTS ROW 2: REDEMPTIONS BY TYPE & RECENT LOGS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Redemptions Pie */}
        <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-4">
          <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-400" />
            Redemptions by Type
          </h3>

          <div className="h-60 w-full flex items-center justify-center">
            {stats?.redemptions_by_type.length === 0 ? (
              <p className="text-xs text-slate-500">No redemption metrics yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.redemptions_by_type || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="type"
                  >
                    {stats?.redemptions_by_type.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Real-time Activity Logs Feed */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-6 border border-white/10 space-y-4">
          <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            Live Audit Stream
          </h3>

          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {stats?.recent_activity_logs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center ${
                      log.amount > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {log.amount > 0 ? '+' : '-'}
                  </span>
                  <p className="font-medium text-white truncate max-w-sm">{log.description}</p>
                </div>
                <span className="font-bold text-slate-300 font-mono">
                  {log.amount > 0 ? `+${log.amount}` : log.amount} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
