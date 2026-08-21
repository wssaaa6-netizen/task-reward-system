import React, { useState } from 'react';
import { Bell, CheckCheck, Sparkles, Gift, CheckCircle2, Flame, AlertCircle } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';

export const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  const filtered = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.is_read;
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TASK': return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'QUIZ': return <Sparkles className="w-5 h-5 text-amber-400" />;
      case 'REWARD': return <Gift className="w-5 h-5 text-purple-400" />;
      case 'STREAK': return <Flame className="w-5 h-5 text-amber-400 fill-amber-400" />;
      default: return <Bell className="w-5 h-5 text-sky-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-2">
            <Bell className="w-3.5 h-3.5" />
            <span>Activity Feed</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white">
            Notifications Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time alerts on your task approvals, points bonuses, and sandbox payouts.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-2 transition-colors self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4 text-emerald-400" />
            <span>Mark All as Read ({unreadCount})</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'ALL'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-white/5 text-slate-400 hover:text-white'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('UNREAD')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'UNREAD'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-white/5 text-slate-400 hover:text-white'
          }`}
        >
          Unread Only ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="glass-card rounded-3xl p-6 border border-white/10 divide-y divide-white/5">
        {loading && notifications.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            Loading notifications...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm space-y-2">
            <Bell className="w-10 h-10 text-slate-600 mx-auto" />
            <p>No notifications to display.</p>
          </div>
        ) : (
          filtered.map((notif) => (
            <div
              key={notif.id}
              onClick={() => !notif.is_read && markAsRead(notif.id)}
              className={`py-4 px-3 sm:px-4 rounded-2xl flex items-start justify-between gap-4 transition-colors cursor-pointer ${
                notif.is_read ? 'hover:bg-white/5' : 'bg-emerald-500/5 hover:bg-emerald-500/10'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  {getNotificationIcon(notif.type)}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                    {notif.title}
                    {!notif.is_read && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </h4>
                  <p className="text-slate-300 text-xs sm:text-sm mt-0.5 leading-relaxed">
                    {notif.message}
                  </p>
                  <span className="text-[11px] text-slate-500 mt-1.5 block font-mono">
                    {new Date(notif.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
