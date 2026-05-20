import React, { useState } from 'react';
import { Shield, Mail, CheckCircle2, RefreshCw, ArrowLeft, Lock, KeyRound, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { apiUrl } from '../../config/api';

interface UserSecurityViewProps {
  onBack: () => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

type MfaStep = 'idle' | 'otp_sent' | 'verified';

export function UserSecurityView({ onBack, addToast }: UserSecurityViewProps) {
  const storedUser = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
  const token = localStorage.getItem('token') || '';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-Tenant-Id': String(storedUser.tenantId || 0),
    'X-User-Id': String(storedUser.userId || 0),
  };

  // ── MFA State ──────────────────────────────────────────────────
  const [mfaEnabled, setMfaEnabled] = useState<boolean>(storedUser.mfaEnabled ?? false);
  const [mfaStep, setMfaStep]       = useState<MfaStep>('idle');
  const [otpValue, setOtpValue]     = useState('');
  const [devOtp, setDevOtp]         = useState<string | null>(null);
  const [mfaBusy, setMfaBusy]       = useState(false);

  // ── Password Change State ──────────────────────────────────────
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [pwBusy, setPwBusy] = useState(false);

  // ── MFA Handlers ───────────────────────────────────────────────
  const sendOtp = async () => {
    setMfaBusy(true);
    try {
      const res = await fetch(apiUrl('/api/mfa/send-otp'), { method: 'POST', headers });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to send OTP.' }));
        throw new Error(err.message);
      }
      const data = await res.json().catch(() => ({}));
      if (data.devOtp) {
        setDevOtp(data.devOtp);
        setOtpValue(data.devOtp);
      } else {
        setDevOtp(null);
      }
      setMfaStep('otp_sent');
      addToast('OTP sent to your registered email address.', 'info');
    } catch (e: any) {
      addToast(e.message || 'Could not send OTP.', 'error');
    } finally {
      setMfaBusy(false);
    }
  };

  const verifyOtp = async () => {
    if (otpValue.length !== 6) { addToast('Enter the 6-digit code from your email.', 'error'); return; }
    setMfaBusy(true);
    try {
      const res = await fetch(apiUrl('/api/mfa/verify-otp'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ otp: otpValue }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Verification failed.' }));
        throw new Error(err.message);
      }
      setMfaStep('verified');
      setMfaEnabled(true);
      // Persist to localStorage so UI reflects new state
      localStorage.setItem('user', JSON.stringify({ ...storedUser, mfaEnabled: true }));
      addToast('Email MFA enabled successfully!', 'success');
    } catch (e: any) {
      addToast(e.message || 'Invalid or expired OTP.', 'error');
    } finally {
      setMfaBusy(false);
    }
  };

  const disableMfa = async () => {
    setMfaBusy(true);
    try {
      const res = await fetch(apiUrl('/api/mfa/disable'), { method: 'POST', headers });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Could not disable MFA.' }));
        throw new Error(err.message);
      }
      setMfaEnabled(false);
      setMfaStep('idle');
      setOtpValue('');
      localStorage.setItem('user', JSON.stringify({ ...storedUser, mfaEnabled: false }));
      addToast('Email MFA has been disabled.', 'info');
    } catch (e: any) {
      addToast(e.message || 'Could not disable MFA.', 'error');
    } finally {
      setMfaBusy(false);
    }
  };

  // ── Password Change Handler ────────────────────────────────────
  const handlePasswordChange = async () => {
    if (!pwForm.current || !pwForm.next || !pwForm.confirm) {
      addToast('All password fields are required.', 'error'); return;
    }
    if (pwForm.next !== pwForm.confirm) {
      addToast('New passwords do not match.', 'error'); return;
    }
    if (pwForm.next.length < 8) {
      addToast('New password must be at least 8 characters.', 'error'); return;
    }
    setPwBusy(true);
    try {
      const res = await fetch(apiUrl('/api/auth/change-password'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Password change failed.' }));
        throw new Error(err.message);
      }
      setPwForm({ current: '', next: '', confirm: '' });
      addToast('Password changed successfully.', 'success');
    } catch (e: any) {
      addToast(e.message || 'Could not change password.', 'error');
    } finally {
      setPwBusy(false);
    }
  };

  const pwInput = (field: 'current' | 'next' | 'confirm', placeholder: string, label: string) => (
    <div>
      <label className="block text-xs font-black text-slate-500 uppercase mb-2">{label}</label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type={showPw[field] ? 'text' : 'password'}
          value={pwForm[field]}
          onChange={e => setPwForm(p => ({ ...p, [field]: e.target.value }))}
          className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm font-medium"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setShowPw(p => ({ ...p, [field]: !p[field] }))}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {showPw[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Security Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your MFA and password</p>
        </div>
      </div>

      {/* MFA Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${mfaEnabled ? 'bg-emerald-100' : 'bg-slate-100'}`}>
              <Shield className={`w-5 h-5 ${mfaEnabled ? 'text-emerald-600' : 'text-slate-500'}`} />
            </div>
            <div>
              <h3 className="font-black text-slate-900">Email Multi-Factor Authentication</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {mfaEnabled ? 'Your account is protected with email OTP.' : 'Add an extra layer of security to your account.'}
              </p>
            </div>
          </div>
          <span className={`text-xs font-black px-3 py-1 rounded-full ${mfaEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
            {mfaEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        {/* MFA Setup Flow */}
        {!mfaEnabled && mfaStep === 'idle' && (
          <div className="bg-slate-50 rounded-xl p-4 flex items-start gap-3">
            <Mail className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-slate-700 font-semibold">How it works</p>
              <p className="text-xs text-slate-500 mt-0.5">
                When enabled, a 6-digit verification code will be sent to <strong>{storedUser.email || 'your email'}</strong> whenever you sign in.
              </p>
            </div>
          </div>
        )}

        {!mfaEnabled && mfaStep === 'otp_sent' && (
          <div className="space-y-3">
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-700 font-medium flex items-center gap-2">
              <Mail className="w-4 h-4 shrink-0" />
              OTP sent to <strong>{storedUser.email}</strong>. Check your inbox.
            </div>
            {devOtp && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 font-bold flex items-center gap-2 animate-pulse">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                [Dev Mode] OTP Code: {devOtp} (Auto-filled below)
              </div>
            )}
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase mb-2">Enter 6-Digit Code</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpValue}
                  onChange={e => setOtpValue(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-xl font-mono font-bold tracking-widest text-center"
                  placeholder="000000"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={verifyOtp}
                disabled={mfaBusy || otpValue.length !== 6}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 transition-all"
              >
                {mfaBusy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Verify & Enable MFA
              </button>
              <button onClick={() => { setMfaStep('idle'); setOtpValue(''); }} className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50">Cancel</button>
            </div>
          </div>
        )}

        {mfaStep === 'verified' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 text-emerald-700">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-sm font-bold">Email MFA is now active on your account.</span>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          {!mfaEnabled ? (
            <button
              onClick={sendOtp}
              disabled={mfaBusy || mfaStep === 'otp_sent'}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-all"
            >
              {mfaBusy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              {mfaStep === 'otp_sent' ? 'OTP Sent' : 'Enable via Email OTP'}
            </button>
          ) : (
            <button
              onClick={disableMfa}
              disabled={mfaBusy}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl font-bold text-sm disabled:opacity-50 transition-all"
            >
              {mfaBusy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
              Disable MFA
            </button>
          )}
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center">
            <Lock className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h3 className="font-black text-slate-900">Change Password</h3>
            <p className="text-xs text-slate-500 mt-0.5">Minimum 8 characters required.</p>
          </div>
        </div>

        <div className="space-y-4">
          {pwInput('current', 'Current password', 'Current Password')}
          {pwInput('next', 'New password (min 8 chars)', 'New Password')}
          {pwInput('confirm', 'Confirm new password', 'Confirm Password')}
        </div>

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            onClick={handlePasswordChange}
            disabled={pwBusy}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50"
          >
            {pwBusy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {pwBusy ? 'Updating…' : 'Update Password'}
          </button>
        </div>
      </div>
    </div>
  );
}
