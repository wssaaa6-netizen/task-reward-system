import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Coins,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Gift,
  Trophy,
  CheckCircle,
  Clock,
  Smartphone,
  CreditCard,
  Building2,
  ChevronDown,
  Star,
  Users,
  Flame,
  CheckCircle2,
  ArrowUpRight
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const stats = [
    { label: 'Active Users', value: '25,000+', icon: Users },
    { label: 'Tasks & Quizzes Completed', value: '180,000+', icon: CheckCircle2 },
    { label: 'Points Distributed', value: '35,000,000+', icon: Coins },
    { label: 'Demo Rewards Claimed', value: '₹3,50,000+', icon: Gift },
  ];

  const steps = [
    {
      num: '01',
      title: 'Create Account',
      desc: 'Sign up in under 30 seconds with email verification. Get an instant 50 points welcome bonus!',
    },
    {
      num: '02',
      title: 'Complete Tasks & Quizzes',
      desc: 'Answer trivia quizzes, complete educational challenges, and maintain your 7-day streak.',
    },
    {
      num: '03',
      title: 'Earn & Level Up',
      desc: 'Watch your points balance grow and level up from Bronze to Diamond for higher multipliers.',
    },
    {
      num: '04',
      title: 'Redeem Rewards',
      desc: 'Redeem points for instant simulated mobile recharges, UPI payouts, and direct bank transfers.',
    },
  ];

  const popularTasks = [
    {
      title: 'Quick Web Tech Survey 2026',
      category: 'Survey',
      points: 150,
      time: '10 mins',
      difficulty: 'Easy',
    },
    {
      title: 'Python Syntax Debugging Challenge',
      category: 'Coding',
      points: 350,
      time: '20 mins',
      difficulty: 'Medium',
    },
    {
      title: 'Daily Fintech Knowledge Check-in',
      category: 'Daily Challenge',
      points: 100,
      time: '5 mins',
      difficulty: 'Easy',
    },
  ];

  const featuredQuizzes = [
    {
      title: 'Python & Backend Engineering Mastery',
      category: 'Technology',
      points: 100,
      questions: 5,
      time: '3 mins',
    },
    {
      title: 'Modern Web Development & React',
      category: 'Coding',
      points: 100,
      questions: 5,
      time: '3 mins',
    },
    {
      title: 'Fintech & Digital Banking Essentials',
      category: 'General Knowledge',
      points: 100,
      questions: 5,
      time: '2.5 mins',
    },
  ];

  const rewardOptions = [
    {
      title: 'Mobile Recharges',
      desc: 'Instant simulated prepaid recharges for Airtel, Jio, Vi, and BSNL.',
      icon: Smartphone,
      color: 'from-sky-500/20 to-blue-500/20',
      border: 'border-sky-500/30',
      text: 'text-sky-400',
    },
    {
      title: 'Instant UPI Payouts',
      desc: 'Simulated payouts to Google Pay, PhonePe, Paytm, or BHIM VPA handles.',
      icon: CreditCard,
      color: 'from-emerald-500/20 to-teal-500/20',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
    },
    {
      title: 'Direct Bank Transfer',
      desc: 'Simulated NEFT/IMPS transfers directly to your bank savings account.',
      icon: Building2,
      color: 'from-purple-500/20 to-violet-500/20',
      border: 'border-purple-500/30',
      text: 'text-purple-400',
    },
    {
      title: 'Brand Gift Cards',
      desc: 'Simulated digital voucher codes for Amazon Pay, Flipkart, and Google Play.',
      icon: Gift,
      color: 'from-amber-500/20 to-orange-500/20',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
    },
  ];

  const testimonials = [
    {
      name: 'Raghav S.',
      role: 'Computer Science Student',
      rating: 5,
      comment: 'The quizzes are legitimately informative and fun! The daily streak feature keeps me engaged every single morning before college.',
    },
    {
      name: 'Priya P.',
      role: 'Frontend Developer',
      rating: 5,
      comment: 'Super sleek UI and lightning fast response times. The rewards simulator gives a realistic preview of modern fintech integrations.',
    },
    {
      name: 'Sneha R.',
      role: 'Tech Enthusiast',
      rating: 5,
      comment: 'Love the leaderboard competition and achievement badges. Reaching Diamond level felt like a real accomplishment!',
    },
  ];

  const faqs = [
    {
      q: 'How does Task2Cash work?',
      a: 'Users sign up, explore tasks and quizzes across various categories like coding, general knowledge, and surveys, earn reward points, maintain daily streaks, and redeem their points for simulated mobile recharges and payouts.',
    },
    {
      q: 'What is the point conversion rate?',
      a: 'The default platform conversion rate is 100 Points = ₹1.00 Demo Value. This conversion rate is dynamically managed and verified through our backend settings.',
    },
    {
      q: 'What does "Demo / Sandbox Rewards" mean?',
      a: 'In this version of Task2Cash, all mobile recharges, UPI payouts, and bank transfers operate in a production-style DEMO simulation mode. Points and transactions are tracked with immutable ledgers, but no actual fiat money is debited from live external banking gateways.',
    },
    {
      q: 'How does the 7-day daily streak reward ladder work?',
      a: 'Every consecutive day you log in and claim your streak, your bonus points increase: Day 1 (+10 pts), Day 2 (+15 pts), up to Day 7 (+100 pts). If you miss a day, the streak resets to Day 1.',
    },
    {
      q: 'Can I invite friends to earn referral bonuses?',
      a: 'Yes! Every user receives a unique referral code. When your friend joins and completes their first activity, both you and your friend earn bonus referral points.',
    },
  ];

  return (
    <div className="space-y-24 sm:space-y-32 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 sm:pt-20 lg:pt-28 text-center max-w-5xl mx-auto px-4">
        {/* Glowing Background Blob */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Top Tag */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-semibold mb-6 shadow-sm">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>The Next-Gen Gamified Rewards Platform</span>
        </div>

        {/* Main Title */}
        <h1 className="font-display font-extrabold text-4xl sm:text-6xl lg:text-7xl text-white tracking-tight leading-[1.1]">
          Complete Tasks. Earn Points.{' '}
          <span className="gradient-text-emerald">Get Rewards.</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Turn your time, curiosity, and skills into points by completing quizzes, knowledge challenges, and daily activities.
        </p>

        {/* Hero CTA Buttons */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-display font-bold text-base shadow-xl shadow-emerald-500/30 hover:opacity-95 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
          >
            <span>Start Earning Free</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/tasks"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl glass-card text-white font-display font-semibold text-base hover:bg-white/10 transition-all flex items-center justify-center gap-2"
          >
            <span>Explore Tasks</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="mt-10 flex items-center justify-center gap-6 text-xs sm:text-sm text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Instant Signup</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Sandbox Safe</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Daily Streak Rewards</span>
          </div>
        </div>

        {/* Live Animated Statistics Cards */}
        <div className="mt-16 sm:mt-20 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="glass-card rounded-2xl p-5 sm:p-6 text-center border border-white/10 hover:border-emerald-500/30 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="font-display font-black text-2xl sm:text-3xl text-white">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm font-medium text-slate-400 mt-1">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. HOW IT WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
            Step-by-Step Guide
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white mt-2">
            How Task2Cash Works
          </h2>
          <p className="text-slate-400 mt-3 text-sm sm:text-base">
            Start earning rewards in four effortless steps with clear point tracking.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="glass-card rounded-3xl p-6 sm:p-7 relative border border-white/10 hover:border-emerald-500/40 transition-all group"
            >
              <div className="font-display font-black text-4xl text-emerald-500/20 group-hover:text-emerald-400/40 transition-colors mb-4">
                {step.num}
              </div>
              <h3 className="font-display font-bold text-xl text-white group-hover:text-emerald-400 transition-colors">
                {step.title}
              </h3>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. POPULAR TASKS PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
              Earn Instantly
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white mt-1">
              Popular Tasks & Challenges
            </h2>
          </div>
          <Link
            to="/tasks"
            className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 group"
          >
            <span>View all 20+ tasks</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {popularTasks.map((task, idx) => (
            <div
              key={idx}
              className="glass-card rounded-3xl p-6 border border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-white/5 text-xs font-medium text-slate-300">
                    {task.category}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                    {task.difficulty}
                  </span>
                </div>
                <h3 className="font-display font-bold text-lg text-white">
                  {task.title}
                </h3>
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/10 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {task.time}
                  </span>
                  <span className="font-bold text-emerald-400">
                    +{task.points} Points
                  </span>
                </div>
              </div>
              <Link
                to="/tasks"
                className="mt-6 w-full py-2.5 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-white hover:text-emerald-300 text-sm font-semibold flex items-center justify-center gap-2 border border-white/10 transition-colors"
              >
                <span>View Task</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 4. FEATURED QUIZZES PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
              Brain Challenges
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white mt-1">
              Featured Knowledge Quizzes
            </h2>
          </div>
          <Link
            to="/quizzes"
            className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 group"
          >
            <span>Explore all quizzes</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredQuizzes.map((quiz, idx) => (
            <div
              key={idx}
              className="glass-card rounded-3xl p-6 border border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-xs font-semibold text-emerald-400">
                  {quiz.category}
                </span>
                <h3 className="font-display font-bold text-lg text-white mt-3">
                  {quiz.title}
                </h3>
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/10 text-xs text-slate-400">
                  <span>{quiz.questions} Questions</span>
                  <span>⏱ {quiz.time}</span>
                  <span className="font-bold text-amber-300">+{quiz.points} pts</span>
                </div>
              </div>
              <Link
                to="/quizzes"
                className="mt-6 w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 hover:opacity-95 transition-all"
              >
                <span>Play Quiz</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 5. REWARD OPTIONS MARKETPLACE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
            Flexible Redemptions
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white mt-2">
            Reward Options (Demo Mode)
          </h2>
          <p className="text-slate-400 mt-2 text-sm">
            Multiple payout formats ready for immediate simulated execution.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {rewardOptions.map((opt, idx) => {
            const Icon = opt.icon;
            return (
              <div
                key={idx}
                className={`glass-card rounded-3xl p-6 border ${opt.border} relative overflow-hidden`}
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${opt.color} flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${opt.text}`} />
                </div>
                <h3 className="font-display font-bold text-lg text-white">
                  {opt.title}
                </h3>
                <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                  {opt.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
            Community Love
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white mt-2">
            What Earners Are Saying
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div key={idx} className="glass-card rounded-3xl p-6 border border-white/10 space-y-4">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-300 text-sm italic leading-relaxed">
                "{t.comment}"
              </p>
              <div className="pt-2 border-t border-white/10">
                <p className="font-bold text-white text-sm">{t.name}</p>
                <p className="text-xs text-emerald-400">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. FAQ SECTION */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
            Common Questions
          </span>
          <h2 className="font-display font-extrabold text-3xl text-white mt-2">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="glass-card rounded-2xl border border-white/10 overflow-hidden transition-colors"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 font-semibold text-white text-base"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-emerald-400 shrink-0 transition-transform duration-200 ${
                    openFaq === idx ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-6 pb-5 pt-1 text-slate-300 text-sm leading-relaxed border-t border-white/5">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 8. FINAL CTA BANNER */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="glass-panel rounded-3xl p-8 sm:p-14 border border-emerald-500/30 text-center relative overflow-hidden glow-emerald">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl" />

          <h2 className="font-display font-black text-3xl sm:text-5xl text-white leading-tight">
            Ready to Turn Your Knowledge Into Rewards?
          </h2>
          <p className="mt-4 text-slate-300 max-w-xl mx-auto text-base sm:text-lg">
            Join thousands of active learners today. Start completing daily tasks, quizzes, and maintain your earning streak!
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-display font-bold text-base shadow-xl shadow-emerald-500/30 hover:opacity-95 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              <span>Get Started Now (Free 50 Pts)</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
