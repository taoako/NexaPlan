import React from 'react';

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
}: RegisterProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-['Inter']">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-10">
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center font-bold">!</div>
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

        <h2 className="text-3xl font-extrabold text-slate-900 text-center mt-6">Create your NexaPlan workspace</h2>
        <p className="text-slate-600 text-center mt-2">Plan: {planLabel}</p>

        <form onSubmit={onSubmit} className="mt-8">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-semibold text-slate-900 mb-2">First Name</label>
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
              <label htmlFor="lastName" className="block text-sm font-semibold text-slate-900 mb-2">Last Name</label>
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

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="companyName" className="block text-sm font-semibold text-slate-900 mb-2">Company Name</label>
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
              <label htmlFor="orgType" className="block text-sm font-semibold text-slate-900 mb-2">Organization Type</label>
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

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="registerEmail" className="block text-sm font-semibold text-slate-900 mb-2">Work Email</label>
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
              <label htmlFor="phone" className="block text-sm font-semibold text-slate-900 mb-2">Phone Number</label>
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

          <div className="mt-4">
            <label htmlFor="registerPassword" className="block text-sm font-semibold text-slate-900 mb-2">Password</label>
            <input
              id="registerPassword"
              type="password"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0052FF] outline-none transition-all"
              required
            />
            <p className="text-sm text-slate-500 mt-1">Must be at least 8 characters.</p>
          </div>

          <button type="submit" className="w-full bg-[#0052FF] hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg mt-6 transition-all duration-300">
            Continue
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-slate-600">Already have an account? </span>
          <button onClick={() => onNavigate('login')} className="text-[#0052FF] font-bold hover:underline">Log in</button>
        </div>
      </div>
    </div>
  );
}
