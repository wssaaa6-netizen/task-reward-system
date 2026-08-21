import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Gift, X, CheckCircle2, Sparkles, Smartphone, CreditCard, Building2 } from 'lucide-react';
import { api } from '../../services/api';
import { Reward } from '../../types';

export const AdminRewardsPage: React.FC = () => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  // Form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('MOBILE_RECHARGE');
  const [requiredPoints, setRequiredPoints] = useState(1000);
  const [demoCashValue, setDemoCashValue] = useState(10);
  const [minLevel, setMinLevel] = useState('Bronze');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = async () => {
    try {
      setLoading(true);
      const res = await api.get('/rewards');
      if (res.data?.success) {
        setRewards(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load rewards:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingReward(null);
    setName('');
    setDescription('');
    setType('MOBILE_RECHARGE');
    setRequiredPoints(1000);
    setDemoCashValue(10);
    setMinLevel('Bronze');
    setModalOpen(true);
  };

  const handleOpenEdit = (reward: Reward) => {
    setEditingReward(reward);
    setName(reward.name);
    setDescription(reward.description);
    setType(reward.type);
    setRequiredPoints(reward.required_points);
    setDemoCashValue(reward.demo_cash_value);
    setMinLevel(reward.min_level_required);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this reward?')) return;
    try {
      await api.delete(`/admin/rewards/${id}`);
      loadRewards();
    } catch (err) {
      console.error('Failed to delete reward:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name: name.trim(),
      description: description.trim(),
      type,
      required_points: Number(requiredPoints),
      demo_cash_value: Number(demoCashValue),
      min_level_required: minLevel,
      status: 'ACTIVE',
    };

    try {
      if (editingReward) {
        await api.put(`/admin/rewards/${editingReward.id}`, payload);
      } else {
        await api.post('/admin/rewards', payload);
      }
      setModalOpen(false);
      loadRewards();
    } catch (err) {
      console.error('Error saving reward:', err);
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
            Rewards Marketplace Catalog
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage point prices, demo payout values, and reward categories.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 hover:opacity-95 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Reward</span>
        </button>
      </div>

      {/* Rewards Grid */}
      <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs text-slate-400 uppercase tracking-wider">
                <th className="pb-3 font-semibold">Reward</th>
                <th className="pb-3 font-semibold">Type</th>
                <th className="pb-3 font-semibold">Points Required</th>
                <th className="pb-3 font-semibold">Demo Cash Value</th>
                <th className="pb-3 font-semibold">Min Level</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Loading rewards catalog...</td>
                </tr>
              ) : rewards.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No rewards created.</td>
                </tr>
              ) : (
                rewards.map((r) => (
                  <tr key={r.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 font-bold text-white max-w-xs truncate">{r.name}</td>
                    <td className="py-3.5 text-xs text-slate-300">{r.type}</td>
                    <td className="py-3.5 font-bold text-emerald-400">{r.required_points.toLocaleString()} pts</td>
                    <td className="py-3.5 font-bold text-amber-300">₹{r.demo_cash_value.toFixed(2)}</td>
                    <td className="py-3.5 text-xs text-slate-400">{r.min_level_required}</td>
                    <td className="py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(r)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
                        title="Delete"
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
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl relative space-y-4">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="font-display font-bold text-2xl text-white">
              {editingReward ? 'Edit Reward' : 'Add New Reward Option'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-300 uppercase block mb-1">Reward Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. ₹50 Mobile Recharge Voucher"
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 uppercase block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details about redemption..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500 resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 uppercase block mb-1">Reward Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white"
                  >
                    <option value="MOBILE_RECHARGE">MOBILE_RECHARGE</option>
                    <option value="UPI_PAYOUT">UPI_PAYOUT</option>
                    <option value="BANK_TRANSFER">BANK_TRANSFER</option>
                    <option value="GIFT_CARD">GIFT_CARD</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-300 uppercase block mb-1">Min Level</label>
                  <select
                    value={minLevel}
                    onChange={(e) => setMinLevel(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white"
                  >
                    <option value="Bronze">Bronze</option>
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                    <option value="Platinum">Platinum</option>
                    <option value="Diamond">Diamond</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 uppercase block mb-1">Points Required</label>
                  <input
                    type="number"
                    value={requiredPoints}
                    onChange={(e) => setRequiredPoints(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white font-bold text-emerald-400"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 uppercase block mb-1">Demo Value (₹)</label>
                  <input
                    type="number"
                    value={demoCashValue}
                    onChange={(e) => setDemoCashValue(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white font-bold text-amber-300"
                    required
                  />
                </div>
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
                  {saving ? 'Saving...' : 'Save Reward'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
