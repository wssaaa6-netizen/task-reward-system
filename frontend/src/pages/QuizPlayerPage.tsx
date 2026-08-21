import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Timer,
  Award,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  HelpCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { QuizPlayResponse, QuizResultResponse } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const QuizPlayerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [quizData, setQuizData] = useState<QuizPlayResponse | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<number>(180);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResultResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());

  const timerRef = useRef<any>(null);

  useEffect(() => {
    loadQuiz();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      setUserAnswers({});
      setCurrentQIndex(0);

      const res = await api.get(`/quizzes/${id}/play`);
      if (res.data?.success) {
        const data: QuizPlayResponse = res.data.data;
        setQuizData(data);
        setTimeLeft(data.duration_seconds || 180);
        setStartTime(Date.now());

        // Start countdown timer
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              handleAutoSubmit();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load quiz questions.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleAutoSubmit = () => {
    handleSubmitQuiz();
  };

  const handleSubmitQuiz = async () => {
    if (!quizData || submitting) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setSubmitting(true);
    const timeTaken = Math.max(1, Math.round((Date.now() - startTime) / 1000));

    const formattedAnswers = Object.entries(userAnswers).map(([qId, optIdx]) => ({
      question_id: qId,
      selected_option_index: optIdx,
    }));

    try {
      const res = await api.post('/quizzes/submit', {
        quiz_id: quizData.id,
        time_taken_seconds: timeTaken,
        answers: formattedAnswers,
      });

      if (res.data?.success) {
        const resData: QuizResultResponse = res.data.data;
        setResult(resData);

        if (resData.passed) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
        await refreshProfile();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error scoring quiz attempt.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          <p className="text-sm">Preparing questions arena...</p>
        </div>
      </div>
    );
  }

  if (error || !quizData) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Quiz Unavailable</h2>
        <p className="text-slate-400 text-sm">{error || 'Could not load the requested quiz.'}</p>
        <Link
          to="/quizzes"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Quizzes</span>
        </Link>
      </div>
    );
  }

  // --- RESULT VIEW ---
  if (result) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-8 animate-in fade-in duration-200">
        {/* Result Header Card */}
        <div className="glass-panel rounded-3xl p-8 text-center border border-white/15 shadow-2xl relative overflow-hidden">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-xl">
            {result.passed ? (
              <CheckCircle2 className="w-12 h-12 animate-bounce" />
            ) : (
              <XCircle className="w-12 h-12 text-amber-400" />
            )}
          </div>

          <h1 className="font-display font-extrabold text-3xl text-white mt-4">
            {result.passed ? 'Quiz Passed! 🎉' : 'Quiz Completed'}
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-md mx-auto">
            {result.message}
          </p>

          {/* KPI Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
              <span className="text-xs text-slate-400 block">Score</span>
              <span className="font-display font-extrabold text-xl text-white">
                {result.score} / {result.total_score}
              </span>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
              <span className="text-xs text-slate-400 block">Accuracy</span>
              <span className="font-display font-extrabold text-xl text-amber-300">
                {result.accuracy_percentage}%
              </span>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
              <span className="text-xs text-slate-400 block">Points Earned</span>
              <span className="font-display font-extrabold text-xl text-emerald-400">
                +{result.points_earned}
              </span>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
              <span className="text-xs text-slate-400 block">Time Taken</span>
              <span className="font-display font-extrabold text-xl text-white">
                {result.time_taken_seconds}s
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={loadQuiz}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry Quiz</span>
            </button>
            <Link
              to="/quizzes"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/20 hover:opacity-95 flex items-center justify-center gap-2 transition-all"
            >
              <span>Explore More Quizzes</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Detailed Question Explanations Breakdown */}
        <div className="space-y-4">
          <h2 className="font-display font-bold text-xl text-white">
            Answers & Explanations Review
          </h2>

          <div className="space-y-4">
            {result.question_reviews.map((q, idx) => (
              <div
                key={idx}
                className={`glass-card rounded-2xl p-6 border transition-colors ${
                  q.is_correct ? 'border-emerald-500/30' : 'border-red-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-white/10 text-white text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h3 className="font-semibold text-white text-base">{q.question}</h3>
                  </div>
                  {q.is_correct ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400">
                      +{q.points_awarded} pts
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400">
                      0 pts
                    </span>
                  )}
                </div>

                {/* Options List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                  {q.options.map((opt, optIdx) => {
                    const isUserChoice = q.selected_option_index === optIdx;
                    const isCorrect = q.correct_option_index === optIdx;

                    let badgeStyle = 'bg-white/5 border-white/10 text-slate-400';
                    if (isCorrect) {
                      badgeStyle = 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-semibold';
                    } else if (isUserChoice && !isCorrect) {
                      badgeStyle = 'bg-red-500/20 border-red-500/40 text-red-300 font-semibold';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between ${badgeStyle}`}
                      >
                        <span>{opt}</span>
                        {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        {isUserChoice && !isCorrect && <XCircle className="w-4 h-4 text-red-400" />}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Box */}
                {q.explanation && (
                  <div className="mt-3.5 p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-300 leading-relaxed">
                    <strong className="text-amber-400 font-semibold block mb-0.5">Explanation:</strong>
                    {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- ACTIVE QUIZ TAKING VIEW ---
  const currentQ = quizData.questions[currentQIndex];
  const progressPercent = Math.round(((currentQIndex + 1) / quizData.questions.length) * 100);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-6">
      {/* Top Header Card: Title, Timer & Question Counter */}
      <div className="glass-panel rounded-3xl p-6 border border-white/15 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider block">
            {quizData.category} Challenge
          </span>
          <h1 className="font-display font-bold text-xl text-white mt-0.5 line-clamp-1">
            {quizData.title}
          </h1>
        </div>

        {/* Live Timer */}
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl border font-mono font-bold text-base shadow-sm ${
            timeLeft < 30
              ? 'bg-red-500/20 border-red-500/40 text-red-400 animate-pulse'
              : 'bg-white/5 border-white/10 text-emerald-400'
          }`}
        >
          <Timer className="w-4 h-4" />
          <span>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            Question <strong>{currentQIndex + 1}</strong> of {quizData.questions.length}
          </span>
          <span>{progressPercent}% completed</span>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/15 shadow-xl space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-2">
            <span>+{currentQ.points} Reward Points</span>
          </div>
          <h2 className="font-display font-bold text-xl sm:text-2xl text-white leading-relaxed">
            {currentQ.question}
          </h2>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {currentQ.options.map((option, optIdx) => {
            const isSelected = userAnswers[currentQ.id] === optIdx;
            return (
              <button
                key={optIdx}
                type="button"
                onClick={() => handleSelectOption(currentQ.id, optIdx)}
                className={`w-full p-4 rounded-2xl border text-left text-sm sm:text-base font-medium transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-lg shadow-amber-500/10'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{option}</span>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    isSelected ? 'border-amber-400 bg-amber-400 text-slate-950 font-bold text-xs' : 'border-white/20'
                  }`}
                >
                  {isSelected && '✓'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation & Submit Footer */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentQIndex === 0}
          className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-sm disabled:opacity-30 disabled:pointer-events-none flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        {currentQIndex < quizData.questions.length - 1 ? (
          <button
            type="button"
            onClick={() => setCurrentQIndex((prev) => Math.min(quizData.questions.length - 1, prev + 1))}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/20 hover:opacity-95 flex items-center gap-2 transition-all"
          >
            <span>Next Question</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmitQuiz}
            disabled={submitting}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-display font-extrabold text-sm shadow-xl shadow-amber-500/25 hover:scale-105 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Evaluating Answers...</span>
              </>
            ) : (
              <>
                <Award className="w-4 h-4" />
                <span>Submit Quiz Now</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
