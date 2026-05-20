import React from 'react';
import { Eye, EyeOff, X, Mail, Lock, Shield, ArrowRight, ArrowLeft } from 'lucide-react';
import nexaplanLogo from '../assets/brand/nexaplan-logo.png';

interface LoginProps {
  onNavigate: (view: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  isLoading: boolean;
  loginEmail: string;
  setLoginEmail: (value: string) => void;
  loginPassword: string;
  setLoginPassword: (value: string) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  rememberDevice: boolean;
  setRememberDevice?: (value: boolean) => void;
  errorMessage?: string;
  clearError?: () => void;
  onForgotPassword?: () => void;
}

export function Login({
  onNavigate,
  onSubmit,
  isLoading,
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  showPassword,
  setShowPassword,
  rememberDevice,
  setRememberDevice,
  errorMessage,
  clearError,
  onForgotPassword,
}: LoginProps) {
  return (
    <div
      className="min-h-screen w-full flex flex-col font-['Inter']"
      style={{
        background: 'linear-gradient(135deg, #f0f4ff 0%, #e8edf8 40%, #f5f7fb 100%)',
      }}
    >
      {/* Top bar: logo left, back button right */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 pt-6 z-10">
        <div className="flex items-center gap-2">
          <img src={nexaplanLogo} alt="NexaPlan" className="h-8 w-8 object-contain" />
          <span className="font-black text-xl">
            <span className="text-[#0052FF]">Nexa</span>
            <span className="text-[#0A192F]">Plan</span>
          </span>
        </div>
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-[#0052FF] transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
      </div>

      {/* Centered card */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div
          className="w-full max-w-[400px] bg-white rounded-2xl px-8 py-10"
          style={{
            boxShadow: '0 8px 40px rgba(0, 0, 0, 0.10), 0 2px 8px rgba(0, 0, 0, 0.06)',
          }}
        >
          {/* Lock icon avatar */}
          <div className="flex flex-col items-center mb-6">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, #0052FF 0%, #3b7cff 100%)' }}
            >
              <Lock className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-[24px] font-black text-[#0A192F]">Welcome Back</h1>
            <p className="text-[13px] text-slate-500 mt-1">Sign in to access your workspace</p>
          </div>

          {/* Error banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700">
              <div className="shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                <span className="font-bold text-sm">!</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs">Authentication Failed</div>
                <div className="text-xs opacity-90 mt-0.5 break-words">{errorMessage}</div>
              </div>
              <button onClick={clearError} className="p-1 hover:bg-red-200 rounded-full transition-colors shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="your.email@company.com"
                  className="w-full bg-[#f8f9fb] border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-[13px] text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-[#0052FF]/30 focus:border-[#0052FF] outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className="block text-[12px] font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-[#0052FF] text-[12px] font-semibold hover:underline"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#f8f9fb] border border-slate-200 rounded-xl pl-10 pr-12 py-2.5 text-[13px] text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-[#0052FF]/30 focus:border-[#0052FF] outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2 pt-1">
              <input
                id="remember"
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice?.(e.target.checked)}
                className="w-3.5 h-3.5 text-[#0052FF] border-slate-300 rounded focus:ring-[#0052FF] cursor-pointer"
              />
              <label htmlFor="remember" className="text-[12px] text-slate-600 cursor-pointer select-none">
                Remember for 30 days
              </label>
            </div>

            {/* Sign In button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-bold text-[14px] text-white flex items-center justify-center gap-2 transition-all duration-200 mt-2"
              style={{
                background: isLoading
                  ? '#94a3b8'
                  : 'linear-gradient(135deg, #0052FF 0%, #2563EB 100%)',
                boxShadow: isLoading ? 'none' : '0 4px 16px rgba(0,82,255,0.35)',
              }}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* New to NexaPlan */}
          <div className="mt-5 text-center">
            <p className="text-[12px] text-slate-500 mb-3">
              New to NexaPlan?{' '}
            </p>
            <button
              onClick={() => onNavigate('register')}
              className="w-full py-2.5 rounded-xl font-bold text-[14px] text-[#0A192F] border-2 border-slate-200 hover:border-[#0052FF] hover:text-[#0052FF] transition-all duration-200"
            >
              Start Free Trial
            </button>
          </div>

          {/* SSL notice */}
          <div className="mt-6 flex items-center justify-center gap-1.5">
            <Shield className="w-3 h-3 text-slate-400" />
            <span className="text-[11px] text-slate-400">Protected by 256-bit SSL encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
}
