import React from 'react';
import { HeartHandshake, ShieldCheck, AlertTriangle, Sparkles, Award } from 'lucide-react';

export const ResponsibleRewardsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
          <HeartHandshake className="w-8 h-8" />
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white">
          Responsible Rewards Policy
        </h1>
        <p className="text-slate-400 text-base max-w-xl mx-auto">
          Our commitment to honest gamification, anti-gambling principles, and transparent rewards.
        </p>
      </div>

      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 text-slate-300 text-sm leading-relaxed border border-white/10">
        <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-amber-300 flex items-start gap-3">
          <Sparkles className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
          <div>
            <strong className="text-white font-bold block mb-1">Sandbox / Demo Simulation Notice:</strong>
            All reward redemptions, mobile recharges, and payouts currently operate in a simulated demo environment for demonstration and skill evaluation. No fiat currency transactions or guaranteed incomes are represented.
          </div>
        </div>

        <section className="space-y-2">
          <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            1. No Gambling or Games of Chance
          </h3>
          <p>
            Task2Cash is strictly designed around educational tasks, skill-based quizzes, and daily participation. We do not support real-money wagering, casino mechanics, deceptive loot boxes, or pay-to-win schemes. Points are earned purely through completed activities.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400" />
            2. Transparent Points Conversion
          </h3>
          <p>
            Points are loyalty units internal to the platform. By default, 100 Points equal ₹1.00 Demo Valuation. Conversion rates and minimum thresholds are clearly displayed across all wallet and withdrawal pages without hidden deductions.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            3. Anti-Abuse & Fair Play Integrity
          </h3>
          <p>
            To protect genuine participants, our platform employs automated heuristic monitors that detect automated bots, impossible completion speeds, duplicate quiz farming, and referral manipulation. Accounts flagged for systematic abuse may be subject to review or suspension.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-display font-bold text-lg text-white">
            4. User Data & Payout Protection
          </h3>
          <p>
            We adhere to strict data security standards. Sensitive financial fields such as bank account numbers and payout destinations are masked on all displays (e.g. XXXX-XXXX-4821) and are never exposed in unauthenticated payloads.
          </p>
        </section>
      </div>
    </div>
  );
};
