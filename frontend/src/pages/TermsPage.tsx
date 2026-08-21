import React from 'react';
import { Lock, FileText, CheckCircle2 } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <FileText className="w-6 h-6" />
        </div>
        <h1 className="font-display font-extrabold text-3xl text-white">Terms of Service</h1>
        <p className="text-slate-400 text-sm">Last updated: August 2026</p>
      </div>

      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 text-slate-300 text-sm leading-relaxed border border-white/10">
        <section className="space-y-2">
          <h3 className="font-bold text-white text-base">1. Acceptance of Terms</h3>
          <p>By accessing and using Task2Cash, you agree to comply with these terms, community guidelines, and fair play requirements.</p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-white text-base">2. Account Registration & Security</h3>
          <p>Users must provide accurate information during registration. Users are responsible for maintaining the confidentiality of their credentials. Multiple accounts per person are prohibited.</p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-white text-base">3. Rewards & Demo Sandbox Operation</h3>
          <p>All points, mobile recharges, UPI transfers, and bank payouts provided in this application version are operated under a simulated Sandbox Demo Mode for educational and demonstration purposes.</p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-white text-base">4. Fair Use & Prohibited Conduct</h3>
          <p>Use of automation scripts, bot extensions, duplicate task submissions, or exploiting scoring vulnerabilities will result in account disqualification and cancellation of pending points.</p>
        </section>
      </div>
    </div>
  );
};

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="font-display font-extrabold text-3xl text-white">Privacy Policy</h1>
        <p className="text-slate-400 text-sm">Last updated: August 2026</p>
      </div>

      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 text-slate-300 text-sm leading-relaxed border border-white/10">
        <section className="space-y-2">
          <h3 className="font-bold text-white text-base">1. Information We Collect</h3>
          <p>We collect full names, email addresses, optional phone numbers, activity timestamps, and task completion records solely for authentication and reward ledger integrity.</p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-white text-base">2. Financial Data Protection & Masking</h3>
          <p>Bank details and UPI VPAs used for payout simulations are encrypted and masked on all client-facing pages to prevent unauthorized disclosure.</p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-white text-base">3. Data Sharing & Third Parties</h3>
          <p>We do not sell, rent, or trade your personal information with third-party advertising brokers.</p>
        </section>
      </div>
    </div>
  );
};
