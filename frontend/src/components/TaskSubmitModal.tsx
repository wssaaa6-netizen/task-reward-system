import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  Award,
  Send,
  AlertCircle,
  Loader2,
  Sparkles,
  Flame,
  Gift,
  HelpCircle,
  BookOpen,
  Code,
  ArrowRight,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Task, TaskSubmissionResponse } from '../types';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface TaskSubmitModalProps {
  task: Task | null;
  onClose: () => void;
  onSuccess: (result?: TaskSubmissionResponse) => void;
}

export const TaskSubmitModal: React.FC<TaskSubmitModalProps> = ({ task, onClose, onSuccess }) => {
  const { user, refreshProfile } = useAuth();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [readingTimer, setReadingTimer] = useState(0);
  const [hasFinishedReading, setHasFinishedReading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<TaskSubmissionResponse | null>(null);
  const [prevBalance, setPrevBalance] = useState(user?.points || 0);

  useEffect(() => {
    if (task) {
      setSelectedOption(null);
      setTextAnswer('');
      setError(null);
      setSubmissionResult(null);
      setPrevBalance(user?.points || 0);

      const minSeconds = task.interactive_data?.min_reading_seconds || 10;
      setReadingTimer(minSeconds);
      setHasFinishedReading(minSeconds <= 0);

      if (task.interactive_data?.type === 'READING' && minSeconds > 0) {
        const interval = setInterval(() => {
          setReadingTimer((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              setHasFinishedReading(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        return () => clearInterval(interval);
      }
    }
  }, [task]);

  if (!task) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const intData = task.interactive_data;
    if (intData?.type === 'QUIZ' || intData?.type === 'TRUE_FALSE') {
      if (selectedOption === null) {
        setError('Please select an answer to complete the challenge.');
        return;
      }
    }

    if (intData?.type === 'TEXT_ANSWER' || intData?.type === 'CODE_SUBMIT') {
      if (!textAnswer.trim()) {
        setError('Please enter your answer in the field below.');
        return;
      }
    }

    if (intData?.type === 'READING' && !hasFinishedReading) {
      setError(`Please spend at least ${readingTimer} more seconds reading the passage.`);
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/tasks/submit', {
        task_id: task.id,
        selected_option_index: selectedOption !== null ? selectedOption : undefined,
        text_answer: textAnswer.trim() || undefined,
        text_proof: textAnswer.trim() || 'Verified task completion',
        reading_time_seconds: 15,
      });

      if (res.data?.success) {
        const data: TaskSubmissionResponse = res.data.data;
        setSubmissionResult(data);

        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#10b981', '#34d399', '#f59e0b', '#fbbf24', '#ffffff'],
        });

        await refreshProfile();
        onSuccess(data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit task. Please check your answer and try again.');
    } finally {
      setLoading(false);
    }
  };

  const intData = task.interactive_data;
  const isCompleted = Boolean(submissionResult);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-xl rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {isCompleted && submissionResult ? (
          /* Attractive Success Screen */
          <div className="py-6 flex flex-col items-center text-center space-y-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-2xl shadow-emerald-500/40 animate-bounce">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <div className="absolute -bottom-1 -right-1 p-1 bg-amber-400 rounded-full text-slate-950">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                Challenge Complete
              </span>
              <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white">
                🎉 TASK COMPLETED!
              </h2>
            </div>

            {/* Points Awarded Badge */}
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 shadow-lg shadow-emerald-500/10">
              <Award className="w-6 h-6 text-emerald-400" />
              <span className="font-display font-black text-2xl text-emerald-300">
                +{task.points} POINTS
              </span>
            </div>

            {/* Daily Bonus Callout if awarded */}
            {submissionResult.daily_bonus_awarded > 0 && (
              <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 text-amber-200 text-sm flex items-center justify-center gap-3 animate-pulse">
                <Gift className="w-6 h-6 text-amber-400 shrink-0" />
                <div className="text-left">
                  <p className="font-bold text-amber-300">🎉 DAILY BONUS UNLOCKED!</p>
                  <p className="text-xs text-amber-200/90">
                    You completed 3 tasks today and earned an extra <strong>+300 Bonus Points</strong>!
                  </p>
                </div>
              </div>
            )}

            {/* Balance Animation Card */}
            <div className="w-full p-4 rounded-2xl bg-slate-900/80 border border-white/10 text-sm flex items-center justify-between">
              <span className="text-slate-400 font-medium">Your Points Balance:</span>
              <div className="flex items-center gap-2 font-display font-bold">
                <span className="text-slate-400 line-through">{prevBalance.toLocaleString()}</span>
                <span className="text-emerald-400">→</span>
                <span className="text-emerald-300 text-lg">
                  {submissionResult.new_wallet_balance.toLocaleString()} pts
                </span>
              </div>
            </div>

            {/* Next Encouragement Note */}
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-white/5 px-4 py-2 rounded-xl">
              <Flame className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {submissionResult.daily_tasks_completed_count < 3
                  ? `Keep going! Complete ${3 - submissionResult.daily_tasks_completed_count} more task${3 - submissionResult.daily_tasks_completed_count > 1 ? 's' : ''} today to unlock your +300 Daily Bonus!`
                  : 'You have unlocked today’s 3-task bonus! Continue exploring tasks to maximize points.'}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="w-full pt-2 flex items-center gap-3">
              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-500/25 hover:opacity-95 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
              >
                <span>Find Another Task</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Interactive Task Form */
          <div>
            {/* Category / Difficulty Tag */}
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/20">
                {task.category}
              </span>
              <span>•</span>
              <span className="text-slate-300">{task.difficulty}</span>
              {task.is_daily && (
                <>
                  <span>•</span>
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <Flame className="w-3 h-3" /> Today's Quick Task
                  </span>
                </>
              )}
            </div>

            <h2 className="font-display font-bold text-2xl text-white">
              {task.title}
            </h2>

            <div className="flex items-center gap-4 mt-3 pb-4 border-b border-white/10 text-sm">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>~{task.time_limit_minutes} minutes</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Award className="w-4 h-4" />
                <span>+{task.points} Reward Points</span>
              </div>
            </div>

            {/* Overview / Instructions */}
            <p className="text-slate-300 text-sm mt-3 leading-relaxed">
              {task.description}
            </p>

            {/* Error Banner */}
            {error && (
              <div className="mt-4 p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Interactive Section */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Option 1: Quiz / Multiple Choice or True/False */}
              {(intData?.type === 'QUIZ' || intData?.type === 'TRUE_FALSE') && (
                <div className="space-y-3 bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-white/10">
                  <div className="flex items-start gap-2.5">
                    <HelpCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-white text-sm sm:text-base">
                        {intData.question || 'Select the correct answer:'}
                      </h4>
                      {intData.hint && (
                        <p className="text-xs text-slate-400 mt-1">
                          💡 Hint: {intData.hint}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mt-3">
                    {intData.options?.map((option, idx) => {
                      const isSelected = selectedOption === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedOption(idx)}
                          className={`w-full p-3.5 rounded-xl text-left text-sm font-medium transition-all flex items-center justify-between border ${
                            isSelected
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-md shadow-emerald-500/10'
                              : 'bg-white/5 text-slate-300 border-white/10 hover:border-emerald-500/40 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                                isSelected
                                  ? 'bg-emerald-500 text-slate-950'
                                  : 'bg-white/10 text-slate-400'
                              }`}
                            >
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span>{option}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Option 2: Reading Passage with Timer */}
              {intData?.type === 'READING' && (
                <div className="space-y-3 bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                      <BookOpen className="w-4 h-4" />
                      <span>Reading Passage</span>
                    </div>
                    {!hasFinishedReading && (
                      <span className="text-xs font-mono bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full border border-amber-500/30 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {readingTimer}s remaining
                      </span>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-slate-300 text-sm leading-relaxed whitespace-pre-line font-sans">
                    {intData.reading_passage}
                  </div>

                  <div className="pt-2 flex items-center gap-2 text-xs text-slate-400">
                    <CheckCircle2
                      className={`w-4 h-4 ${
                        hasFinishedReading ? 'text-emerald-400' : 'text-slate-600'
                      }`}
                    />
                    <span>
                      {hasFinishedReading
                        ? 'Reading requirement satisfied! Click below to confirm and claim points.'
                        : `Please spend at least ${readingTimer} more seconds reviewing the concepts.`}
                    </span>
                  </div>
                </div>
              )}

              {/* Option 3: Text Answer / Beginner Coding */}
              {(intData?.type === 'TEXT_ANSWER' || intData?.type === 'CODE_SUBMIT') && (
                <div className="space-y-3 bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-white/10">
                  <div className="flex items-start gap-2.5">
                    <Code className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-white text-sm sm:text-base">
                        {intData.question || 'Enter your code or verification response:'}
                      </h4>
                      {intData.hint && (
                        <p className="text-xs text-slate-400 mt-1">
                          💡 Hint: {intData.hint}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3">
                    <input
                      type="text"
                      value={textAnswer}
                      onChange={(e) => setTextAnswer(e.target.value)}
                      placeholder="e.g. def"
                      className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Fallback default proof input if no interactive_data specified */}
              {!intData && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Completion Proof / Comments
                  </label>
                  <textarea
                    rows={3}
                    value={textAnswer}
                    onChange={(e) => setTextAnswer(e.target.value)}
                    placeholder="Enter your verification answer or brief completion notes..."
                    className="w-full bg-slate-900/80 border border-white/15 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                  />
                </div>
              )}

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || (intData?.type === 'READING' && !hasFinishedReading)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-500/25 hover:opacity-95 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit & Earn +{task.points} Pts</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
