import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

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
  setRememberDevice: (value: boolean) => void;
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
}: LoginProps) {
  return (
    <div className="h-screen w-full flex font-['Inter']">
      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center px-8 lg:px-32 relative">
        <button onClick={() => onNavigate('landing')} className="absolute top-8 left-8 hover:opacity-80 transition-opacity">
          <span className="font-black text-2xl">
            <span className="text-[#0052FF]">Nexa</span>
            <span className="text-[#0A192F]">Plan</span>
          </span>
        </button>

        <div className="max-w-md w-full mx-auto">
          <h1 className="text-4xl font-extrabold text-[#0A192F] mb-2">Welcome back</h1>
          <p className="text-slate-600 mb-8">Log in to your NexaPlan workspace.</p>

          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-900 mb-2">Work Email</label>
              <input
                id="email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0052FF] outline-none transition-all"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-900">Password</label>
                <button type="button" className="text-[#0052FF] text-sm font-semibold hover:underline">Forgot password?</button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0052FF] outline-none transition-all pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                className="w-4 h-4 text-[#0052FF] border-slate-300 rounded focus:ring-[#0052FF]"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-slate-600">Remember this device for 30 days</label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl font-bold text-white bg-[#0A192F] hover:bg-slate-800 transition-all duration-300 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <span className="text-slate-600">Don't have an account? </span>
            <button onClick={() => onNavigate('register')} className="text-[#0052FF] font-bold hover:underline">Start Free Trial</button>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-1/2 bg-[#0A192F] items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>

        <div className="relative bg-white/10 backdrop-blur-md border border-white/20 p-10 rounded-3xl max-w-lg mx-8">
          <div className="text-2xl font-bold text-white leading-relaxed mb-6">
            "NexaPlan completely eliminated our spreadsheet errors. The AI module predicted our Q3 expenses with 98% accuracy."
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full"></div>
            <div>
              <div className="text-white font-bold">Faith Rasonable</div>
              <div className="text-blue-200 text-sm">CFO at Modulus Visentra</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
