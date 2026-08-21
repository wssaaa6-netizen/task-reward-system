import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, HelpCircle, X, CheckCircle2, Clock, Brain, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { QuizListItem } from '../../types';

interface QuestionForm {
  question: string;
  question_type: string;
  options: string[];
  correct_option_index: number;
  explanation: string;
  points: number;
}

export const AdminQuizzesPage: React.FC = () => {
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Technology');
  const [difficulty, setDifficulty] = useState('Medium');
  const [duration, setDuration] = useState(180);
  const [questions, setQuestions] = useState<QuestionForm[]>([
    {
      question: '',
      question_type: 'MULTIPLE_CHOICE',
      options: ['', '', '', ''],
      correct_option_index: 0,
      explanation: '',
      points: 20,
    },
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/quizzes');
      if (res.data?.success) {
        setQuizzes(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingQuizId(null);
    setTitle('');
    setDescription('');
    setCategory('Technology');
    setDifficulty('Medium');
    setDuration(180);
    setQuestions([
      {
        question: 'Sample Question 1',
        question_type: 'MULTIPLE_CHOICE',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correct_option_index: 0,
        explanation: 'Detailed explanation for this answer.',
        points: 20,
      },
    ]);
    setModalOpen(true);
  };

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        question: `Question ${prev.length + 1}`,
        question_type: 'MULTIPLE_CHOICE',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correct_option_index: 0,
        explanation: 'Explanation here...',
        points: 20,
      },
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOptionChange = (qIndex: number, optIndex: number, val: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex].options[optIndex] = val;
      return updated;
    });
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;
    try {
      await api.delete(`/admin/quizzes/${quizId}`);
      loadQuizzes();
    } catch (err) {
      console.error('Failed to delete quiz:', err);
    }
  };

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      category,
      difficulty,
      duration_seconds: Number(duration),
      passing_score_percentage: 60,
      questions,
      status: 'ACTIVE',
    };

    try {
      if (editingQuizId) {
        await api.put(`/admin/quizzes/${editingQuizId}`, payload);
      } else {
        await api.post('/admin/quizzes', payload);
      }
      setModalOpen(false);
      loadQuizzes();
    } catch (err) {
      console.error('Failed to save quiz:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-3xl text-white">
            Quiz Studio
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Build interactive timed quizzes with custom questions, options, and explanations.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 hover:opacity-95 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Quiz</span>
        </button>
      </div>

      {/* Quizzes Table */}
      <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs text-slate-400 uppercase tracking-wider">
                <th className="pb-3 font-semibold">Quiz Title</th>
                <th className="pb-3 font-semibold">Category</th>
                <th className="pb-3 font-semibold">Questions</th>
                <th className="pb-3 font-semibold">Duration</th>
                <th className="pb-3 font-semibold">Points</th>
                <th className="pb-3 font-semibold">Attempts</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">Loading quiz library...</td>
                </tr>
              ) : quizzes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">No quizzes in catalog.</td>
                </tr>
              ) : (
                quizzes.map((quiz) => (
                  <tr key={quiz.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 font-bold text-white max-w-xs truncate">
                      {quiz.title}
                    </td>
                    <td className="py-3.5 text-xs text-slate-300">{quiz.category}</td>
                    <td className="py-3.5 text-xs text-slate-400">{quiz.total_questions} Questions</td>
                    <td className="py-3.5 text-xs text-slate-400">{quiz.duration_seconds}s</td>
                    <td className="py-3.5 font-bold text-emerald-400">+{quiz.total_points} pts</td>
                    <td className="py-3.5 text-xs text-slate-400">{quiz.attempts_count}</td>
                    <td className="py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleDeleteQuiz(quiz.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
                        title="Delete Quiz"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QUIZ BUILDER MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="glass-panel w-full max-w-3xl rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="font-display font-bold text-2xl text-white">
              Quiz Builder Studio
            </h2>

            <form onSubmit={handleSaveQuiz} className="space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-300 uppercase block mb-1">Quiz Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Modern Web Development & React"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 uppercase block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Technology">Technology</option>
                    <option value="Coding">Coding</option>
                    <option value="General Knowledge">General Knowledge</option>
                    <option value="Education">Education</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 uppercase block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Test your knowledge of..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500 resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-300 uppercase block mb-1">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-300 uppercase block mb-1">Timer Duration (Seconds)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white font-mono"
                    required
                  />
                </div>
              </div>

              {/* QUESTIONS LIST */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-base text-white">
                    Questions ({questions.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center gap-1 hover:bg-amber-500/30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Question</span>
                  </button>
                </div>

                {questions.map((q, qIdx) => (
                  <div key={qIdx} className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-400">Question #{qIdx + 1}</span>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIdx)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) => {
                        const updated = [...questions];
                        updated[qIdx].question = e.target.value;
                        setQuestions(updated);
                      }}
                      placeholder="Enter question text..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-sm text-white"
                      required
                    />

                    {/* Options */}
                    <div className="grid grid-cols-2 gap-2">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct_${qIdx}`}
                            checked={q.correct_option_index === optIdx}
                            onChange={() => {
                              const updated = [...questions];
                              updated[qIdx].correct_option_index = optIdx;
                              setQuestions(updated);
                            }}
                            className="text-emerald-500"
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                            placeholder={`Option ${optIdx + 1}`}
                            className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-xs text-white"
                            required
                          />
                        </div>
                      ))}
                    </div>

                    {/* Explanation */}
                    <input
                      type="text"
                      value={q.explanation}
                      onChange={(e) => {
                        const updated = [...questions];
                        updated[qIdx].explanation = e.target.value;
                        setQuestions(updated);
                      }}
                      placeholder="Explanation for the correct answer..."
                      className="w-full bg-black/30 border border-white/10 rounded-xl p-2 text-xs text-slate-300"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20"
                >
                  {saving ? 'Publishing Quiz...' : 'Save & Publish Quiz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
