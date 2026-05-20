import React, { useState, useEffect, useRef } from 'react';
import { Shield, Mail, KeyRound, RefreshCw, CheckCircle2, AlertTriangle, ArrowLeft, Lock } from 'lucide-react';
import { apiUrl } from '../config/api';

interface MfaChallengePageProps {
  pendingUserId: number;
  onVerified: (sessionData: any) => void;
  onBack: () => void;
}

const COOLDOWN_SECONDS = 60;

export function MfaChallengePage({ pendingUserId, onVerified, onBack }: MfaChallengePageProps) {
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0); // seconds remaining on resend cooldown

  // Prevent React 18 Strict Mode double-fire
  const hasSentRef = useRef(false);

  useEffect(() => {
    if (hasSentRef.current) return;
    hasSentRef.current = true;
    handleSendCode();
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const handleSendCode = async () => {
    if (isSending || cooldown > 0) return;
    setIsSending(true);
    setError('');
    try {
      const res = await fetch(apiUrl('/api/auth/send-mfa-challenge'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pendingUserId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to send verification code.');
      setCodeSent(true);
      setCooldown(COOLDOWN_SECONDS); // start cooldown after successful send
      if (data.devOtp) {
        setDevOtp(data.devOtp);
        setOtp(data.devOtp);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to send code. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) { setError('Please enter the 6-digit code.'); return; }
    setIsVerifying(true);
    setError('');
    try {
      const res = await fetch(apiUrl('/api/auth/verify-mfa-challenge'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pendingUserId, otp }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Invalid or expired code.');
      onVerified(data);
    } catch (e: any) {
      setError(e.message || 'Verification failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="h-screen w-full flex font-['Inter'] bg-gradient-to-br from-[#0A192F] via-[#0d2444] to-[#0A192F]">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <span className="font-black text-3xl">
              <span className="text-[#0052FF]">Nexa</span>
              <span className="text-white">Plan</span>
            </span>
          </div>

          {/* Card */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
            {/* Shield Icon */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-[#0052FF] to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/50 mb-4">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-black text-white text-center">Two-Factor Verification</h1>
              <p className="text-blue-200 text-sm text-center mt-2 leading-relaxed">
                {codeSent
                  ? 'A 6-digit security code has been sent to your registered email address.'
                  : 'Sending security code to your registered email…'}
              </p>
            </div>

            {/* Dev mode banner */}
            {devOtp && (
              <div className="mb-5 p-3 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
                <span className="text-xs font-bold text-amber-200">[Dev Mode] Code auto-filled: {devOtp}</span>
              </div>
            )}

            {/* OTP Input */}
            <div className="mb-5">
              <label className="block text-xs font-black text-blue-200 uppercase tracking-wider mb-2">
                Verification Code
              </label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleVerify()}
                  placeholder="000000"
                  className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 text-white placeholder-blue-300/50 rounded-xl text-2xl font-mono font-bold tracking-[0.5em] text-center focus:outline-none focus:ring-2 focus:ring-[#0052FF] focus:border-[#0052FF] transition-all"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-400/30 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-300 shrink-0" />
                <span className="text-sm text-red-200">{error}</span>
              </div>
            )}

            {/* Verify Button */}
            <button
              onClick={handleVerify}
              disabled={isVerifying || otp.length !== 6}
              className="w-full py-4 rounded-xl font-black text-white bg-gradient-to-r from-[#0052FF] to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40"
            >
              {isVerifying
                ? <><RefreshCw className="w-5 h-5 animate-spin" />Verifying…</>
                : <><CheckCircle2 className="w-5 h-5" />Verify & Sign In</>}
            </button>

            {/* Resend + Back */}
            <div className="mt-5 flex items-center justify-between">
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-sm text-blue-300 hover:text-white transition-colors font-semibold"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </button>
              <button
                onClick={handleSendCode}
                disabled={isSending || cooldown > 0}
                className="flex items-center gap-1.5 text-sm text-blue-300 hover:text-white transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                {isSending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
              </button>
            </div>

            {/* Security note */}
            <div className="mt-6 pt-5 border-t border-white/10 flex items-center gap-2 justify-center">
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs text-blue-400">Code expires in 5 minutes. Do not share it with anyone.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
