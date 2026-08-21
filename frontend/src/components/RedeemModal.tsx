import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, Sparkles, Loader2, Smartphone, CreditCard, Building2, Gift, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Reward, Redemption } from '../types';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface RedeemModalProps {
  reward: Reward | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const RedeemModal: React.FC<RedeemModalProps> = ({ reward, onClose, onSuccess }) => {
  const { user, refreshProfile } = useAuth();
  const [mobileNumber, setMobileNumber] = useState(user?.mobile || '');
  const [operator, setOperator] = useState('Airtel');
  const [circle, setCircle] = useState('Delhi / NCR');
  const [upiId, setUpiId] = useState('');
  const [accountHolder, setAccountHolder] = useState(user?.full_name || '');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [giftEmail, setGiftEmail] = useState(user?.email || '');

  const [step, setStep] = useState<'form' | 'confirm' | 'receipt'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Redemption | null>(null);

  if (!reward) return null;

  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (reward.type === 'MOBILE_RECHARGE') {
      if (!mobileNumber || mobileNumber.trim().length < 10) {
        setError('Please enter a valid 10-digit mobile number.');
        return;
      }
    } else if (reward.type === 'UPI_PAYOUT') {
      if (!upiId || !upiId.includes('@')) {
        setError('Please enter a valid UPI ID (e.g., username@bank).');
        return;
      }
    } else if (reward.type === 'BANK_TRANSFER') {
      if (!accountNumber || !ifscCode || !accountHolder) {
        setError('Please fill in complete Bank details (Holder, Account, IFSC).');
        return;
      }
    } else if (reward.type === 'GIFT_CARD') {
      if (!giftEmail || !giftEmail.includes('@')) {
        setError('Please enter a valid email address.');
        return;
      }
    }

    setStep('confirm');
  };

  const handleFinalRedeem = async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        reward_id: reward.id,
        mobile_number: mobileNumber.trim(),
        operator,
        circle,
        upi_id: upiId.trim(),
        account_holder_name: accountHolder.trim(),
        account_number: accountNumber.trim(),
        ifsc_code: ifscCode.trim(),
        bank_name: bankName,
        gift_email: giftEmail.trim(),
      };

      const res = await api.post('/redemptions', payload);
      if (res.data?.success) {
        setReceipt(res.data.data);
        setStep('receipt');
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
        await refreshProfile();
        onSuccess();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Redemption failed. Please try again.');
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* STEP 1: FORM */}
        {step === 'form' && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Demo Redemption
              </span>
            </div>

            <h2 className="font-display font-bold text-2xl text-white">
              Redeem {reward.name}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Required: <strong className="text-emerald-400">{reward.required_points.toLocaleString()} Points</strong> • Demo Value: <strong className="text-amber-300">₹{reward.demo_cash_value.toFixed(2)}</strong>
            </p>

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleProceedToConfirm} className="mt-5 space-y-4">
              {reward.type === 'MOBILE_RECHARGE' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Prepaid Mobile Number
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Telecom Operator
                      </label>
                      <select
                        value={operator}
                        onChange={(e) => setOperator(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Airtel">Airtel</option>
                        <option value="Jio">Reliance Jio</option>
                        <option value="Vi">Vodafone Idea (Vi)</option>
                        <option value="BSNL">BSNL Prepaid</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Circle / State
                      </label>
                      <select
                        value={circle}
                        onChange={(e) => setCircle(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Delhi / NCR">Delhi / NCR</option>
                        <option value="Mumbai">Mumbai</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                        <option value="All India">All India</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {reward.type === 'UPI_PAYOUT' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    UPI VPA Address (Virtual Payment Address)
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="yourname@okhdfcbank or phone@paytm"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">Supports Google Pay, PhonePe, Paytm, BHIM.</p>
                </div>
              )}

              {reward.type === 'BANK_TRANSFER' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      placeholder="Full Name as on Bank Account"
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Bank Account Number
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Account Number"
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                        placeholder="e.g. HDFC0001234"
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500 uppercase font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="e.g. State Bank of India"
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {reward.type === 'GIFT_CARD' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Delivery Email Address
                  </label>
                  <input
                    type="email"
                    value={giftEmail}
                    onChange={(e) => setGiftEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">Simulated e-gift card voucher will be delivered to this address.</p>
                </div>
              )}

              {/* Notice */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <span>
                  <strong>Sandbox Notice:</strong> This redemption will run through the simulated sandbox provider. No real fiat money is deducted from external bank accounts.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 hover:opacity-95"
                >
                  Review Order
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: CONFIRMATION */}
        {step === 'confirm' && (
          <div>
            <h2 className="font-display font-bold text-2xl text-white">
              Confirm Redemption
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Please double check the details before confirming.
            </p>

            <div className="mt-5 space-y-3 bg-white/5 p-4 rounded-2xl border border-white/10 text-sm">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Reward</span>
                <span className="font-semibold text-white">{reward.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Points to Debit</span>
                <span className="font-bold text-emerald-400">-{reward.required_points.toLocaleString()} pts</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Simulated Cash Value</span>
                <span className="font-bold text-amber-300">₹{reward.demo_cash_value.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Target</span>
                <span className="font-mono text-xs text-white">
                  {reward.type === 'MOBILE_RECHARGE' ? `${operator} (${mobileNumber})` :
                   reward.type === 'UPI_PAYOUT' ? upiId :
                   reward.type === 'BANK_TRANSFER' ? `${bankName} (XXXX-XXXX-${accountNumber.slice(-4)})` :
                   giftEmail}
                </span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-xs text-amber-200 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
              <span>
                <strong>DEMO TRANSACTION:</strong> No real funds will be transferred. All transactions remain demo.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white"
              >
                Back
              </button>
              <button
                onClick={handleFinalRedeem}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 hover:opacity-95 flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Demo Payout...</span>
                  </>
                ) : (
                  <span>Confirm & Redeem</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: RECEIPT */}
        {step === 'receipt' && receipt && (
          <div className="py-4 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="font-display font-extrabold text-2xl text-white">
              Redemption Successful! 🎉
            </h3>

            <p className="text-slate-300 text-sm max-w-sm mx-auto">
              Your simulated redemption for <strong>{receipt.reward_name}</strong> (₹{receipt.demo_cash_value.toFixed(2)} Demo Value) has been processed.
            </p>

            {/* Receipt Box */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left text-xs space-y-2 font-mono text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="text-emerald-400 font-bold">{receipt.transaction_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Destination:</span>
                <span className="text-white">{receipt.target_destination}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Points Debited:</span>
                <span className="text-red-400">-{receipt.points_spent.toLocaleString()} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="text-emerald-400 font-bold uppercase">{receipt.status}</span>
              </div>
            </div>

            <p className="text-amber-400/90 text-xs font-semibold">
              {receipt.demo_disclaimer}
            </p>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
