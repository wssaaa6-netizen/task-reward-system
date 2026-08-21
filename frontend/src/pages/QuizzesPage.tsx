import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Search, Clock, Award, CheckCircle, ArrowRight, Brain, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { QuizListItem } from '../types';

export const QuizzesPage: React.FC = () => {
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = ['ALL', 'Technology', 'Coding', 'General Knowledge', 'Education'];

  useEffect(() => {
    loadQuizzes();
  }, [selectedCategory]);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'ALL') params.append('category', selectedCategory);
      if (search.trim()) params.append('search', search.trim());

      const res = await api.get(`/quizzes?${params.toString()}`);
      if (res.data?.success) {
        setQuizzes(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadQuizzes();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold mb-2">
            <Brain className="w-3.5 h-3.5" />
            <span>Knowledge Arena</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white">
            Timed Knowledge Quizzes
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mt-1">
            Answer questions against the clock, pass with ≥60% accuracy, and earn instant points!
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quizzes..."
            className="w-full bg-black/40 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </form>
      </div>

      {/* Categories */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 font-bold'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            {cat === 'ALL' ? 'All Subjects' : cat}
          </button>
        ))}
      </div>

      {/* Quizzes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card rounded-3xl p-6 h-60 shimmer-effect border border-white/5" />
          ))}
        </div>
      ) : quizzes.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center text-slate-400 space-y-3 border border-white/10">
          <HelpCircle className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="font-bold text-lg text-white">No Quizzes Found</h3>
          <p className="text-sm">Try choosing a different category or search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="glass-card rounded-3xl p-6 border border-white/10 hover:border-amber-500/40 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 pointer-events-none" />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-white/5 text-xs font-medium text-slate-300">
                    {quiz.category}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/20">
                    {quiz.difficulty}
                  </span>
                </div>

                <h3 className="font-display font-bold text-lg text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                  {quiz.title}
                </h3>
                <p className="text-slate-400 text-sm mt-1.5 line-clamp-2 leading-relaxed">
                  {quiz.description}
                </p>

                <div className="grid grid-cols-3 gap-2 mt-5 p-3 rounded-2xl bg-white/5 border border-white/5 text-center text-xs">
                  <div>
                    <span className="text-slate-500 block">Questions</span>
                    <span className="font-bold text-white mt-0.5">{quiz.total_questions}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Duration</span>
                    <span className="font-bold text-white mt-0.5">{quiz.duration_seconds}s</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Reward</span>
                    <span className="font-bold text-emerald-400 mt-0.5">+{quiz.total_points} pts</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                {quiz.is_completed_by_user ? (
                  <Link
                    to={`/quizzes/${quiz.id}/play`}
                    className="w-full py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-emerald-500/20 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Passed ({quiz.user_points_earned || quiz.total_points} pts) • Replay</span>
                  </Link>
                ) : (
                  <Link
                    to={`/quizzes/${quiz.id}/play`}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 hover:opacity-95 flex items-center justify-center gap-2 group-hover:scale-[1.01] transition-all"
                  >
                    <span>Start Quiz</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
