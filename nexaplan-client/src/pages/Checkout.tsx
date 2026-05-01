import React from 'react';
import { Lock, Shield } from 'lucide-react';

interface CheckoutProps {
  onNavigate: (view: string) => void;
  onStartCheckout: () => void;
  isLoading: boolean;
  planLabel: string;
  companyName: string;
  setCompanyName: (value: string) => void;
  streetAddress: string;
  setStreetAddress: (value: string) => void;
  city: string;
  setCity: (value: string) => void;
  postalCode: string;
  setPostalCode: (value: string) => void;
}

export function Checkout({
  onNavigate,
  onStartCheckout,
  isLoading,
  planLabel,
  companyName,
  setCompanyName,
  streetAddress,
  setStreetAddress,
  city,
  setCity,
  postalCode,
  setPostalCode,
}: CheckoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 pt-12 pb-24 px-8 font-['Inter']">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => onNavigate('landing')} className="hover:opacity-80 transition-opacity">
            <span className="font-black text-2xl">
              <span className="text-[#0052FF]">Nexa</span>
              <span className="text-[#0A192F]">Plan</span>
            </span>
          </button>
          <div className="flex items-center gap-2 text-slate-500 font-semibold">
            <Shield className="w-5 h-5" />
            <span className="text-sm">256-bit SSL Secure Checkout</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Billing Details</h3>

              <div className="space-y-4">
                <div>
                  <label htmlFor="checkoutCompany" className="block text-sm font-semibold text-slate-900 mb-2">Company Name</label>
                  <input
                    id="checkoutCompany"
                    type="text"
                    value={companyName || 'Modulus Visentra'}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0052FF] outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="streetAddress" className="block text-sm font-semibold text-slate-900 mb-2">Street Address</label>
                  <input
                    id="streetAddress"
                    type="text"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="123 Ayala Avenue"
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0052FF] outline-none transition-all"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-semibold text-slate-900 mb-2">City</label>
                    <input
                      id="city"
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Davao City"
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0052FF] outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="postalCode" className="block text-sm font-semibold text-slate-900 mb-2">Postal Code</label>
                    <input
                      id="postalCode"
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="8000"
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0052FF] outline-none transition-all"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-3">Pay securely with PayMongo</h3>
              <p className="text-sm text-slate-600 mb-4">
                You will be redirected to PayMongo Checkout to complete payment using card, GCash, or Maya.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-slate-700">
                This app does not store card or wallet details. PayMongo handles all payment information.
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg sticky top-8">
              <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4">Order Summary</h3>

              <div className="mt-6">
                <div className="font-bold text-slate-900 mb-4">{planLabel}</div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Software License</span>
                    <span className="font-semibold text-slate-900">P9,999.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">x 12 months</span>
                    <span className="font-semibold text-slate-900">P119,988.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Setup Fee</span>
                    <span className="font-semibold text-green-600">P0.00</span>
                  </div>
                </div>

                <div className="border-t-2 border-slate-200 mt-6 pt-6">
                  <div className="text-sm font-bold text-slate-500 mb-2">Total Due Today</div>
                  <div className="text-3xl font-black text-[#0A192F]">P119,988.00</div>
                </div>

                <button
                  onClick={onStartCheckout}
                  disabled={isLoading}
                  className="w-full bg-[#10B981] hover:bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg mt-8 flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-70"
                >
                  <Lock className="w-5 h-5" />
                  {isLoading ? 'Starting checkout...' : 'Proceed to PayMongo'}
                </button>

                <p className="text-xs text-slate-500 text-center mt-4">
                  By completing this purchase, you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
