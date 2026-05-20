import React, { useState } from 'react';
import { Mail, KeyRound, Lock, Eye, EyeOff, CheckCircle2, RefreshCw, AlertTriangle, ArrowLeft, ShieldAlert } from 'lucide-react';
import { apiUrl } from '../config/api';

interface ForgotPasswordPageProps {
  onBack: () => void;
}

type Step = 'email' | 'otp' | 'newpassword' | 'done';

export function ForgotPasswordPage({ onBack }: ForgotPasswordPageProps) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(apiUrl('/api/auth/request-password-reset'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to send reset code.');
      if (data.devOtp) {
        setDevOtp(data.devOtp);
        setOtp(data.devOtp);
      }
      setStep('otp');
    } catch (e: any) {
      setError(e.message || 'Could not send reset code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { setError('Please enter the 6-digit code.'); return; }
    setError('');
    setStep('newpassword');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) { setError('Both password fields are required.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(apiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Password reset failed.');
      setStep('done');
    } catch (e: any) {
      setError(e.message || 'Password reset failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const stepConfig = [
    { label: 'Enter Email', icon: Mail },
    { label: 'Verify Code', icon: KeyRound },
    { label: 'New Password', icon: Lock },
  ];
  const stepIndex = step === 'email' ? 0 : step === 'otp' ? 1 : step === 'newpassword' ? 2 : 3;

  return (
    <div className="h-screen w-full flex font-['Inter'] bg-[#F8FAFC]">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0A192F] items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="relative text-center px-16">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-900/50">
            <ShieldAlert className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-black text-white mb-4 leading-tight">Account Recovery</h2>
          <p className="text-blue-200 text-sm leading-relaxed">
            We'll send a secure verification code to your registered email address to confirm your identity before allowing a password reset.
          </p>
          <div className="mt-8 space-y-3">
            {stepConfig.map((s, i) => {
              const Icon = s.icon;
              const isCompleted = i < stepIndex;
              const isActive = i === stepIndex;
              return (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? 'bg-white/15' : isCompleted ? 'bg-white/5' : 'opacity-40'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isCompleted ? 'bg-emerald-500' : isActive ? 'bg-[#0052FF]' : 'bg-white/10'}`}>
                    {isCompleted ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Icon className="w-4 h-4 text-white" />}
                  </div>
                  <span className={`text-sm font-bold ${isActive ? 'text-white' : isCompleted ? 'text-emerald-300' : 'text-blue-300'}`}>
                    Step {i + 1}: {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 lg:px-16 xl:px-24 relative">
        <button
          onClick={onBack}
          className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-[#0052FF] transition-colors font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </button>

        <div className="absolute top-8 right-8">
          <span className="font-black text-2xl">
            <span className="text-[#0052FF]">Nexa</span>
            <span className="text-[#0A192F]">Plan</span>
          </span>
        </div>

        <div className="max-w-md w-full mx-auto">
          {/* Step: Email */}
          {step === 'email' && (
            <>
              <div className="mb-8">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-[#0052FF]" />
                </div>
                <h1 className="text-3xl font-extrabold text-[#0A192F] mb-2">Reset Password</h1>
                <p className="text-slate-500 text-sm">Enter your registered email address and we'll send you a reset code.</p>
              </div>

              {error && (
                <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}

              <form onSubmit={handleRequestReset} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Work Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(''); }}
                      placeholder="name@company.com"
                      className="w-full pl-11 pr-4 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0052FF] focus:border-[#0052FF] outline-none transition-all text-slate-900"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl font-bold text-white bg-[#0A192F] hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isLoading ? <><RefreshCw className="w-5 h-5 animate-spin" />Sending Code…</> : 'Send Reset Code'}
                </button>
              </form>
            </>
          )}

          {/* Step: OTP */}
          {step === 'otp' && (
            <>
              <div className="mb-8">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                  <KeyRound className="w-6 h-6 text-indigo-600" />
                </div>
                <h1 className="text-3xl font-extrabold text-[#0A192F] mb-2">Check Your Email</h1>
                <p className="text-slate-500 text-sm">
                  We sent a 6-digit code to <strong className="text-slate-700">{email}</strong>. It expires in 10 minutes.
                </p>
              </div>

              {devOtp && (
                <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-xs font-bold text-amber-700">[Dev Mode] Code auto-filled: {devOtp}</span>
                </div>
              )}

              {error && (
                <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Verification Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); }}
                    placeholder="000000"
                    className="w-full py-4 border border-slate-300 rounded-xl text-2xl font-mono font-bold tracking-[0.5em] text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-900"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={otp.length !== 6}
                  className="w-full py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <CheckCircle2 className="w-5 h-5" /> Verify Code
                </button>
                <button
                  type="button"
                  onClick={() => { setStep('email'); setOtp(''); setDevOtp(null); setError(''); }}
                  className="w-full py-2.5 text-sm text-slate-500 hover:text-slate-700 font-semibold"
                >
                  Didn't get a code? Try again
                </button>
              </form>
            </>
          )}

          {/* Step: New Password */}
          {step === 'newpassword' && (
            <>
              <div className="mb-8">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6 text-emerald-600" />
                </div>
                <h1 className="text-3xl font-extrabold text-[#0A192F] mb-2">Set New Password</h1>
                <p className="text-slate-500 text-sm">Choose a strong password of at least 8 characters.</p>
              </div>

              {error && (
                <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => { setNewPassword(e.target.value); setError(''); }}
                      placeholder="Min 8 characters"
                      className="w-full pl-11 pr-12 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                      placeholder="Repeat your new password"
                      className="w-full pl-11 pr-12 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      required
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isLoading ? <><RefreshCw className="w-5 h-5 animate-spin" />Resetting Password…</> : <><Lock className="w-5 h-5" />Reset Password</>}
                </button>
              </form>
            </>
          )}

          {/* Step: Done */}
          {step === 'done' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h1 className="text-3xl font-extrabold text-[#0A192F] mb-3">Password Reset!</h1>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                Your password has been updated successfully. You can now sign in with your new password.
              </p>
              <button
                onClick={onBack}
                className="w-full py-3.5 rounded-xl font-bold text-white bg-[#0A192F] hover:bg-slate-800 transition-all"
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
