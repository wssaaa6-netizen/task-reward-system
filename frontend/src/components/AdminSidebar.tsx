import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ListTodo,
  HelpCircle,
  Gift,
  ArrowDownToLine,
  ShieldAlert,
  Sliders,
  ArrowLeft,
  Coins
} from 'lucide-react';

export const AdminSidebar: React.FC = () => {
  const location = useLocation();

  const links = [
    { name: 'Analytics & KPIs', path: '/admin', icon: LayoutDashboard },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'Task Manager', path: '/admin/tasks', icon: ListTodo },
    { name: 'Quiz Studio', path: '/admin/quizzes', icon: HelpCircle },
    { name: 'Rewards Marketplace', path: '/admin/rewards', icon: Gift },
    { name: 'Withdrawals Queue', path: '/admin/withdrawals', icon: ArrowDownToLine },
    { name: 'Fraud & Anti-Abuse', path: '/admin/fraud', icon: ShieldAlert },
    { name: 'System Settings', path: '/admin/settings', icon: Sliders },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="w-64 glass-panel border-r border-white/10 flex flex-col justify-between shrink-0 h-screen sticky top-0 py-6 px-4">
      <div>
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-3 pb-6 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-lg text-white leading-tight">
              Task<span className="text-emerald-400">2Cash</span>
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Admin Portal
            </span>
          </div>
        </div>

        {/* Links */}
        <nav className="mt-6 space-y-1.5">
          {links.map((link) => {
            const active = isActive(link.path);
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 shadow-md shadow-emerald-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Return to App */}
      <div className="pt-4 border-t border-white/10">
        <Link
          to="/dashboard"
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          <span>Return to User App</span>
        </Link>
      </div>
    </aside>
  );
};
