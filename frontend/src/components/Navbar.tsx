import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Coins,
  Flame,
  Bell,
  Sun,
  Moon,
  User as UserIcon,
  Shield,
  Trophy,
  Gift,
  LogOut,
  Menu,
  X,
  ChevronDown,
  CheckCircle2,
  Wallet as WalletIcon,
  ListTodo,
  HelpCircle,
  Users2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationContext';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', authRequired: true },
    { name: 'Tasks', path: '/tasks', icon: ListTodo },
    { name: 'Quizzes', path: '/quizzes', icon: HelpCircle },
    { name: 'Rewards', path: '/rewards', icon: Gift },
    { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
    { name: 'Referrals', path: '/referrals', icon: Users2, authRequired: true },
    { name: 'Wallet', path: '/wallet', icon: WalletIcon, authRequired: true },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 dark:border-white/5 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-xl tracking-tight text-white dark:text-white light:text-slate-900 flex items-center gap-1">
                Task<span className="text-emerald-400">2Cash</span>
              </span>
              <span className="text-[10px] tracking-wider font-semibold text-emerald-400/90 uppercase -mt-1">
                Complete • Earn • Redeem
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              if (link.authRequired && !isAuthenticated) return null;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/20 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons & User Menu */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Toggle light/dark theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-300" />}
            </button>

            {isAuthenticated && user ? (
              <>
                {/* Points Pill */}
                <Link
                  to="/wallet"
                  className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 px-3 py-1.5 rounded-full hover:border-emerald-500/50 transition-all group"
                  title="View Points Wallet"
                >
                  <Coins className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-sm text-emerald-300">
                    {user.points.toLocaleString()} <span className="text-xs font-normal text-emerald-400/80">pts</span>
                  </span>
                  <span className="text-xs font-semibold text-amber-300 border-l border-emerald-500/30 pl-2">
                    ≈ ₹{user.demo_inr_value.toFixed(2)}
                  </span>
                </Link>

                {/* Streak Pill */}
                <Link
                  to="/streak"
                  className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1.5 rounded-full hover:border-amber-500/50 transition-all text-amber-400 text-xs sm:text-sm font-bold"
                  title="Daily Streak Tracker"
                >
                  <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
                  <span>{user.streak_count}d</span>
                </Link>

                {/* Notifications Bell */}
                <Link
                  to="/notifications"
                  className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 transition-colors border border-white/10"
                  >
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name}
                        className="w-8 h-8 rounded-lg bg-emerald-900/50 object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-bold text-sm">
                        {user.full_name.charAt(0)}
                      </div>
                    )}
                    <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
                  </button>

                  {userDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setUserDropdownOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-64 glass-panel rounded-2xl shadow-2xl py-2 z-40 border border-white/15 animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-4 py-3 border-b border-white/10">
                          <p className="text-sm font-semibold text-white truncate">{user.full_name}</p>
                          <p className="text-xs text-slate-400 truncate">{user.email}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {user.level} Level
                            </span>
                            <span className="text-xs text-emerald-400 font-medium">
                              {user.points.toLocaleString()} pts
                            </span>
                          </div>
                        </div>

                        <div className="py-1 text-sm">
                          <Link
                            to="/profile"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            <UserIcon className="w-4 h-4 text-emerald-400" />
                            My Profile
                          </Link>

                          <Link
                            to="/achievements"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            <Trophy className="w-4 h-4 text-amber-400" />
                            Achievements
                          </Link>

                          <Link
                            to="/withdrawals"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            <Gift className="w-4 h-4 text-purple-400" />
                            Payouts & Redemptions
                          </Link>

                          {isAdmin && (
                            <Link
                              to="/admin"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-emerald-300 hover:bg-emerald-500/10 transition-colors font-medium border-t border-b border-emerald-500/20 my-1"
                            >
                              <Shield className="w-4 h-4 text-emerald-400" />
                              Admin Control Center
                            </Link>
                          )}

                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:bg-red-500/10 transition-colors text-left"
                          >
                            <LogOut className="w-4 h-4 text-red-400" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:opacity-95 hover:scale-[1.02] transition-all"
                >
                  Start Earning
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden glass-panel border-t border-white/10 px-4 pt-3 pb-6 space-y-2">
          {navLinks.map((link) => {
            if (link.authRequired && !isAuthenticated) return null;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium ${
                  isActive(link.path)
                    ? 'bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/20'
                    : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                {link.icon && <link.icon className="w-5 h-5 text-emerald-400" />}
                {link.name}
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
            >
              <Shield className="w-5 h-5 text-emerald-400" />
              Admin Portal
            </Link>
          )}
        </div>
      )}
    </header>
  );
};
