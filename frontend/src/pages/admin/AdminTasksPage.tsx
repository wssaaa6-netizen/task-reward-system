import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, ListTodo, X, Loader2, Award, Clock } from 'lucide-react';
import { api } from '../../services/api';
import { Task } from '../../types';

export const AdminTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Daily Challenge');
  const [difficulty, setDifficulty] = useState('Easy');
  const [points, setPoints] = useState(150);
  const [timeLimit, setTimeLimit] = useState(10);
  const [instructions, setInstructions] = useState('Step 1: Read challenge prompt\nStep 2: Submit proof');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tasks?status=ALL');
      if (res.data?.success) {
        setTasks(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setCategory('Daily Challenge');
    setDifficulty('Easy');
    setPoints(150);
    setTimeLimit(10);
    setInstructions('Step 1: Complete activity\nStep 2: Submit verification');
    setModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setCategory(task.category);
    setDifficulty(task.difficulty);
    setPoints(task.points);
    setTimeLimit(task.time_limit_minutes);
    setInstructions(task.instructions.join('\n'));
    setModalOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/admin/tasks/${taskId}`);
      loadTasks();
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      category,
      difficulty,
      points: Number(points),
      time_limit_minutes: Number(timeLimit),
      instructions: instructions.split('\n').filter((s) => s.trim().length > 0),
      verification_type: 'AUTO',
      status: 'ACTIVE',
    };

    try {
      if (editingTask) {
        await api.put(`/admin/tasks/${editingTask.id}`, payload);
      } else {
        await api.post('/admin/tasks', payload);
      }
      setModalOpen(false);
      loadTasks();
    } catch (err) {
      console.error('Error saving task:', err);
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
            Task Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Create, edit, and publish earning activities for users.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 hover:opacity-95 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Task</span>
        </button>
      </div>

      {/* Task List Table */}
      <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs text-slate-400 uppercase tracking-wider">
                <th className="pb-3 font-semibold">Title</th>
                <th className="pb-3 font-semibold">Category</th>
                <th className="pb-3 font-semibold">Difficulty</th>
                <th className="pb-3 font-semibold">Points</th>
                <th className="pb-3 font-semibold">Completions</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">Loading tasks...</td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">No tasks created yet.</td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 font-bold text-white max-w-xs truncate">
                      {task.title}
                    </td>
                    <td className="py-3.5 text-xs text-slate-300">{task.category}</td>
                    <td className="py-3.5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white/5 border border-white/10 text-slate-300">
                        {task.difficulty}
                      </span>
                    </td>
                    <td className="py-3.5 font-bold text-emerald-400">+{task.points} pts</td>
                    <td className="py-3.5 text-xs text-slate-400">{task.completions_count}</td>
                    <td className="py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {task.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(task)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
                        title="Edit Task"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
                        title="Delete Task"
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

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="glass-panel w-full max-w-xl rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-5">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="font-display font-bold text-2xl text-white">
              {editingTask ? 'Edit Task' : 'Create New Activity Task'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-300 uppercase block mb-1">Task Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Python Syntax Debugging Challenge"
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 uppercase block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what the user needs to do..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500 resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 uppercase block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white"
                  >
                    <option value="Daily Challenge">Daily Challenge</option>
                    <option value="Coding">Coding</option>
                    <option value="Technology">Technology</option>
                    <option value="Education">Education</option>
                    <option value="Survey">Survey</option>
                    <option value="Reading">Reading</option>
                    <option value="Special Event">Special Event</option>
                  </select>
                </div>

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
                    <option value="Expert">Expert</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-300 uppercase block mb-1">Points</label>
                  <input
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white font-bold text-emerald-400"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 uppercase block mb-1">Time (mins)</label>
                  <input
                    type="number"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 uppercase block mb-1">
                  Instructions (1 per line)
                </label>
                <textarea
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono resize-none"
                />
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
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-lg shadow-emerald-500/20"
                >
                  {saving ? 'Saving...' : 'Publish Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
