import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Coins, Lock, Mail, User, Phone, Tag, ArrowRight, AlertCircle, Loader2, Sparkles, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref.toUpperCase());
    }
  }, [searchParams]);

  // Password strength checks
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!isPasswordValid) {
      setError('Password must meet all 4 security requirements.');
      return;
    }

    setLoading(true);

    try {
      await register({
        full_name: fullName.trim(),
        email: email.trim(),
        mobile: mobile.trim() || undefined,
        password,
        confirm_password: confirmPassword,
        referral_code: referralCode.trim() || undefined,
      });
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Registration failed. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-xl shadow-emerald-500/25 group-hover:scale-105 transition-transform">
              <Coins className="w-7 h-7" />
            </div>
          </Link>
          <h1 className="font-display font-extrabold text-3xl text-white">
            Create Your Account
          </h1>
          <p className="text-slate-400 text-sm">
            Join Task2Cash and get an instant <strong className="text-emerald-400">+50 points welcome bonus!</strong>
          </p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-3xl p-7 sm:p-8 border border-white/10 shadow-2xl relative">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Raghav Sharma"
                  className="w-full bg-slate-900/80 dark:bg-slate-900/80 light:bg-white border border-white/15 dark:border-white/15 light:border-slate-300 rounded-xl pl-10 pr-3.5 py-3 text-sm text-white dark:text-white light:text-slate-900 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-900/80 dark:bg-slate-900/80 light:bg-white border border-white/15 dark:border-white/15 light:border-slate-300 rounded-xl pl-10 pr-3.5 py-3 text-sm text-white dark:text-white light:text-slate-900 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Mobile (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 uppercase tracking-wider mb-1.5">
                Mobile Number <span className="text-slate-500 text-[10px] normal-case">(Optional for recharge)</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  maxLength={15}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="9876543210"
                  className="w-full bg-slate-900/80 dark:bg-slate-900/80 light:bg-white border border-white/15 dark:border-white/15 light:border-slate-300 rounded-xl pl-10 pr-3.5 py-3 text-sm text-white dark:text-white light:text-slate-900 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/80 dark:bg-slate-900/80 light:bg-white border border-white/15 dark:border-white/15 light:border-slate-300 rounded-xl pl-10 pr-3.5 py-3 text-sm text-white dark:text-white light:text-slate-900 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  required
                />
              </div>

              {/* Real-time Password Strength Check */}
              {password && (
                <div className="grid grid-cols-2 gap-1.5 mt-2 text-[11px]">
                  <div className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                    <Check className="w-3 h-3" /> Min 8 characters
                  </div>
                  <div className={`flex items-center gap-1 ${hasUpper ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                    <Check className="w-3 h-3" /> 1 Uppercase letter
                  </div>
                  <div className={`flex items-center gap-1 ${hasLower ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                    <Check className="w-3 h-3" /> 1 Lowercase letter
                  </div>
                  <div className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                    <Check className="w-3 h-3" /> 1 Number
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/80 dark:bg-slate-900/80 light:bg-white border border-white/15 dark:border-white/15 light:border-slate-300 rounded-xl pl-10 pr-3.5 py-3 text-sm text-white dark:text-white light:text-slate-900 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Referral Code (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 uppercase tracking-wider mb-1.5">
                Referral Code <span className="text-emerald-400 text-[10px] normal-case">(Bonus Points)</span>
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="e.g. T2C-RAGHU123"
                  className="w-full bg-slate-900/80 dark:bg-slate-900/80 light:bg-white border border-white/15 dark:border-white/15 light:border-slate-300 rounded-xl pl-10 pr-3.5 py-3 text-sm text-white dark:text-white light:text-slate-900 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono uppercase"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm shadow-xl shadow-emerald-500/25 hover:opacity-95 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Get +50 Pts</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <p className="text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-emerald-400 hover:text-emerald-300">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};
