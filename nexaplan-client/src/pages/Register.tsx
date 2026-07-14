import React, { useState } from 'react';
import { Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';

interface RegisterProps {
  onNavigate: (view: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  firstName: string;
  setFirstName: (value: string) => void;
  lastName: string;
  setLastName: (value: string) => void;
  registerEmail: string;
  setRegisterEmail: (value: string) => void;
  companyName: string;
  setCompanyName: (value: string) => void;
  registerPassword: string;
  setRegisterPassword: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
  orgType: string;
  setOrgType: (value: string) => void;
  planLabel: string;
  errorMessage?: string;
  acceptTerms: boolean;
  setAcceptTerms: (value: boolean) => void;
}

interface PasswordRule {
  label: string;
  test: (pw: string) => boolean;
}

const passwordRules: PasswordRule[] = [
  { label: 'At least 12 characters', test: (pw) => pw.length >= 12 },
  { label: 'One uppercase letter (A-Z)', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'One lowercase letter (a-z)', test: (pw) => /[a-z]/.test(pw) },
  { label: 'One number (0-9)', test: (pw) => /\d/.test(pw) },
  { label: 'One special character (@, #, !, $...)', test: (pw) => /[^a-zA-Z\d]/.test(pw) },
];

const strengthColors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-emerald-500'];
const strengthTextColors = ['', 'text-red-500', 'text-orange-500', 'text-yellow-500', 'text-blue-500', 'text-emerald-600'];
const strengthLabels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];

function getStrength(pw: string): number {
  return passwordRules.filter((r) => r.test(pw)).length;
}

export function Register({
  onNavigate,
  onSubmit,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  registerEmail,
  setRegisterEmail,
  companyName,
  setCompanyName,
  registerPassword,
  setRegisterPassword,
  phone,
  setPhone,
  orgType,
  setOrgType,
  planLabel,
  errorMessage,
  acceptTerms,
  setAcceptTerms,
}: RegisterProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const strength = getStrength(registerPassword);
  const allRulesPassed = strength === passwordRules.length;
  const canSubmit = allRulesPassed && acceptTerms;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-['Inter']">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-10">

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <div className="shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center font-bold text-sm">!</div>
            <div className="flex-1 text-sm font-semibold">{errorMessage}</div>
          </div>
        )}

        <div className="text-center">
          <button onClick={() => onNavigate('landing')} className="hover:opacity-80 transition-opacity">
            <span className="font-black text-2xl">
              <span className="text-[#0052FF]">Nexa</span>
              <span className="text-[#0A192F]">Plan</span>
            </span>
          </button>
        </div>

        <h2 className="text-3xl font-extrabold text-slate-900 text-center mt-6">
          Create your NexaPlan workspace
        </h2>
        <p className="text-slate-600 text-center mt-2">Plan: {planLabel}</p>

        <form onSubmit={onSubmit} className="mt-8">

          {/* Row 1: Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-semibold text-slate-900 mb-2">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Juan"
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0052FF] outline-none transition-all"
                required
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-semibold text-slate-900 mb-2">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Dela Cruz"
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0052FF] outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Row 2: Company + Org Type */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="companyName" className="block text-sm font-semibold text-slate-900 mb-2">
                Company Name
              </label>
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., Modulus Visentra"
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0052FF] outline-none transition-all"
                required
              />
            </div>
            <div>
              <label htmlFor="orgType" className="block text-sm font-semibold text-slate-900 mb-2">
                Organization Type
              </label>
              <select
                id="orgType"
                value={orgType}
                onChange={(e) => setOrgType(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0052FF] outline-none transition-all"
                required
              >
                <option value="Corporate">Corporate</option>
                <option value="Government">Government / NGO</option>
                <option value="Education">Education</option>
              </select>
            </div>
          </div>

          {/* Row 3: Email + Phone */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="registerEmail" className="block text-sm font-semibold text-slate-900 mb-2">
                Work Email
              </label>
              <input
                id="registerEmail"
                type="email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0052FF] outline-none transition-all"
                required
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-slate-900 mb-2">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+63 900 000 0000"
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0052FF] outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="mt-4">
            <label htmlFor="registerPassword" className="block text-sm font-semibold text-slate-900 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="registerPassword"
                type={showPassword ? 'text' : 'password'}
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                placeholder="Min. 12 characters"
                className={`w-full bg-white border rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-[#0052FF] outline-none transition-all ${
                  registerPassword.length > 0 && !allRulesPassed
                    ? 'border-amber-400 focus:ring-amber-400'
                    : registerPassword.length > 0 && allRulesPassed
                    ? 'border-emerald-400 focus:ring-emerald-400'
                    : 'border-slate-300'
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Strength bar */}
            {registerPassword.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        i <= strength ? strengthColors[strength] : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs font-semibold ${strengthTextColors[strength]}`}>
                  {strengthLabels[strength]}
                </p>
              </div>
            )}

            {/* Rules checklist */}
            {(passwordFocused || registerPassword.length > 0) && (
              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                {passwordRules.map((rule) => {
                  const passed = rule.test(registerPassword);
                  return (
                    <div key={rule.label} className="flex items-center gap-2 text-sm">
                      {passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                      )}
                      <span className={passed ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                        {rule.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Terms & Conditions */}
          <div className="mt-5 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                id="acceptTerms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#0052FF] cursor-pointer flex-shrink-0"
              />
              <span className="text-sm text-slate-600 leading-relaxed">
                I have read and agree to NexaPlan's{' '}
                <button
                  type="button"
                  onClick={() => onNavigate('terms')}
                  className="text-[#0052FF] font-bold hover:underline"
                >
                  Terms and Conditions
                </button>{' '}
                and acknowledge the password security requirements.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-[#0052FF] hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg mt-6 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-slate-600">Already have an account? </span>
          <button
            onClick={() => onNavigate('login')}
            className="text-[#0052FF] font-bold hover:underline"
          >
            Log in
          </button>
        </div>
      </div>
    </div>
  );
}
