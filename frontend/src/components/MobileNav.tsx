import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ListTodo, HelpCircle, Gift, Wallet } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const MobileNav: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const items = [
    { label: 'Home', path: isAuthenticated ? '/dashboard' : '/', icon: Home },
    { label: 'Tasks', path: '/tasks', icon: ListTodo },
    { label: 'Quizzes', path: '/quizzes', icon: HelpCircle },
    { label: 'Rewards', path: '/rewards', icon: Gift },
    { label: 'Wallet', path: isAuthenticated ? '/wallet' : '/login', icon: Wallet },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-white/10 px-2 py-1.5 pb-safe">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const active = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
                active
                  ? 'text-emerald-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5px] text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : ''}`} />
              <span className="text-[11px] mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
