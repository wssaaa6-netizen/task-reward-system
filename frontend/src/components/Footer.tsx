import React from 'react';
import { Link } from 'react-router-dom';
import { Coins, ShieldCheck, HeartHandshake, Sparkles, Mail, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full glass-panel border-t border-white/10 dark:border-white/5 pt-16 pb-24 lg:pb-12 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-white/10">
          {/* Col 1: Brand */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5 group inline-flex">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Coins className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-extrabold text-xl tracking-tight text-white">
                Task<span className="text-emerald-400">2Cash</span>
              </span>
            </Link>
            <p className="text-slate-400 leading-relaxed max-w-sm">
              The premier gamified points and rewards platform. Turn your everyday skills, knowledge, and daily consistency into exciting digital rewards and simulated payouts.
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl max-w-sm">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Sandbox Demo Mode: Reward payouts and mobile recharges operate in simulated sandbox mode.</span>
            </div>
          </div>

          {/* Col 2: Platform Links */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white uppercase tracking-wider text-xs">Earning Hub</h4>
            <ul className="space-y-2">
              <li><Link to="/tasks" className="hover:text-emerald-400 transition-colors">Daily Tasks & Challenges</Link></li>
              <li><Link to="/quizzes" className="hover:text-emerald-400 transition-colors">Knowledge Quizzes</Link></li>
              <li><Link to="/streak" className="hover:text-emerald-400 transition-colors">7-Day Streak Rewards</Link></li>
              <li><Link to="/leaderboard" className="hover:text-emerald-400 transition-colors">Global Leaderboard</Link></li>
              <li><Link to="/referrals" className="hover:text-emerald-400 transition-colors">Referral Program</Link></li>
            </ul>
          </div>

          {/* Col 3: Rewards */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white uppercase tracking-wider text-xs">Rewards Market</h4>
            <ul className="space-y-2">
              <li><Link to="/rewards" className="hover:text-emerald-400 transition-colors">Mobile Recharges</Link></li>
              <li><Link to="/rewards" className="hover:text-emerald-400 transition-colors">Instant UPI Payouts</Link></li>
              <li><Link to="/rewards" className="hover:text-emerald-400 transition-colors">Direct Bank Transfer</Link></li>
              <li><Link to="/rewards" className="hover:text-emerald-400 transition-colors">Brand Gift Cards</Link></li>
              <li><Link to="/withdrawals" className="hover:text-emerald-400 transition-colors">Payout History</Link></li>
            </ul>
          </div>

          {/* Col 4: Trust & Transparency */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white uppercase tracking-wider text-xs">Trust & Legal</h4>
            <ul className="space-y-2">
              <li><Link to="/responsible-rewards" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"><HeartHandshake className="w-3.5 h-3.5 text-emerald-400" /> Responsible Rewards</Link></li>
              <li><Link to="/terms" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-emerald-400" /> Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Privacy Policy</Link></li>
              <li><a href="mailto:support@task2cash.com" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-emerald-400" /> Support Desk</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Note */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Task2Cash. All rights reserved. Built for educational and demonstration purposes.</p>
          <div className="flex items-center gap-4">
            <span className="text-emerald-400/80 font-medium">Conversion: 100 Pts = ₹1.00 Demo Value</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
